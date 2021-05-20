import logging
from flask import Blueprint, jsonify
from flask_restplus import Resource
from service.db import get_monitor_service_db
from pymongo.errors import BulkWriteError
from .one_shot_dto import OneShot
from .intervention import get_scores
from .annotations_experiment import ExamplesByPaint
import pymongo
from service.db import get_equas_db
import service.settings as settings
import json
from flask import request
from random import randrange
from datetime import datetime
import service.settings as settings
import os
from bson.objectid import ObjectId

api = OneShot.api
_oneShotFeatureDTO = OneShot.one_shot_feature
_oneShotScoreDTO = OneShot.one_shot_score
os_score_payload = OneShot.os_score_payload

examplesByPaint = ExamplesByPaint(
    settings.data_path + 'f_whitened_original.pkl',
    settings.data_path + 'f_whitened_test.pkl',
    settings.data_path + 'image_labels_test.pkl',
    settings.data_path + 'classnames_test.pkl',
    settings.data_path + 'img_sample_original.pkl',
    settings.data_path + 'img_sample_test.pkl',
    settings.data_path + 'image_mapping_original.pkl',
    settings.data_path + 'image_mapping_test.pkl'
)


# examplesByPaint = ExamplesByPaint(
#     settings.data_path + 'f_whitened.pkl',
#     settings.data_path + 'f_whitened_test.pkl',
#     settings.data_path + 'image_labels_test.pkl',
#     settings.data_path + 'classnames_test.pkl',
#     settings.data_path + 'img_sample.pkl',
#     settings.data_path + 'image_mapping.pkl'
# )

def get_features(image_class):
    return []


@api.route("/class_features/<string:image_class>")
class OneShotParser(Resource):

    def get(self, image_class):
        """Get all the class features for image"""
        results = json.loads(open(
            '{dataset_directory}/{image_class}/units.json'.format(dataset_directory=settings.dataset_directory,
                                                                  image_class=image_class)).read())
        results["requestedOn"] = datetime.now().isoformat()
        return results

@api.route("/class_features_v3/<string:image_class>")
class OneShotParser(Resource):

    def get(self, image_class):
        """Get all the class features for image"""
        results = json.loads(open(
            '{dataset_directory}/unit_jsons/{image_class}/unit.json'.format(dataset_directory=settings.dataset_directory+'_v3',
                                                                  image_class=image_class)).read())
        results["requestedOn"] = datetime.now().isoformat()
        return results


@api.route("/class_scores_test")
class OneShotParserTest(Resource):

    def post(self):
        """Pre-canned test to calculate scores for badminton"""
        # # Receive the request data
        # args = os_score_payload.parse_args()
        # class_name = args['class_name']
        # unit_json_file_path = '/evaluation_dataset/one_shot_data/test_json_units/badminton-sorting.activations.json' # args['unit_json_file_path']
        # classifier_file = class_name + "_w_new.npz"
        # classifier_path = data_path + classifier_file
        # # logging.debug(class_name)
        # # logging.debug(classifier_path)
        # # logging.debug(unit_json_file_path)
        # result = get_scores(class_name, unit_json_file_path, classifier_path)
        # # return results
        # results = [result]
        class_name = 'badminton'
        classifier = settings.data_path + 'badminton_w_new.npz'
        unit_path = settings.data_path + 'test_json_units/badminton-sorting.activations.json'
        unit_json = json.load(open(unit_path, 'r'))
        result = get_scores(class_name, unit_json, classifier)
        result_json = json.dumps(result)
        print(result_json)
        return result


