const express = require('express');
const router = express.Router(); 
const auth = require('../middleware/authMiddleware'); // JWT middleware for auth
const axios = require('axios');     // cant use api from frontend here, just use axios

const rawFlaskUrl = (process.env.FLASK_URL || '').trim();
const flaskBaseUrl = rawFlaskUrl || 'http://127.0.0.1:5000';

if (!rawFlaskUrl) {
    console.warn('[mlService] FLASK_URL not set. Defaulting to http://127.0.0.1:5000');
}

const ensureFlaskConfigured = (res) => {
    if (!flaskBaseUrl) {
        console.error('[mlService] No Flask base URL configured.');
        if (res) {
            res.status(500).json({
                message: "ML service is not configured",
                error: "Set FLASK_URL in backend/.env or provide a fallback URL."
            });
        }
        return false;
    }
    return true;
};


// create a route to ping the flask server inorder to start it up on Render deployment
// no auth needed, want this to ping every time someone launches the website in order to keep uptime as long as possible
router.get("/ping-server", async (req, res) => {
    try {
        if (!ensureFlaskConfigured(res)) return;
        // default flask route, just to ping server. 
        const flaskResponse = await axios.get(`${flaskBaseUrl}/flask`);
        res.json({
            message: "Flask server is reachable.",
            status: flaskResponse.status
        });
    } catch (error) {
        console.error("Error pinging Flask server: ", error.message);

        // If Flask server is not reachable
        if (error.code === 'ECONNREFUSED') {
            console.error('[mlService] Connection refused when contacting Flask at', flaskBaseUrl);
            res.status(503).json({
                message: "ML service is not available",
                error: "Could not connect to prediction service"
            });
        } else {
            // Generic server error
            console.error('[mlService] Unexpected error:', error);
            res.status(500).json({ 
                message: "Internal server error", 
                error: error.message
            })
        }
    }
});




// create an async function to POST to flask server
router.post("/predict", auth, async (req , res) => {
    try {
        // Get input data from request body
        const inputData = req.body.data;

        // Log the incoming data for debugging
        console.log('[mlService] Incoming ML inputData:', JSON.stringify(inputData));

        // Validate input data, dont want to connnect to model if nothing provided
        if (!inputData) {
            return res.status(400).json({ message: "No input data provided" });
        }

        // target the flask predict specifically from the app.py file 
        // send data to flask server, 127.0.0.1 given by flask server on app.py startup in venv
        
        if (!ensureFlaskConfigured(res)) return;

        const flaskResponse = await axios.post(`${flaskBaseUrl}/flask-predict`, {
            data: inputData
        });

        console.log('[mlService] Flask response status:', flaskResponse.status);
        console.log('[mlService] Flask response data:', JSON.stringify(flaskResponse.data));

        // return flask server response to client
        res.json({
            prediction: flaskResponse.data,
            message: "Prediction successful."
        })

    } catch (error) {
        console.error("Error in ml_service.js: ", error.message);

        // If Flask returned an error response, log and forward it
        if (error.response) {
            console.error('[mlService] Flask returned status:', error.response.status);
            console.error('[mlService] Flask response data:', JSON.stringify(error.response.data));
            return res.status(error.response.status).json({
                message: error.response.data.error || "Flask server error",
                error: error.response.data
            });
        }

        // If Flask server is not reachable
        if (error.code === 'ECONNREFUSED') {
            console.error('[mlService] Connection refused when contacting Flask at', flaskBaseUrl);
            return res.status(503).json({
                message: "ML service is not available",
                error: "Could not connect to prediction service"
            });
        }

        // Generic server error
        console.error('[mlService] Unexpected error:', error);
        res.status(500).json({ 
            message: "Internal server error", 
            error: error.message 
        });
    }
});

module.exports = router;
