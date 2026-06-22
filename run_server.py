import sys, os
d = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, d)
os.chdir(d)
from app import app
app.run(host='0.0.0.0', port=5000, debug=False, use_reloader=False)
