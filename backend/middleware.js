// In backend/middleware.js
const jwt = require('jsonwebtoken');
require('dotenv').config();

// This is our "bouncer" function
module.exports = function (req, res, next) {
  // Get token from the request header (we'll send this from React)
  const token = req.header('x-auth-token');

  // Check if no token is provided
  if (!token) {
    return res.status(401).json({ msg: 'No token, authorization denied' });
  }

  // Verify the token
  try {
    // jwt.verify decodes the token using your secret key
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // If the token is valid, add the user's info (just the ID) to the request object
    req.user = decoded.user;
    next(); // Tell Express to move on to the actual route
  } catch (err) {
    // If the token is invalid (e.g., expired or wrong secret)
    res.status(401).json({ msg: 'Token is not valid' });
  }
};