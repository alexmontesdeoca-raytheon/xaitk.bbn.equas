import os
import sys
import netifaces
import uuid
from time import sleep
from . import settings
from .restplus import api
from .db import init_mongodb
from flask import Flask, Blueprint
import py_eureka_client.eureka_client as eureka_client
from urllib.error import URLError
import logging.config

logging.config.fileConfig("logging.conf")


def create_app(test_config=None):
    initialize_eureka()

    # create and configure the app
    app = Flask(__name__, instance_relative_config=True)
    configure_service(app, test_config)

    # Initialize the database
    with app.app_context():
        init_mongodb(app)

    # ensure the instance folder exists
    try:
        os.makedirs(app.instance_path)
    except OSError:
        pass

    blueprint = Blueprint('api', __name__)
    api.init_app(blueprint)

    # Add new Namespaces here -->
    from .irc_rules.irc_rules_endpoint import api as irc_rules_namespace
    api.add_namespace(irc_rules_namespace)

    from .conditions_parser.conditions_parser_endpoint import api as conditions_parser_namespace
    api.add_namespace(conditions_parser_namespace)

    from .one_shot.one_shot_endpoint import api as one_shot_namespace
    api.add_namespace(one_shot_namespace)

    try:
        from .state_prediction.state_prediction_endpoint import api as state_prediction_namespace
        api.add_namespace(state_prediction_namespace)
    except Exception as e:
        logging.warn("Unable to add state prediction endpoint: {}".format(e))

    try:
        from .domain_utils.domain_utils_endpoint import api as domain_utils_namespace
        api.add_namespace(domain_utils_namespace)
    except Exception as e:
        logging.warn("Unable to add domain utils endpoint: {}".format(e))

    # <-- End of new Namespaces

    app.register_blueprint(blueprint)
    app.app_context().push()

    return app


def initialize_eureka():
    logging.debug("Initialize Eureka")
    # Needed for running in docker container
    # https://stackoverflow.com/questions/20172002/how-to-change-file-system-encoding-via-python
    sys.getfilesystemencoding = lambda: 'UTF-8'
    # Give Jhipster Registry time to start up
    logging.info('Waiting ' + settings.JHIPSTER_WAIT + 's for Jhipster Registry to startup')
    sleep(int(settings.JHIPSTER_WAIT))

    if settings.RUNNING_IN_DOCKER == 'True':
        configure_docker()

    instance_id = "{}:{}".format(settings.SERVICE_NAME, uuid.uuid4())

    logging.debug(settings.EUREKA_URL)
    logging.info('Starting up with IP address: ' + settings.FLASK_HOST)
    retry_count = 1
    while retry_count <= settings.RETRY_MAX:
        try:
            # The following code registers your server to eureka and starts to send a heartbeat every 30 seconds
            eureka_client.init(eureka_server=settings.EUREKA_URL,
                               app_name=settings.SERVICE_NAME,
                               instance_id=instance_id,
                               instance_ip=settings.FLASK_HOST,
                               instance_port=settings.FLASK_PORT)
            break
        except URLError:
            if retry_count == settings.RETRY_MAX:
                raise
            retry_count += 1
            logging.warning('Registry not found: Retrying in {} seconds'.format(settings.RETRY_WAIT))
            sleep(settings.RETRY_WAIT)
            continue


def configure_docker():
    # When running inside docker, the IP binding of '0.0.0.0' does not work properly.
    # Look up the actual net IP of the container
    interfaces = netifaces.interfaces()
    for i in interfaces:
        if i == 'lo':
            continue
        iface = netifaces.ifaddresses(i).get(netifaces.AF_INET)
        if iface != None:
            for j in iface:
                ip_addr = str(j['addr'])
                logging.debug(ip_addr)
                if ip_addr.startswith(settings.PREFERRED_SUBNET):
                    settings.FLASK_HOST = j['addr']


def configure_service(flask_app, test_config=None):
    flask_app.config['SWAGGER_UI_DOC_EXPANSION'] = settings.RESTPLUS_SWAGGER_UI_DOC_EXPANSION
    flask_app.config['RESTPLUS_VALIDATE'] = settings.RESTPLUS_VALIDATE
    flask_app.config['RESTPLUS_MASK_SWAGGER'] = settings.RESTPLUS_MASK_SWAGGER
    flask_app.config['ERROR_404_HELP'] = settings.RESTPLUS_ERROR_404_HELP

    flask_app.config.from_mapping(
        SECRET_KEY='dev'
    )

    if test_config is None:
        # load the instance config, if it exists, when not testing
        flask_app.config.from_pyfile('config.py', silent=True)
    else:
        # load the test config if passed in
        flask_app.config.from_mapping(test_config)
