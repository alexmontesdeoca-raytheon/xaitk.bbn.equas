import os

# Service settings
SERVICE_VERSION = '0.1.17'
SERVICE_NAME = 'equasutilsservice'
SERVICE_TITLE = 'Utilities service API'

# Flask settings
FLASK_HOST = '0.0.0.0'
FLASK_PORT = 8196
FLASK_SERVER_NAME = 'Utilities Service'
FLASK_DEBUG = False  # Do not use debug mode in production

# Flask-Restplus settings
RESTPLUS_SWAGGER_UI_DOC_EXPANSION = 'list'
RESTPLUS_VALIDATE = True
RESTPLUS_MASK_SWAGGER = False
RESTPLUS_ERROR_404_HELP = False

# Eureka settings
JHIPSTER_WAIT = os.getenv('JHIPSTER_SLEEP', '0')
RETRY_MAX = 100
RETRY_WAIT = 15
EUREKA_URL = os.getenv('EUREKA_CLIENT_SERVICE_URL_DEFAULTZONE', 'http://admin:admin@localhost:8761/eureka/')

# Docker settings
RUNNING_IN_DOCKER = os.getenv('RUNNING_IN_DOCKER', 'False')
# Typically this would be 172. when running in docker locally. However the mdc2 servers are using 10.
PREFERRED_SUBNET = os.getenv('PREFERRED_SUBNET', '10.')

# Mongodb Settings
mongo_url = os.getenv('SPRING_DATA_MONGODB_URI', 'mongodb://localhost:27017/')
MONITOR_MONGO_URL = mongo_url + 'monitorService'
MODELING_MONGO_URL = mongo_url + 'modelingService'
INSTANTATION_MONGO_URL = mongo_url + 'instantiationService'
ASSETS_MONGO_URL = mongo_url + 'assetsService'
INTENTCAPTURE_MONGO_URL = mongo_url + 'intentCaptureService'
EQUAS_MONGO_URL = mongo_url + 'XAI'

results_shown = 32
data_path = '../evaluation_dataset/one_shot_data/'
dataset_directory = '../evaluation_dataset/one_shot'
if RUNNING_IN_DOCKER == 'True':
    data_path = '/evaluation_dataset/one_shot_data/'
    dataset_directory = '/evaluation_dataset/one_shot'
