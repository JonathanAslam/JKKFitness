import csv

from helper_functions import *

filename = "gym_recommendation.csv"

# Read rows from dataset
rows = read_from_csvfile(filename)


# Convert categorical rows into numerical representations for models
#   For Sex: Male = 0; Female = 1
#   For Hypertension: No = 0; Yes = 1
#   For Diabetes: No = 0; Yes = 1
#   For Level: Underweight = 0, Normal = 1, Overweight = 2, Obese = 3
#   For Fitness Goal: Weight Gain = 0; Weight Loss = 1
features_to_change = ["Sex", "Hypertension", "Diabetes", "Level", "Fitness Goal"]
new_rows = []
for row in rows:
    new_row = {}
    for column, value in row.items():
        new_value = 0
        if (column not in features_to_change):
            new_row[column] = value
            continue
        if ((column == "Sex") and (value == "Female")):
            new_value = 1
        elif ((column == "Hypertension") and (value == "Yes")):
            new_value = 1
        elif ((column == "Diabetes") and (value == "Yes")):
            new_value = 1
        elif (column == "Level"):
            match value:
                case "Normal":
                    new_value = 1

                case "Overweight":
                    new_value = 2

                case "Obese":
                    new_value = 3
        elif ((column == "Fitness Goal") and (value == "Weight Loss")):
            new_value = 1
        new_row[column] = new_value
    new_rows.append(new_row)
rows = new_rows



# Remove rows with no target label data
#   6 target labels in this dataset
new_rows = []
removed_rows = []
for row in rows:
    keep_row = True
    for column, value in row.items():
        if (column == "Fitness Type") or (column == "Exercises") or (column == "Equipment") or (column == "Diet") or (column == "Recommendation"):
            if ((type(value) == str) and (len(value) == 0)):
                keep_row = False
                break
        else:
            continue
    if (keep_row):
        new_rows.append(row)
    else:
        removed_rows.append(row)
print(f"Removed {len(removed_rows)} rows which have no target label data")
rows = new_rows



# TO DO: Remove the first column: ID
#   ID column is not relevant to our models
new_rows = []
for row in rows:
    new_row = {}
    for column, value in row.items():
        if (column == "\ufeffID"):
            continue
        new_row[column] = value
    new_rows.append(new_row)
rows = new_rows
        


# print(rows[0]) 


# Make 5 separate datasets
#   Separate 5 target labels into their own individual datasets
for index in range(1, 6):
    target_label = ""
    fieldnames = []
    feature_labels = ["Sex", "Age", "Height", "Weight", "Hypertension", "Diabetes", "BMI", "Level", "Fitness Goal"]
    match index:
        case 1:
            target_label = "Fitness Type"
        
        case 2:
            target_label = "Exercises"
        
        case 3:
            target_label = "Equipment"
        
        case 4: 
            target_label = "Diet"
        
        case 5:
            target_label = "Recommendation"
        
        case _: #Default Case
            target_label = "Recommendation"
    
    # print(target_label)
    new_rows = []
    for row in rows:
        new_row = {}
        for column, value in row.items():
            if (column == target_label) or (column in feature_labels):
                new_row[column] = value
        new_rows.append(new_row)

    fieldnames = feature_labels
    fieldnames.append(target_label)
    new_filename = "gym_recommendation_" + target_label + ".csv"

    # Create new dataset for current target label
    with open(new_filename, 'w', newline = '') as csvfile:
        writer = csv.DictWriter(csvfile, fieldnames=fieldnames)

        writer.writeheader()
        for row in new_rows:
            writer.writerow(row)
# Now, we have 5 individual datasets each with their own target label  
