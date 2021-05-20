import re
import json
import itertools
import argparse
import mmap
#from nltk.corpus import wordnet


PATH_TO_RULE_DEFINITION_FILE = 'pizza_parsing_rules.txt'
domain_name = 'Pizza'
PATH_TO_JSON_OUTFILE = 'PizzaParsingRules.json'


class Transpiler(object):
    """A class for transpiling rules written in a DSL into an expanded JSON format."""

    def __init__(self, rules_definition, domain_name):
        """Initialize a Transpiler object."""
        rules_definition = rules_definition.splitlines()

        self.domain_name = domain_name
        # Build a Grammar object
        self.grammar = Grammar(rules_definition=rules_definition)

        # Built a set of Pattern objects
        self.patterns = self._init_build_patterns(
            rules_definition=rules_definition,
            domain_name=domain_name
        )

        # Exhaustively execute its production rules to compile a set of regular-expression patterns
        self._init_compile_regular_expressions()

        # Write out a JSON file
        #self.json_file = self._write_json_file(path_to_json_outfile=None)

    def _init_build_patterns(self, rules_definition, domain_name):
        """Parse the definitions file to build a set of Pattern objects."""
        patterns = []
        last_rule_head_name = None
        for i, line in enumerate(rules_definition):
            line = line.lstrip().rstrip('\n')
            if line == '' or line.startswith('#'):
                # It's a blank line or a comment -- move on
                continue
            if line.startswith('[['):
                # Record the name of this rule head, in case any ontology element URI or BPMN cell label name is
                # attributed to its corresponding pattern
                last_rule_head_name = line.split(' -> ')[0][2:-2]
                continue
            if line.startswith('$o:') or line.startswith('$o_t:'):
                # Attribute the ontology element URI to the pattern corresponding to the last named rule head
                ontology_element_uri = line.split(':', 1)[1]
                assert last_rule_head_name, "An ontology element URI {uri} is associated with no rule head".format(
                    uri=ontology_element_uri
                )
                try:
                    associated_pattern = next(pattern for pattern in patterns if pattern.name == last_rule_head_name)
                except StopIteration:
                    associated_pattern = Pattern(
                        name=last_rule_head_name,
                        domain_name=domain_name,
                        nonterminal_symbol=self.grammar.find_nonterminal(name=last_rule_head_name)
                    )
                    patterns.append(associated_pattern)
                associated_pattern.ontology_element_uri = ontology_element_uri
                associated_pattern.activity_termination = line.startswith('$o_t:')
            elif line.startswith('$l:') or line.startswith('$l_t:'):
                # Attribute the BPMN cell label name to the pattern corresponding to the last named rule head
                bpmn_label_name = line.split(':', 1)[1]
                assert last_rule_head_name, "A BPMN cell label {label} is associated with no rule head".format(
                    label=bpmn_label_name
                )
                try:
                    associated_pattern = next(pattern for pattern in patterns if pattern.name == last_rule_head_name)
                except StopIteration:
                    associated_pattern = Pattern(
                        name=last_rule_head_name,
                        domain_name=domain_name,
                        nonterminal_symbol=self.grammar.find_nonterminal(name=last_rule_head_name)
                     )
                    patterns.append(associated_pattern)
                associated_pattern.bpmn_label_name = bpmn_label_name
                associated_pattern.activity_termination = line.startswith('$l_t:')
            else:
                raise Exception("Couldn't parse line {i}: {line}".format(i=i, line=line))
        return patterns

    def _init_compile_regular_expressions(self):
        """Compile all of the defined regular-expression patterns."""
        for pattern in self.patterns:
            # Exhaustively derive all regular expressions associated with this pattern
            regular_expression_components = self.grammar.exhaustively_derive_expansions_of_nonterminal_symbol(
                nonterminal_symbol=pattern.nonterminal_symbol
            )
            # Aggregate them into a single composite expression using an OR operator
            regular_expression = '|'.join(regular_expression_components)
            # Expand the simplified '*' notation into '.*'
            regular_expression = regular_expression.replace('*', '.*')
            pattern.regex = regular_expression

    def get_rules(self):
        ruleset_object = []
        for pattern in self.patterns:
            pattern_object = {
                "domainName": pattern.domain_name,
                "pattern": pattern.regex,
                "ontologyUri": pattern.ontology_element_uri,
                "label": pattern.bpmn_label_name,
                "activityTermination": pattern.activity_termination
            }
            ruleset_object.append(pattern_object)

        return ruleset_object

    def _write_json_file(self, path_to_json_outfile):
        """Write out a JSON file."""
        # Construct the corresponding Python data structure
        ruleset_object = []
        for pattern in self.patterns:
            pattern_object = {
                "domainName": pattern.domain_name,
                "pattern": pattern.regex,
                "ontologyUri": pattern.ontology_element_uri,
                "label": pattern.bpmn_label_name,
                "activityTermination": pattern.activity_termination
            }
            ruleset_object.append(pattern_object)
        # Convert to pretty-printed JSON
        json_file_str = json.dumps(ruleset_object, sort_keys=True, indent=2)

        return json_file_str

