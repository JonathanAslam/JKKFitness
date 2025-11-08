const express = require('express');
const router = express.Router(); 
const auth = require('../middleware/authMiddleware'); // JWT middleware for auth
const axios = require('axios');     // cant use api from frontend here, just use axios

// create an async function to POST to flask server
router.post("/predict", auth, async (req , res) => {
    try {
        // Get input data from request body
        const inputData = req.body.data;

        // Validate input data, dont want to connnect to model if nothing provided
        if (!inputData) {
            return res.status(400).json({ message: "No input data provided" });
        }

        // target the flask predict specifically from the app.py file 
        // send data to flask server, 127.0.0.1 given by flask server on app.py startup in venv
        
        const flaskResponse = await axios.post(`${process.env.FLASK_URL}/flask-predict`, {
            data: inputData
        });
        
        // return flask server response to client
        res.json({
            prediction: flaskResponse.data,
            message: "Prediction successful."
        })

    } catch (error) {
        console.error("Error in ml_service.js: ", error.message)

        // Check if it's a Flask server error
        if (error.response) {
            return res.status(error.response.status).json({
                message: "Flask server error",
                error: error.response.data
            });
        }

        // Generic server error
        res.status(500).json({ message: "Server error 1" });
    }
});

module.exports = router;
