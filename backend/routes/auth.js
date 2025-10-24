// for login and signup routes

const express = require('express');
const router = express.Router(); 
const bcrypt = require('bcryptjs'); // for hashing paswords
const jwt = require('jsonwebtoken');
const User = require('../models/users');


// Signup route
router.post('/signup', async (req, res) => {
    const { username, email, password } = req.body;
    
    try {
        // Check if user already exists
        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ msg: 'User already exists' });
        }

        // Hash password (use 10 round salt for hashing, anything more is probably overkill for our case)
        const hashedPassword = await bcrypt.hash(password, 10);
        // Create new user
        user = new User({
            username,
            email,
            // make sure to store hashed password, not plaintext
            password: hashedPassword,
        });
        await user.save();

        // Create and sign JWT token - JWT token will be used to verify user identity for protected routes
        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
        res.json({token , user: { id: user._id, username: user.username, email: user.email } });
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server error');
    }
});


// Login route

router.post('/login', async (req, res) => {
    const {email, password} = req.body;

    try {
        // check if email is found
        let user = await User.findOne({ email });
        // no user --> return error
        if (!user) {
            return res.status(400).json({ message: 'Invalid login credentials' });
        }
        // compare password given to the password associated with the user account
        const isPasswordMatch = await bcrypt.compare(password, user.password);
        if (!isPasswordMatch) {
            return res.status(400).json({ message: 'Invalid login credentials' });
        }

        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
        res.json({token , user: { id: user._id, username: user.username, email: user.email } });
    } catch (error) {
        res.status(500).send('Server error');
    }
});




module.exports = router;


