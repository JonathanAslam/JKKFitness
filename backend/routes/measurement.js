// for updating user measurement data, used to update and retrieve

const express = require('express');
const router = express.Router(); 
const jwt = require('jsonwebtoken');
const auth = require('../middleware/authMiddleware')    //JWT middleware to determine if user is authenticated
const UserMeasurement = require('../models/userMeasurementModel');


// post profile data: api/measurement/
router.post("/", auth, async (req , res) => {
    //try and create/update the user's measurements
    try {
        // req body, all defined in the model
        const { units, age, sex, height, weight, bmi, bodyFat } = req.body;

        const measurement = await UserMeasurement.findOneAndUpdate(
            { userId: req.user.id },                // use JWT user id from authMiddleware.js
            { units, age, sex, height, weight, bmi, bodyFat, updatedAt: new Date()},

            // new: true --> Returns the updated document instead of the original one
            // upsert: true --> creates new document if one does not already exist (“Upsert” = update or insert)
            // setDefaultsOnInsert: true --> works with upsert to default values which need to be defaulted on creation of new document
            { new: true, upsert: true, setDefaultsOnInsert: true},
        )
        
        // on complete, return the json of the measurements
        res.status(200).json({measurement});
            
    } catch (error) {
        res.status(500).send("Error saving measurement: ", error);
    }
     
});


// get profile data: api/measurement/
router.get("/", auth, async (req , res) => {
    //try and get the user profile, return errors
    try {
        //req.user comes from the authMiddleware (decoded JWT if authenticated), check try block of authMiddleware
        const measurements = await UserMeasurement.find({userId: req.user.id}).sort({updatedAt: -1}).limit(1); //Sorts the results by the updatedAt field descending, meaning ONLY returned item is the most recent data since we use limit(1) to return one userMeasurement
        res.json(measurements[0] || null);
            
    } catch (error) {
        res.status(500).send("Error fetching measurements: ", error);
    }
     
});




module.exports = router;
