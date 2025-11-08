import csv
from sklearn.model_selection import train_test_split


def read_from_csvfile(filename) -> list:
    """Read rows from a csv dataset and return rows"""

    rows = []
    fieldnames = []
    with open (filename, 'r') as csvfile:
        csvreader = csv.DictReader(csvfile)
        
        for row in csvreader:
            rows.append(row)
            for column in row:
                if (column not in fieldnames):
                    fieldnames += [column] 
    
    return rows


def split_into_test_train(rows, target_label, test_size = 0.2):
    """Split data into train and test sets"""

    X = []
    y = []

    for row in rows:
        input_list = []
        for column, value in row.items():
            if (column == target_label):
                y.append(value)
            else:
                input_list.append(value)
        X.append(input_list)

    if (len(X) != len(y)):
        raise Exception("Error, lengths of X and y vectors do not match")
    
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=test_size, random_state=42)

    return X_train, X_test, y_train, y_test
    





# TESTS
# rows = read_from_csvfile("gym_recommendation.csv")
# X_train, X_test, y_train, y_test = split_into_test_train(rows, "Exercises")
            