@api.route("/class_scores/<string:class_name>")
class OneShotParser(Resource):

    def post(self, class_name):
        """Calculate scores for a given class feature sort"""
        # class_name = {image_class}
        activities =['badminton', 'bocce', 'croquet', 'polo', 'RockClimbing', 'rowing', 'sailing', 'snowboarding']
        preextracted_data_path = settings.data_path + 'sun397_features.npz'
        classifier = settings.data_path + class_name + '_units_applied.npz'
        if (class_name in activities):
            preextracted_data_path = settings.data_path + 'places_features.npz'
            classifier = settings.data_path + class_name + '_w_new.npz'
        unit_json = request.json  # The request body contains our unit json. Not sure atm how to include this as a swagger param
        # print(json.dumps(unit_json))


        #unit_json["initalSort"] #This is the random sorting the Turker recieved and should serve as the baseline for the scoring.


        scores = get_scores(class_name, unit_json, classifier, preextracted_data_path)
        print(json.dumps(scores))

        # Attach scores and send back to the client
        unit_json["stats"]["ip"] = request.remote_addr
        unit_json["scores"] = scores
        unit_json["stats"]["accuracy_before"] = scores["accuracy_before"]
        unit_json["stats"]["accuracy_after"] = scores["accuracy_after"]
        unit_json["stats"]["f1_before"] = scores["f1_before"]
        unit_json["stats"]["f1_after"] = scores["f1_after"]
        unit_json["stats"]["requestedOn"] = unit_json["requestedOn"]
        unit_json["stats"]["dtEnd"] = datetime.now().isoformat()

        get_equas_db().db.oneshot_answer_v2.insert(unit_json["stats"])
        unit_json["stats"]["_id"] = str(unit_json["stats"]['_id'])  # Stringify the Mongo ID. Fixes: 'ObjectId' is not JSON

        # unit_json["stats"]["id"] = unit_json["stats"]["_id"]
        # unit_json["id"] = unit_json["stats"]["_id"]
        # unit_json["_id"] = unit_json["id"]
        unit_json["_id"] = unit_json["stats"]["_id"]
        get_equas_db().db.oneshot_answer_v2_full.insert(unit_json)
        unit_json["_id"] = str(unit_json['_id'])  # Stringify the Mongo ID. Fixes: 'ObjectId' is not JSON serializable

        return unit_json


@api.route("/class_scores_v3/<string:class_name>")
class OneShotParser(Resource):

    def post(self, class_name):
        """Calculate scores for a given class feature sort"""
        unit_json = request.json  # The request body contains our unit json. Not sure atm how to include this as a swagger param

        # Attach scores and send back to the client
        unit_json["stats"]["ip"] = request.remote_addr
        # unit_json["scores"] = scores
        # unit_json["stats"]["accuracy_before"] = scores["accuracy_before"]
        # unit_json["stats"]["accuracy_after"] = scores["accuracy_after"]
        # unit_json["stats"]["f1_before"] = scores["f1_before"]
        # unit_json["stats"]["f1_after"] = scores["f1_after"]
        unit_json["stats"]["requestedOn"] = unit_json["requestedOn"]
        unit_json["stats"]["dtEnd"] = datetime.now().isoformat()

        get_equas_db().db.oneshot_answer_v3.insert(unit_json["stats"])
        unit_json["stats"]["_id"] = str(unit_json["stats"]['_id'])  # Stringify the Mongo ID. Fixes: 'ObjectId' is not JSON

        unit_json["_id"] = unit_json["stats"]["_id"]
        get_equas_db().db.oneshot_answer_v3_full.insert(unit_json)
        unit_json["_id"] = str(unit_json['_id'])  # Stringify the Mongo ID. Fixes: 'ObjectId' is not JSON serializable

        return unit_json

@api.route("/one_shot_results_simple")
class OneShotResultsSimple(Resource):

    def get(self):
        # Creating a Cursor instance using find() function
        cursor = get_equas_db().db.oneshot_answer_v2.find()
        # Converting cursor to the list of dictionaries
        list_cur = list(cursor)
        # Converting to the JSON
        data = []
        for doc in list_cur:
            doc['_id'] = str(doc['_id'])  # Convert id to string
            data.append(doc)
        return data


@api.route("/one_shot_results_full")
class OneShotResultsFull(Resource):

    def get(self):
        # Creating a Cursor instance using find() function
        cursor = get_equas_db().db.oneshot_answer_v2_full.find()
        # Converting cursor to the list of dictionaries
        list_cur = list(cursor)
        # Converting to the JSON
        return list_cur

@api.route("/one_shot_results_simple_v3")
class OneShotResultsSimple(Resource):

    def get(self):
        # Creating a Cursor instance using find() function
        cursor = get_equas_db().db.oneshot_answer_v3.find()
        # Converting cursor to the list of dictionaries
        list_cur = list(cursor)
        # Converting to the JSON
        data = []
        for doc in list_cur:
            doc['_id'] = str(doc['_id'])  # Convert id to string
            data.append(doc)
        return data


@api.route("/one_shot_results_full_v3")
class OneShotResultsFull(Resource):

    def get(self):
        # Creating a Cursor instance using find() function
        cursor = get_equas_db().db.oneshot_answer_v3_full.find()
        # Converting cursor to the list of dictionaries
        list_cur = list(cursor)
        # Converting to the JSON
        return list_cur

@api.route("/demo_upload_heatmap")
class UploadFile(Resource):

    def post(self):
        output_path = settings.dataset_directory + '/demo/'
        if not os.path.exists(output_path):
            os.makedirs(output_path)

        file = request.files['heatmap']
        file.save(output_path + file.filename)

