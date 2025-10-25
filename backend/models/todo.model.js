// In backend/models/todo.model.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const todoSchema = new Schema({
    // NEW: Link to the User model
    user: {
        type: Schema.Types.ObjectId, // This will store the user's _id
        ref: 'User', // This refers to the 'User' model we created
        required: true
    },
    task: { type: String, required: true },
    completed: { type: Boolean, default: false },
    priority: {
        type: String,
        enum: ['Low', 'Medium', 'High'],
        default: 'Medium'
    }
}, {
    timestamps: true,
});

const Todo = mongoose.model('Todo', todoSchema);
module.exports = Todo;