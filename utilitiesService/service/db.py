from flask_pymongo import PyMongo
from . import settings
from flask import current_app, g


def init_mongodb(app):
    g.monitor_db = PyMongo(app, uri=settings.MONITOR_MONGO_URL)
    g.modeling_db = PyMongo(app, uri=settings.MODELING_MONGO_URL)
    g.instance_db = PyMongo(app, uri=settings.INSTANTATION_MONGO_URL)
    g.intent_db = PyMongo(app, uri=settings.INTENTCAPTURE_MONGO_URL)
    g.asset_db = PyMongo(app, uri=settings.ASSETS_MONGO_URL)
    g.equas_db = PyMongo(app, uri=settings.EQUAS_MONGO_URL)


def get_asset_service_db():
    if 'asset_db' not in g:
        g.asset_db = PyMongo(current_app, uri=settings.ASSETS_MONGO_URL)
    return g.asset_db


def get_instance_service_db():
    if 'instance_db' not in g:
        g.instance_db = PyMongo(current_app, uri=settings.INSTANTATION_MONGO_URL)
    return g.instance_db


def get_monitor_service_db():
    if 'monitor_db' not in g:
        g.monitor_db = PyMongo(current_app, uri=settings.MONITOR_MONGO_URL)
    return g.monitor_db


def get_modeling_service_db():
    if 'modeling_db' not in g:
        g.modeling_db = PyMongo(current_app, uri=settings.MODELING_MONGO_URL)
    return g.modeling_db


def get_intent_service_db():
    if 'intent_db' not in g:
        g.intent_db = PyMongo(current_app, uri=settings.INTENTCAPTURE_MONGO_URL)
    return g.intent_db


def get_equas_db():
    if 'equas_db' not in g:
        g.equas_db = PyMongo(current_app, uri=settings.EQUAS_MONGO_URL)
    return g.equas_db
