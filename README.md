# FitnessApp-481


## Render
- Build Command: Render runs this command to build your app before each deploy.
- - npm install && npm install --prefix backend && npm install --prefix frontend && npm run build --prefix frontend

- Start Command: Render runs this command to start your app with each deploy.
- - npm start --prefix backend

<<<<<<< Updated upstream
=======
## Nutrition API Setup
- Nutritionix only:
  - Set `NUTRITIONIX_APP_ID` and `NUTRITIONIX_API_KEY` in backend env.
- Ensure `FRONTEND_URL` is set to your frontend origin (e.g., `http://localhost:5173`).
- Frontend should have `VITE_API_URL` pointing to backend API base (e.g., `http://localhost:5050/api`).

.
<<<<<<< Updated upstream
>>>>>>> Stashed changes
=======
>>>>>>> Stashed changes
