// In backend/server.js

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config(); // This loads the .env file

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// --- Connect to MongoDB ---
const uri = process.env.ATLAS_URI;
mongoose.connect(uri);
const connection = mongoose.connection;
connection.once('open', () => {
  console.log("MongoDB database connection established successfully");
})

// --- API Routes ---
const todosRouter = require('./routes/todos');
app.use('/todos', todosRouter);

// NEW: Add the auth routes
const authRouter = require('./routes/auth');
app.use('/auth', authRouter); // Use auth routes for any URL starting with /auth

// Start the server
app.listen(port, () => {
    console.log(`Server is running on port: ${port}`);
});