import joblib

from helper_functions import *


filename = "gym_recommendation_Diet.csv"

# Read rows from dataset
rows = read_from_csvfile(filename)

target_label = "Diet"
X_train, X_test, y_train, y_test = split_into_test_train(rows, target_label)

model_filename = "saved_models/random_forest_Diet.joblib"
loaded_model = joblib.load(model_filename)

y_pred = loaded_model.predict(X_test)
print(y_pred)