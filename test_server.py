import sys, os
d = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, d)
os.chdir(d)
from app import app

# Override index to be minimal for testing
@app.route('/test')
def test():
    return 'OK', 200

app.run(host='0.0.0.0', port=5000, debug=False, use_reloader=False)
