import csv
import joblib
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import confusion_matrix, accuracy_score, precision_recall_fscore_support

from helper_functions import *

METRICS = False

datasets = ["gym_recommendation_Diet.csv", "gym_recommendation_Equipment.csv", "gym_recommendation_Exercises.csv",
            "gym_recommendation_Fitness Type.csv", "gym_recommendation_Recommendation.csv"]

# Make Random Forest models for each dataset
for index, dataset in enumerate(datasets):

    # Find last occurence of '_' to get target label
    last_underscore = dataset.rfind('_')
    target_label = dataset[last_underscore + 1:-4]
    # print(target_label)

    rows = read_from_csvfile(dataset)

    X_train, X_test, y_train, y_test = split_into_test_train(rows, target_label)
    rf_model = RandomForestClassifier(n_estimators = 100, random_state = 42)
    rf_model.fit(X_train, y_train)

    # METRICS
    y_pred = rf_model.predict(X_test)

    accuracy = accuracy_score(y_test, y_pred)

    # Ignoring support, the 4th element
    precision, recall, f1, _ = precision_recall_fscore_support(y_test, y_pred, average="macro")

    # Round all metrics to 3 decimals
    accuracy = round(accuracy, 3)
    precision = round(precision, 3)
    recall = round(recall, 3)
    f1 = round(f1, 3)

    if (METRICS):
        print(f"For target label = '{target_label}', acc = {accuracy}, precision = {precision}, recall = {recall}, f1 = {f1}")

        cm = confusion_matrix(y_test, y_pred)
        print(cm)
        print()
        print()


    # Save model
    filename = "saved_models/random_forest_" + target_label + ".joblib"
    joblib.dump(rf_model, filename)
