const express = require('express');
const cors = require('cors');
const connectedDB = require('./db/conn');
const cookieParser = require('cookie-parser');
require('dotenv').config();

const PORT = process.env.PORT || 5050;
const app = express();

// connect to db with connectedDB function from ./db/conn.js
connectedDB();

// middleware
app.use(express.json());
app.use(cors({
  origin: process.env.FRONTEND_URL, // frontend URL, needed for cookies to work
  credentials: true, // allow cookies for http-only cookies with jwt (more secure than local-storage)
}));
app.use(cookieParser());  //allows for req.cookies in our routes and middleware

// routes (auth routes for login and singup from ./routes/auth.js)
// (/api/auth) route handles signup/login.
const authRoute = require('./routes/auth'); 
const userRoute = require('./routes/user');
const measurementRoute = require('./routes/measurement');
const nutritionRoute = require('./routes/nutrition');   
const mlServiceRoute = require('./routes/mlService');

app.use("/api/auth", authRoute);  //    /signup, /login, 
app.use("/api/user", userRoute);  //    /profile
app.use("/api/measurement", measurementRoute); //    / (get and post for measurement)
app.use("/api/nutrition", nutritionRoute); //    /analyze
app.use("/api/ml", mlServiceRoute)  //    /predict 

// simple message when checking if backend port is running to verify
app.get('/', (req, res) => {
  res.send('Backend is running!');
});

// start the Express server
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
