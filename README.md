# FitnessApp-481

## Render
- Build Command: Render runs this command to build your app before each deploy.
- - npm install 

- Start Command: Render runs this command to start your app with each deploy.
- - npm start


## Nutrition API Setup
- Nutritionix only:
  - Set `NUTRITIONIX_APP_ID` and `NUTRITIONIX_API_KEY` in backend env.
- Ensure `FRONTEND_URL` is set to your frontend origin (e.g., `http://localhost:5173`).
- Frontend should have `VITE_API_URL` pointing to backend API base (e.g., `http://localhost:5050/api`).


## AI Features

### User Input / Calculated values passed to ML Model

| Column | Data Type | Preprocessing |
|---|---|---|
| Sex | Categorical | One-Hot Encoding (OHE) |
| Age | Numerical | StandardScaler |
| Height | Numerical | StandardScaler |
| Weight | Numerical | StandardScaler |
| Hypertension | Binary Categorical (Yes/No) | OHE or Label Encoding (0/1) |
| BMI | Numerical | StandardScaler |
| Fitness Goal | Categorical | OHE |
| Fitness Type | Categorical | OHE |
| Level (BMI related) | Categorical | OHE (or Ordinal Encoding if there is a natural order) |

### ML Model Output Targets

| Output Columns | Problem Type | Note |
|---|---|---|
| Exercises | Multi-Label (comma-separated list) | "The model needs to predict a combination of exercises. This requires Multi-Label Classification (more complex, see note below)." |
| Equipement | Multi-Label (comma-separated list) | `Similar to Exercises` | 
| Diet | Multi-Label (complex text) | Challenege: The text is structured too long and varied for a simple classification model | 
| Recommendation | Multi-Class | Good News: Your inspection showed only 9 unique recommendations! This is perfect for standard Multi-Class Classification | 

### Reccomended Models

1. Simple Version (Focus on the Main Recommendation)
  - Define Target: `Use only the Recommendation column as your target (Y).`
  - Model: Use a Random Forest Classifier (standard single-output).
  - Process:
    - Label Encode the 9 unique Recommendation strings (e.g., 'Plan A', 'Plan B', ..., 'Plan I').
    - Train the model to predict the encoded number.
    - In the Flask API, predict the number, then decode it back to the text string.

2. Complex Version (The Full Multi-Output System)
`USE ONLY If you need the individual Exercises, Equipment, and Diet fields to be predicted:`
  - Target Transformation: For `Exercises`, `Equipment`, and `Diet`, you must split the comma-separated or semicolon-separated items into binary columns (e.g., has_squats, has_dumbbells). This is a `Multi-Label Classification problem`. 
  - Model: Use `MultiOutputClassifier(RandomForestClassifier)` but **target all four columns**.
  - Process: The model predicts `four` outputs simultaneously. The predicted numerical codes for `Exercises`, `Equipment`, and `Diet` are then decoded into a list of specific items for display