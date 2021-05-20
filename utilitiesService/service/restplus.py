import logging
from flask_restplus import Api, Resource
from flask import jsonify
from service import settings

api = Api(version='1.0', title='Utilities Service', description='A utilities service.')


@api.route('/v2/api-docs')
class SwaggerDocs(Resource):
    def get(self):
        return jsonify(api.__schema__)


@api.errorhandler
def default_error_handler(e):
    message = 'An unhandled exception occurred.'

    if not settings.FLASK_DEBUG:
        return {'message': message}, 500
