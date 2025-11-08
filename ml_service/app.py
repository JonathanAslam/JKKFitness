# temp python flask to setup connection between Node backend and python.
# change later to use ML features for the website

from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib

app = Flask(__name__)
CORS(app)


#listens to data from nodeJS backend
@app.route('/flask', methods=['GET'])
def index():
    return jsonify({"message": "Flask server is running"})

@app.route('/flask-predict', methods=['POST'])
def predict():
    try:
        data = request.json.get('data')

        if not data:
            return jsonify({"error": "No data provided"})
        
        print("Data Recieved:", data)
        
        #ML prediction logic here
        prediction = {"result": "mock_predicition", "confidence": 0.95} #temp mock data delete later and replace with model results

        return jsonify(prediction), 200 #return status code of 200 alongside prediction to signal success

    except Exception as e:
        return jsonify({"error": str(e)}), 500 #return error message with status code of 500 to signal server error


if __name__ == "__main__":
    app.run(port=5000, debug=True) #running on port 5000, use this port to connect to in node 