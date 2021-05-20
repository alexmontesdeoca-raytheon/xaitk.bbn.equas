import json
from .intervention import get_scores

class_name = 'badminton'
classifier = '/evaluation_dataset/one_shot_data/badminton_w_new.npz'
unit_json = '/evaluation_dataset/one_shot_data/test_json_units/badminton-sorting.activations.json'

result = get_scores(class_name, unit_json, classifier)
result_json = json.dumps(result)
print(result_json)

