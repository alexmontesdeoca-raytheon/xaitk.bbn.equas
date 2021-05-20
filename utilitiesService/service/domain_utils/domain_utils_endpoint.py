from flask_restplus import Resource, Namespace, fields
from werkzeug.exceptions import BadRequest
import service.state_prediction.state_prediction_endpoint as state_predict
import service.irc_rules.irc_rules_endpoint as irc_rules
import re

api = Namespace('domain_utils', description='Endpoints to interact with domains')

domain_request_fields = api.model('Domain Activities Request', {
    'domain': fields.String(required=True, description='The domain to search in'),
    'messageParserType': fields.String(required=True,
                                       description='The type of the message parser to inspect.',
                                       enum=['ML', 'REGEX'])
})

activity_labels = api.model('Activity Labels', {
    "activity_labels": fields.List(fields.String(),
                                   required=True,
                                   description='The labels of activities in the given domain' +
                                               'that the message parser knows about')
})


@api.route('/activities')
class ActivityList(Resource):
    """ An endpoint for accessing various utilities used for sensemaking."""

    @api.response(200, 'Success', activity_labels)
    @api.expect(domain_request_fields)
    def post(self):
        """Gets all the known activities for the given domain and message parser."""
        message_parser_type = api.payload['messageParserType']
        domain = api.payload['domain']

        if message_parser_type == 'ML':
            # use dummy prediction request to get list of activities in return value
            prediction = state_predict.get_prediction(domain, '')

            results = [activity_label for activity_label in prediction['predictions'].keys()]
        elif message_parser_type == 'REGEX':
            domain_rules = irc_rules.get_rules({'domainName': re.compile(domain, re.IGNORECASE)})

            results = [rule['label'] for rule in domain_rules]
        else:
            raise BadRequest("Unknown message parser type: {}".format(message_parser_type))

        return results
