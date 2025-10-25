// In backend/routes/auth.js

const router = require('express').Router();
const User = require('../models/user.model');
const { body, validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
require('dotenv').config(); // To get our JWT_SECRET

// --- 1. SIGNUP (Register) Route ---
// @route   POST /auth/signup
// @desc    Register a new user
// @access  Public
router.post(
  '/signup',
  [
    // Validation checks using express-validator
    body('username', 'Username must be at least 3 characters').isLength({ min: 3 }),
    body('email', 'Please include a valid email').isEmail(),
    body('password', 'Password must be at least 6 characters').isLength({ min: 6 }),
  ],
  async (req, res) => {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, email, password } = req.body;

    try {
      // Check if user already exists (by email or username)
      let user = await User.findOne({ $or: [{ email }, { username }] });
      if (user) {
        return res.status(400).json({ msg: 'User already exists' });
      }

      // Create new user instance (password will be hashed by the 'pre-save' hook in the model)
      user = new User({
        username,
        email,
        password,
      });

      // Save the user to the database
      await user.save();

      // --- Create and return a JSON Web Token (JWT) ---
      const payload = {
        user: {
          id: user.id, // This is the user's MongoDB _id
        },
      };

      jwt.sign(
        payload,
        process.env.JWT_SECRET,
        { expiresIn: '1h' }, // Token expires in 1 hour
        (err, token) => {
          if (err) throw err;
          res.json({ token }); // Send the token back to the client
        }
      );
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    }
  }
);

// --- 2. LOGIN Route ---
// @route   POST /auth/login
// @desc    Authenticate user & get token (login)
// @access  Public
router.post(
  '/login',
  [
    // Validation checks
    body('email', 'Please include a valid email').isEmail(),
    body('password', 'Password is required').exists(),
  ],
  async (req, res) => {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    try {
      // Check if user exists
      let user = await User.findOne({ email });
      if (!user) {
        return res.status(400).json({ msg: 'Invalid credentials' });
      }

      // Compare submitted password with the hashed password in the database
      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        return res.status(400).json({ msg: 'Invalid credentials' });
      }

      // --- User is valid, create and return JWT ---
      const payload = {
        user: {
          id: user.id,
        },
      };

      jwt.sign(
        payload,
        process.env.JWT_SECRET,
        { expiresIn: '1h' },
        (err, token) => {
          if (err) throw err;
          res.json({ token });
        }
      );
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    }
  }
);

module.exports = router;