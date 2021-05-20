from flask_restplus import Namespace, fields, reqparse, inputs
import werkzeug


class IRCRule:
    api = Namespace('irc_rule', description='Rules for detecting an IRC pattern and converting into an event.')

    irc_rule = api.model('IRC Rule', {
        'id': fields.Integer(readOnly=True, description='The unique identifier of a irc rule'),
        'ruleSet': fields.String(required=True, description='The set of rules this rule belongs with'),
        'action': fields.String(required=True, description='The name of the rule'),
        'event': fields.String(required=True, description='The matched event or ontology item'),
        'patterns': fields.List(fields.String(required=True, description='The regex patterns'))
    })

    irc_stored_rule = api.model('IRC Stored Rule', {
        'id': fields.Integer(readOnly=True, description='The unique identifier of a irc rule'),
        'domainName': fields.String(required=True, description='The set of rules this rule belongs with'),
        'pattern': fields.String(required=True, description='The regex patter'),
        'ontologyUri': fields.String(required=True, description='The matched event or ontology item'),
        'label': fields.String(returned=True, description='DSL rule Label'),
        'activityTermination': fields.Boolean(
            required=True,
            description='If this rule detects that the activity has terminated'
        )
    })

    dsl_payload = reqparse.RequestParser()
    dsl_payload.add_argument('domain_name', help="The domain to apply rules.")
    dsl_payload.add_argument('store', type=inputs.boolean, help="Store the rules in the database.")
    dsl_payload.add_argument('dsl_file',
                             type=werkzeug.datastructures.FileStorage,
                             location='files',
                             required=True,
                             help='DSL File')
