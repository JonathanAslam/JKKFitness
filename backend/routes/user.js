// for protected routes that require authenticated users who are logged in

const express = require('express');
const router = express.Router(); 
const jwt = require('jsonwebtoken');
const auth = require('../middleware/authMiddleware')    //JWT middleware to determine if user is authenticated
const User = require('../models/userModels');


// get profile data: api/user/profile
router.get("/profile", auth, async (req , res) => {
    //try and get the user profile, return errors
    try {
        //UPDATED: req.user.id comes from the authMiddleware (decoded JWT if authenticated), check try block of authMiddleware
        const userData = await User.findById(req.user.id).select("-password"); //return results without the password 
        if (!userData) {
            return res.status(404).json({message: "User not found"});
        }
        res.json({userData}); // user data to be delivered on api
        
    } catch (error) {
        res.status(500).send("Server error");
    }
     
});




module.exports = router;
