from logging.config import fileConfig
import service.settings as settings
import py_eureka_client.eureka_client as eureka_client
import logging
from service import create_app
from gevent.pywsgi import WSGIServer

fileConfig('logging.conf')


if __name__ == '__main__':
    logging.info("Utilities Service Version: {}".format(settings.SERVICE_VERSION))

    app = create_app()
    
    if settings.FLASK_DEBUG:
        # Debug/Development
        app.run(debug=settings.FLASK_DEBUG,
                use_reloader=False,
                host=settings.FLASK_HOST,
                port=settings.FLASK_PORT)
    else:
        # Production
        http_server = WSGIServer((settings.FLASK_HOST, settings.FLASK_PORT), app)
        http_server.serve_forever()

    eureka_client.stop()
