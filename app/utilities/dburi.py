import pymongo


def DBuri():
    return pymongo.MongoClient("mongodb://39.107.249.35:3388/")