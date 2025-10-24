const jwt = require('jsonwebtoken');

// Middleware to protect routes by verifying JWT token
const auth = (req, res, next) => {
    // Get token from header
    const token = req.header('x-auth-token');

    // Need to check if there is no token provided
    if (!token) {
        return res.status(401).json({msg: 'No token provided, authorization denied'});
    }
    try {
        // Verify token provided
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        // Add user from payload
        req.user = decoded.userId;
        next(); // proceed to next middleware or route handler
    } catch (error) {
        res.status(401).json({msg: 'Token is not valid'});
    }
};

module.exports = auth;