from app import app
from app import utilities
from flask import render_template, request, redirect, url_for, jsonify, abort
import os
from app import CoreModules
import json
from app import plugins
from werkzeug.utils import secure_filename
UPLOAD_FOLDER = 'uploadfiles'
ALLOWED_EXTENSIONS = {'xlsx', 'xls'}

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.register_blueprint(plugins.statues.st_bp, url_prefix='/status')

def allowed_files(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


@app.route('/', methods=['GET'])
def index():
    return render_template('index.html', uid=utilities.smuid.short_uuid())
    # return render_template('index.html', uid="Ujlj3vv5")


@app.route('/online')
def online():
    return render_template('online.html', uid=utilities.smuid.short_uuid())


@app.route('/cancers', methods=['GET', 'POST'])
def cancers():
    if request.method == 'POST':
        returnString = {
            "statues": 0,
            "data": utilities.getgenes.genelist("", text=request.json["cancer"], type=request.json["material"])
        }
        return jsonify(returnString)
    else:
        return jsonify(utilities.cancers.cancertypes())

@app.route('/upload', methods=['POST'])
def upload():
    if request.method == 'POST':
        # check if the post request has the file part
        if 'file' not in request.files:
            return jsonify({
                "statues": -1,
                "msg": "Empty 'file' in the HTML form request."
            })
        file = request.files['file']
        # if user does not select file, browser also
        # submit an empty part without filename
        if file.filename == '':
            return jsonify({
                "statues": -1,
                "msg": "You've uploaded an empty file!"
            })
        if file and allowed_files(file.filename):
            filename = request.form['runtime'] + '.' + file.filename.split('.')[-1]
            file.save(os.path.join(os.path.dirname(__file__), app.config['UPLOAD_FOLDER'], filename))
            return jsonify({
                "statues": 0,
                "msg": "upload success!"
            })
        else:
            return jsonify({
                "statues": -1,
                "msg": "Not allowed file type!"
            })

@app.route('/getgenes', methods=['POST', 'GET'])
def getgenes():
    if request.method == 'POST':
        try:
            returnString = {
                "statues": 0,
                "data": utilities.getgenes.genelist(request.form["runtime"]+".xlsx")
            }
            return jsonify(returnString)
        except Exception as e:
            print(e)
            return jsonify({
                "statues": -1,
                "message": str(e)
            })
    else:
        return abort(501)

@app.route('/pushgenes2', methods=['POST', 'GET'])
def pushgenes2():
    if request.method == 'POST':
        try:
            print(request.form["genelist"])
            returnString = {
                "statues": 0,
                "data": json.loads(CoreModules.cluster22.clusterpack(
                    json.loads(request.form["genelist"]),
                    request.form["runtime"],
                    text=request.form["cancer"],
                    type=request.form["material"]
                ))
            }
            return jsonify(returnString)
        except Exception as e:
            print(e)
            return jsonify({
                "statues": -1,
                "message": e
            })
    else:
        return abort(501)

@app.route('/pushgenes', methods=['POST', 'GET'])
def pushgenes():
    if request.method == 'POST':
        try:
            print(request.form["genelist"])
            returnString = {
                "statues": 0,
                "data": json.loads(CoreModules.cluster22.clusterpack(json.loads(request.form["genelist"]), request.form["runtime"]))
            }
            return jsonify(returnString)
        except Exception as e:
            print(e)
            return jsonify({
                "statues": -1,
                "message": "this file doesn't match the format pattern!"
            })
    else:
        return abort(501)

@app.route('/pushgroups', methods=['POST', 'GET'])
def pushgroups():
    if request.method == 'POST':
        try:
            print(request.form["boundery"])
            returnString = {
                "statues": 0,
                "data": json.loads(CoreModules.cluster.export_rehier(uid=request.form["runtime"], bounderies=json.loads(request.form["boundery"])))
            }
            return jsonify(returnString)
        except Exception as e:
            print(e)
            return jsonify({
                "statues": -1,
                "message": str(e)
            })
    else:
        return abort(501)

@app.route('/help', methods=['POST', 'GET'])
def help():
    return render_template('help.html')