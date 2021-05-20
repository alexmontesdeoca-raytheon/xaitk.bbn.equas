from flask_restplus import Resource
from .conditions_parser_dto import EndStateConditions
from .conditions_parser import ConditionsParser

api = EndStateConditions.api
_conditionsDTO = EndStateConditions.end_state_conditions
conditions_payload = EndStateConditions.conditions_payload


@api.route('/parse')
class Parse(Resource):
    """An endpoint for parsing the end-state conditions of a commander's intent."""

    @api.expect(conditions_payload)
    def post(self):
        """Parse a string containing end-state conditions and return an array of structured condition objects."""
        # Receive the request data
        args = conditions_payload.parse_args()
        intent_id = args['intent_id']
        conditions_str = args['conditions_str']
        delimiter = args['delimiter']
        # Process the request
        result = ConditionsParser.parse(intent_id=intent_id, conditions_str=conditions_str, delimiter=delimiter)
        # Return the result; this is an object with two fields: if parsing was successful, 'conditions' is an array
        # of structured condition objects, else an empty array; if parsing was unsuccessful, 'errors' is an array
        # of error messages, else an empty array
        return result