class Pattern(object):
    """A pattern in the form of a regular expression and data associated with matches to the pattern."""

    def __init__(self, name, domain_name, nonterminal_symbol):
        """Initialize a Pattern object."""
        self.name = name
        self.domain_name = domain_name
        self.nonterminal_symbol = nonterminal_symbol
        self.ontology_element_uri = None  # Gets set by Transpiler._init_compile_patterns()
        self.bpmn_label_name = None  # Gets set by Transpiler._init_compile_patterns()
        self.activity_termination = None  # Gets set by Transpiler._init_compile_patterns()
        self.regex = None  # Gets set by Transpiler._init_compile_regular_expressions()


class Grammar(object):
    """A context-free grammar."""

    def __init__(self, rules_definition):
        """Initialize a Grammar object."""
        # Process the rule definitions to construct a data representation of the grammar
        self.nonterminal_symbols, self.production_rules = self._init_parse_rule_definitions(
            rules_definition=rules_definition
        )
        # Resolve symbol references in the rule bodies
        self._init_resolve_symbol_references_in_production_rule_bodies()
        # Resolve WordNet hyponym references in rule bodies
        self._init_resolve_wordnet_hyponym_references_in_production_rule_bodies()

    @staticmethod
    def _init_parse_rule_definitions(rules_definition):
        """Process the rule definitions to construct a data representation of the grammar."""
        nonterminal_symbols = []
        production_rules = []
        production_rule_definitions = [line.strip('\n') for line in rules_definition if line.startswith('[[')]
        for rule_definition in production_rule_definitions:
            raw_rule_head, raw_rule_bodies = rule_definition.split(' -> ')
            # Construct a NonterminalSymbol object for the rule head
            rule_head = NonterminalSymbol(name=raw_rule_head[2:-2])
            nonterminal_symbols.append(rule_head)
            for raw_rule_body in raw_rule_bodies.split(','):
                # Construct ProductionRule objects for each of the rule bodies
                assert raw_rule_body, "\033[91mEmpty rule body for nonterminal '{symbol}'\033[0m".format(
                    symbol=raw_rule_head
                )
                production_rule = ProductionRule(head=rule_head, raw_body=raw_rule_body)
                rule_head.production_rules.append(production_rule)
                production_rules.append(production_rule)
        return nonterminal_symbols, production_rules

    def _init_resolve_symbol_references_in_production_rule_bodies(self):
        """Resolve references to nonterminal symbols in the production-rule bodies."""
        for production_rule in self.production_rules:
            rule_body = []
            body_tokens = re.split(r'(\[\[|\]\])', production_rule.raw_body)
            skip_next_token = False
            for i, token in enumerate(body_tokens):
                if skip_next_token:
                    skip_next_token = False
                    continue
                elif token == '[[':
                    # It's a reference to a nonterminal symbol -- retrieve the symbol and append it to the rule body
                    referenced_symbol_name = body_tokens[i+1]
                    referenced_symbol = self.find_nonterminal(name=referenced_symbol_name)
                    rule_body.append(referenced_symbol)
                    skip_next_token = True
                elif token == ']]':
                    continue
                else:
                    # It's a terminal symbol, so append it to the body
                    rule_body.append(token)
            production_rule.body = rule_body

    def _init_resolve_wordnet_hyponym_references_in_production_rule_bodies(self):
        """Generate production rules in accordance to WordNet hyponym references in rule body."""
        for production_rule in list(self.production_rules):
            if production_rule.raw_body.startswith('$wn:'):
                # Construct the WordNet representation for the hypernym
                _, part_of_speech, hypernym = production_rule.raw_body.split(':')
                if part_of_speech == 'noun':
                    part_of_speech_marker = 'n'
                else:
                    raise Exception(
                        "Invalid part of speech '{pos}' in WordNet expression: {expression}".format(
                            pos=part_of_speech,
                            expression=production_rule.raw_body
                        )
                    )
                hypernym_wordnet_representation = "{word}.{pos}.01".format(word=hypernym, pos=part_of_speech_marker)
                # Retrieve hyponyms and generate corresponding production rules
                for hyponym_object in wordnet.synset(hypernym_wordnet_representation).hyponyms():
                    # Construct the actual hyponym
                    hyponym = hyponym_object.lemmas()[0].name().replace('_', ' ')
                    # Instantiate a production rule that rewrites the nonterminal symbol as the hyponym
                    new_production_rule = ProductionRule(head=production_rule.head, raw_body=hyponym)
                    new_production_rule.body = [hyponym]
                    production_rule.head.production_rules.append(new_production_rule)
                # Remove the production rule with the WordNet reference
                production_rule.head.production_rules.remove(production_rule)
                self.production_rules.remove(production_rule)

    def exhaustively_derive_expansions_of_nonterminal_symbol(self, nonterminal_symbol):
        """Exhaustively derive all possible expansions of the given nonterminal symbol.

        If a production rule of this symbol references another nonterminal that has not been expanded yet,
        this method will make a call to this same method for that nonterminal symbol to recursively
        expand it. In this way, another symbol may call this method for this symbol if it needs to expand
        it to execute one of its production rules. We'll make heavy use of generators in this method,
        so that we only ever keep one expansion in memory at a time.
        """
        all_terminal_results = (
            self._exhaustively_derive_results_of_production_rule(production_rule=production_rule)
            for production_rule in nonterminal_symbol.production_rules
        )
        for terminal_result in itertools.chain.from_iterable(all_terminal_results):
            yield terminal_result

    def _exhaustively_derive_results_of_production_rule(self, production_rule):
        """Exhaustively derive all possible results of executing the given production rule."""
        all_component_variations = (
            self.exhaustively_derive_expansions_of_nonterminal_symbol(nonterminal_symbol=symbol)
            if isinstance(symbol, NonterminalSymbol) else [symbol]
            for symbol in production_rule.body
        )
        all_possible_results = itertools.product(*all_component_variations)
        for result in all_possible_results:
            yield ''.join(result)

    def find_nonterminal(self, name):
        """Return the NonterminalSymbol object with the given name."""
        try:
            return next(nonterminal for nonterminal in self.nonterminal_symbols if nonterminal.name == name)
        except StopIteration:
            raise Exception("Nonterminal symbol '{symbol}' has no production rules.".format(symbol=name))


class NonterminalSymbol(object):
    """A nonterminal symbol in a grammar."""

    def __init__(self, name):
        """Initialize a NonterminalSymbol object."""
        self.name = name
        self.production_rules = []  # Gets appended to by Grammar._init_build_grammar()


class ProductionRule(object):
    """A production rule in a context-free grammar."""

    def __init__(self, head, raw_body):
        """Initialize a ProductionRule object."""
        self.head = head
        self.raw_body = raw_body
        self.body = None  # Gets set by Grammar._init_resolve_symbol_references_in_production_rule_bodies()


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description="Rules to JSON")
    parser.add_argument('dsl')
    args = parser.parse_args()

    contents = None
    with open(args.dsl, "r+b") as f:
        mm = mmap.mmap(f.fileno(), 0, prot=mmap.PROT_READ)
        contents = mm.read(mm.size()).decode('UTF-8')
        mm.close()

    lines = contents.splitlines()

    transpiler = Transpiler (
         rules_definition=lines,
         domain_name=domain_name,
         path_to_json_outfile=PATH_TO_JSON_OUTFILE
    )

    print(transpiler.json_file)
