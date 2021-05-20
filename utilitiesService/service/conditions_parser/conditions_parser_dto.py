from flask_restplus import Namespace, fields, reqparse, inputs


class EndStateConditions:
    """A class that defines a standard for end-state conditions in a commander's intent."""

    # Define API namespace
    api = Namespace(
        name='end_state_conditions',
        description='Conditions that must be satisfied in order for an operation to execute successfully.'
    )
    # Define the data model for this API
    end_state_conditions = api.model('End-State Conditions', {
        'intent_id': fields.String(
            readOnly=True,
            description="The unique identifier for the commander's intent in which these conditions originate"
        ),
        'conditions_str': fields.String(
            required=True,
            description="The end-state conditions, all contained within a single string"
        ),
        'delimiter': fields.String(
            required=True,
            description="The delimiter used to separate individual conditions in conditions_str"
        ),
    })
    # Define the structure of payloads for requests to this API
    conditions_payload = reqparse.RequestParser()
    conditions_payload.add_argument(
        name='intent_id',
        help="The unique identifier for the commander's intent in which these conditions originate",
        location='form'
    )
    conditions_payload.add_argument(
        name='conditions_str',
        help="The end-state conditions, all contained within a single string",
        location='form'
    )
    conditions_payload.add_argument(
        name='delimiter',
        help="The delimiter used to separate individual conditions in conditions_str",
        location='form'
    )