@api.route("/class_features_demo")
class OneShotParser(Resource):

    def post(self):
        """Calculate and return all the class feature images for heatmap"""
        # This endpoint input json and output json have the same schema:
        # { "images": [ { "id":<integer id>; "b64_image": <b64 encoded png string> }, {...}, {...} ] }
        image_json = request.json  # request contains json with b64 encoded image and image id
        # get_feature_images in the backend takes a json object with a list of b64 encoded image(heatmaps) and image ids
        # and returns a json object with a list of b64 encoded images(feature images + heatmaps) and ids
        features_json = examplesByPaint.get_feature_images(image_json)
        # features_json = get_feature_images(image_json)
        return features_json

@api.route("/class_scores_demo")
class OneShotParser(Resource):

    def post(self):
        """Calculate and return score from annotations (heatmaps added and features deleted)"""
        # Input:
        # { "id": <integer id>, "aspects": {<aspect_name_1>":{"data": [{"id": <integer id>,
        # "b64_image": "<b64 encoded png string>"}{...}]},{...}
        # "deletions": [ {"id":<integer_id>},{"id":<integer_id>} ] }
        annotations_json = request.json  # request contains json with annotations
        results_json = examplesByPaint.get_demo_scores(annotations_json)
        return results_json

@api.route("/class_features_demo_test")
class OneShotParserTest(Resource):

    def post(self):
        """Pre-canned test to get a set of encoded images"""
        demo_test_path = settings.data_path + 'test_json_units/demo_endpoint_output.json'
        demo_test_json = json.load(open(demo_test_path, 'r'))
        print(demo_test_json)
        return demo_test_json

@api.route("/class_features_demo_test2")
class OneShotParserTest2(Resource):

    def post(self):
        demo_test_path = settings.data_path + 'test_json_units/demo_endpoint_input.json'
        demo_test_json = json.load(open(demo_test_path, 'r'))
        features_json = examplesByPaint.get_feature_images(demo_test_json)
        return features_json

@api.route("/class_scores_demo_test")
class OneShotParser(Resource):

    def post(self):
        """Calculate and return score from annotations (heatmaps added and features deleted)"""
        # Input:
        # { "id": <integer id>, "aspects": {<aspect_name_1>":{"data": [{"id": <integer id>,
        # "b64_image": "<b64 encoded png string>"}{...}]},{...}
        # "deletions": [ {"id":<integer_id>},{"id":<integer_id>} ] }
        demo_test_path = settings.data_path + 'test_json_units/demo_scores_input.json'
        demo_test_json = json.load(open(demo_test_path, 'r'))
        results_json = examplesByPaint.get_demo_scores(demo_test_json)
        return results_json



@api.route("/one_shot_demo_save")
class OneShotDemoSaveAspect(Resource):

    def post(self):
        aspect_json = request.json
        # Creating a Cursor instance using find() function
        get_equas_db().db.oneshot_demo_save.insert(aspect_json)
        # cursor = get_equas_db().db.oneshot_demo_aspects.find()
        # # Converting cursor to the list of dictionaries
        # list_cur = list(cursor)
        # # Converting to the JSON
        # data = []
        # for doc in list_cur:
        #     doc['_id'] = str(doc['_id'])  # Convert id to string
        #     data.append(doc)
        return json.dumps({'success': True}), 200, {'ContentType': 'application/json'}

@api.route("/my_one_shot_demo_saves/<string:session_id>")
class MyOneShotDemoSaves(Resource):

    def get(self, session_id):
        # Creating a Cursor instance using find() function
        # cursor = get_equas_db().db.oneshot_demo_save.find({'sessionId': session_id}, {'aspects': 0})
        cursor = get_equas_db().db.oneshot_demo_save.find(
            {"$or": [{'sessionId': session_id}, {'sessionId': 'example'}]}, {'aspects': 0})
        list_cur = list(cursor)
        # Converting to the JSON
        data = []
        for doc in list_cur:
            doc['_id'] = str(doc['_id'])  # Convert id to string
            data.append(doc)
        return data


@api.route("/get_one_shot_demo_save/<string:save_id>")
class GetOneShotDemoSave(Resource):

    def get(self, save_id):
        # Creating a Cursor instance using find() function
        cursor = get_equas_db().db.oneshot_demo_save.find({'_id': ObjectId(save_id)})
        list_cur = list(cursor)
        for doc in list_cur:
            doc['_id'] = str(doc['_id'])  # Convert id to string
            return doc


@api.route("/recover_images_by_class/<string:query_str>")
class RecoverImagesByClass(Resource):

    def get(self, query_str):
        return examplesByPaint.recover_images_by_class(query_str)

