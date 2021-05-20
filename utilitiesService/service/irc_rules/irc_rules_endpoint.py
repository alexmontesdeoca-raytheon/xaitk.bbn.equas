import logging
from flask import Blueprint, jsonify
from flask_restplus import Resource
from service.db import get_monitor_service_db
from pymongo.errors import BulkWriteError
from .irc_rule_dto import IRCRule
from .rules_to_json import Transpiler
import pymongo

api = IRCRule.api
_ruleDTO = IRCRule.irc_rule
_storedRuleDTO = IRCRule.irc_stored_rule
dsl_payload = IRCRule.dsl_payload

irc_blueprint = Blueprint('irc-rules', __name__, template_folder='templates')


def get_rules(query):
    return get_monitor_service_db().db.irc_rules.find(query)


@api.route("/rules")
class IRCRulesParser(Resource):

    @api.marshal_list_with(_storedRuleDTO)
    def get(self):
        """Get all the rules currently stored in the database"""
        results = get_rules({})
        all_rules = [result for result in results]
        return all_rules


@api.route("/delete_rules")
class IRCRulesParser(Resource):

    @api.marshal_list_with(_storedRuleDTO)
    def delete(self):
        """Delete all the rules currently stored in the database"""
        results = get_monitor_service_db().db.irc_rules.drop()
        return results



@api.route('/transpose')
class Transpose(Resource):

#    def get(self):
#        pass

    @api.expect(dsl_payload)
    def post(self):
        """Transposes the dsl rules into JSON rules"""
        args = dsl_payload.parse_args()
        domain_name = args['domain_name']
        dsl_rules = args['dsl_file'].read()
        store_dsl = args['store']
        dsl_rules = dsl_rules.decode()

        result = 'Success'
        transpiler = Transpiler(dsl_rules, domain_name)
        rules = transpiler.get_rules()
        if store_dsl:
            logging.info("Storing the rules in the database")

            uris = {True: [], False: []}
            labels = {True: [], False: []}
            rules_without_duplicates = []
            for rule in rules:
                uri = rule['ontologyUri']
                label = rule['label']
                termination = rule['activityTermination']

                if uri is None and label is None:
                    logging.warning("Bad rule:  missing URI and label")
                elif uri is not None and uri in uris[termination]:
                    logging.warning("Ignoring rule with duplicate URI: " + uri)
                elif label is not None and label in labels[termination]:
                    logging.warning("Ignoring rule with duplicate label: " + label)
                else:
                    if uri is not None:
                        uris[termination].append(uri)
                    if label is not None:
                        labels[termination].append(label)
                    rules_without_duplicates.append(rule)

            rules = rules_without_duplicates

            # Remove all rules for the domain
            get_monitor_service_db().db.irc_rules.remove({'domainName': domain_name})

            try:
                _results = get_monitor_service_db().db.irc_rules.insert_many(rules)
                logging.debug("Add results: {}".format(_results.inserted_ids))
            except BulkWriteError as bwe:
                result = "failed"
                logging.error("Error writing rules: {}".format(bwe.details))
                raise

        return result
