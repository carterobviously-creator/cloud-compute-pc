from flask import Flask
app = Flask(__name__)
@app.route('/')
def hello():
    return '<h1>OK</h1>'
app.run(host='0.0.0.0', port=5000, debug=False, use_reloader=False)
