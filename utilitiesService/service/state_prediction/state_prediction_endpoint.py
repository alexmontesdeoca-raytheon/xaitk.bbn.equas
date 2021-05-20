import logging
from flask import Blueprint, request
from flask_restplus import Resource
from .predict_dto import StatePredict
from .state_prediction import Predictor
from .find_states import run_sim

api = StatePredict.api
state_payload = StatePredict.state_payload
_predictionDTO = StatePredict.prediction_dto
_payload_model = StatePredict.payload_model

predict_blueprint = Blueprint('predict', __name__, template_folder='templates')
predictors = {}


def get_prediction(domain_name, message):
    if domain_name in predictors:
        predictor = predictors[domain_name]
    else:
        predictor = Predictor(domain_name)
        predictors[domain_name] = predictor
    return predictor.predict(domain_name, message, -1)


@api.route("/predict")
class PredictState(Resource):

    # @api.marshal_with(_predictionDTO)
    @api.expect(_payload_model)
    def post(self):
        """Predicts the current state of the model based on the received message."""
        data = api.payload
        logging.debug("predict state: {payload}".format(payload=data))
        domain_name = data['domain_name']
        message = data['message']
        logging.debug('Input Message: {m}'.format(m=message))
        result = get_prediction(domain_name, message)
        logging.debug(result)
        return result


@api.route("/find_states")
class FindStates(Resource):

    @api.expect(_predictionDTO)
    def post(self):
        data = api.payload
        logging.debug("Find States: {payload}".format(payload=data))
        result = run_sim('pizza', data)
        logging.debug("Result = {result}".format(result=result))
        return result
