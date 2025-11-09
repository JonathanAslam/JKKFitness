# Flask API for ML model predictions
from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import numpy as np
import pandas as pd

app = Flask(__name__)
CORS(app)

# Load all of the models at startuo
try:
    model_files = ['saved_models/random_forest_Recommendation.joblib',
                   'saved_models/random_forest_Diet.joblib',
                   'saved_models/random_forest_Equipment.joblib',
                   'saved_models/random_forest_Exercises.joblib',
                   'saved_models/random_forest_FitnessType.joblib']
    # Create a dictionary to hold the models
    model_list = {
        'recommendation': joblib.load(model_files[0]),
        'diet': joblib.load(model_files[1]),
        'equipment': joblib.load(model_files[2]),
        'exercises': joblib.load(model_files[3]),
        'fitnessType': joblib.load(model_files[4])
    }

    print("All models loaded successfully!")
except Exception as e:
    print(f"Error loading models: {str(e)}")
    model_list = None



# listens to data from nodeJS backend
@app.route('/flask', methods=['GET'])
def index():
    return jsonify({"message": "Flask server is running"})


# prediciton route
@app.route('/flask-predict', methods=['POST'])
def predict():

    #1. Ensure models are loaded
    if not model_list:
        return jsonify({"error": "Models not loaded on startup"}), 500

    #2. Get data from request, validate and convert to dataframe
    try: 
        # Get JSON data from request, coming from node backend on user sumbit
        json_data = request.json.get('data')
        if not json_data:
            return jsonify({"error": "No data provided"}), 400
        
        print("Raw Data Received:", json_data)


        # convert height and weight from imperial to metric if needed
        if 'units' in json_data and json_data['units'] == 'imperial':
            if 'height' in json_data:
                json_data['height'] = float(json_data['height']) * 0.0254  # inches to meters
            if 'weight' in json_data:
                json_data['weight'] = float(json_data['weight']) * 0.453592  # pounds to kg


            # generate level based on bmi, align with the data preprocessing during model training which uses 0-3 levels
        if 'bmi' in json_data:
                bmi = float(json_data['bmi'])
                if bmi < 18.5:
                    json_data['level'] = 0  # Underweight
                elif 18.5 <= bmi < 24.9:
                    json_data['level'] = 1  # Normal weight
                elif 25 <= bmi < 29.9:
                    json_data['level'] = 2  # Overweight
                else:
                    json_data['level'] = 3 # Obesity

            

            # Convert boolean/string values to proper format
        processed_data = {
            'sex': 1 if json_data['sex'] == 'female' else 0,  # Assuming female=1, male=0
            'age': float(json_data['age']),
            'height': float(json_data['height']),
            'weight': float(json_data['weight']),
            'hypertension': 1 if json_data['hypertension'] == 'yes' else 0,
            'diabetes': 1 if json_data['diabetes'] == 'yes' else 0,
            'bmi': float(json_data['bmi']),
            'level': float(json_data['level']),
            'fitnessGoal': 1 if json_data['fitnessGoal'] == 'loss' else 0 # Assuming loss=1, gain=0
            }




        # convert json data to pandas dataframe which is what the models expect
        input_data = pd.DataFrame([processed_data])


    except Exception as e:
        return jsonify({"error": f"Invalid data format: {str(e)}"}), 400


    #3. Make prediction using each of the models in a loop
    results = {}
    for model_name, model in model_list.items():
        try:
            prediction = model.predict(input_data)
            prediction_proba = model.predict_proba(input_data)
            confidence = np.max(prediction_proba)

            results[model_name] = {
                "result": prediction[0],
                "confidence": float(confidence)
            }

        except Exception as e:
            results[model_name] = {
                "error": f"Prediction error: {str(e)}"
            }

    #4. Return ALL of the predictions as JSON
    return jsonify(results), 200


if __name__ == "__main__":
    app.run(port=5000, debug=True) #running on port 5000, use this port to connect to in node 