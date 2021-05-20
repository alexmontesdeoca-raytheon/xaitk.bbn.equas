import json
from simpletransformers.model import TransformerModel

class Predictor(object):
    """ A class for interacting with Bert models"""

    def __init__(self, domain=None):
        """Initialize a Bert object."""
        self._domain = None
        self._model = None
        self._integer_label_to_operation_phase = None
        if domain:
            self._load_model(domain=domain)

    def _load_model(self, domain):
        """Load the Bert model fine-tuned to the given domain."""
        self._domain = domain
        path_to_model_directory = './models/{domain}'.format(domain=domain)  # E.g., 'pizza' as domain
        model_metadata = json.loads(open('{model_dir}/metadata.json'.format(model_dir=path_to_model_directory)).read())
        self._integer_label_to_state_name = model_metadata['integer_label_to_state_name']
        self._model = TransformerModel(
            model_type='roberta',
            model_name=path_to_model_directory,
            num_labels=len(self._integer_label_to_state_name),
            use_cuda=False
        )

    def predict(self, domain, message, message_index):
        """Predict the current state given a domain and message."""
        # If the current model loading into this class is for a different domain, switch to the one for
        # the given domain
        if domain != self._domain:
            self._load_model(domain=domain)
        # Generate a prediction in the form of a probability distribution over possible states
        _raw_scores = self._model.predict(to_predict=[message], multi_label=False)[1][0]
        all_scores_for_this_message = sorted(enumerate(_raw_scores), key=lambda entry: entry[1], reverse=True)
        prediction_object = {
            "message": message,
            "message_index": message_index,  # The position of the message in the chat log
            "predictions": {
                self._integer_label_to_state_name[str(integer_label)]: float(score)
                for integer_label, score in all_scores_for_this_message
            }
        }
        return prediction_object

