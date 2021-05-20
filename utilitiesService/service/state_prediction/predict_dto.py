from flask_restplus import Namespace, fields, reqparse, inputs


class StatePredict:
    api = Namespace('state_predict', description='Model for detecting the current state of the mission.')

    prediction_dto = api.model('Prediction', {
        'cur_state': fields.String(required=True, description='The current state'),
        'message': fields.String(required=True, description='The message generating the prediction'),
        'message_index': fields.Integer(default=-1, description='The message index within the chat stream'),
        'predictions': fields.Wildcard(fields.Float)
    })

    payload_model = api.model('Payload', {
        'domain_name': fields.String(required=True, description=''),
        'message': fields.String(required=True, description='')
    })

    state_payload = reqparse.RequestParser(bundle_errors=True)
    state_payload.add_argument('domain_name', help='The name of the domain to predict against')
    state_payload.add_argument('message', help='The message to predict on', location="json")
