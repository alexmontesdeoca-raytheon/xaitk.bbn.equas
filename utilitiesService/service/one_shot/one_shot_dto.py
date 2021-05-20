from flask_restplus import Namespace, fields, reqparse, inputs
import werkzeug


class OneShot:
    api = Namespace('one_shot', description='Endpoints to interact with one shot classifier.')

    one_shot_feature = api.model('One Shot Feature', {
        'image': fields.String(readOnly=True, description='The image file identifier'),
        'unit': fields.Integer(required=True, description='The image feature identifier'),
        'iou': fields.Integer(required=True, description='The image feature value'),
        'label': fields.String(required=True, description='The image feature label'),
        'cat': fields.String(required=True, description='The image feature category'),
        'index': fields.Integer(required=True, description='The image feature index')
    })

    one_shot_score = api.model('One Shot Score', {
        'accuracy_before': fields.Float(readOnly=True, description='The accuracy score before sorting'),
        'accuracy_after': fields.Float(required=True, description='The accuracy score after sorting'),
        'f1_before': fields.Float(required=True, description='The F1 score before sorting'),
        'f1_after': fields.Float(required=True, description='The F1 score after sorting')
    })

    os_score_payload = reqparse.RequestParser()
    os_score_payload.add_argument(
        name='class_name',
        help="The name of the image class to score",
        location='form'
    )
    os_score_payload.add_argument(
        name='unit_json_file_path',
        help="The path of the sorted unit json file to score",
        location='form'
    )
