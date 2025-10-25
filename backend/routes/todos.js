// In backend/routes/todos.js
const router = require('express').Router();
let Todo = require('../models/todo.model');
const authMiddleware = require('../middleware'); // NEW: Import our "bouncer"

// === ALL ROUTES ARE NOW PROTECTED ===
// We add 'authMiddleware' to every route.
// This function will run *before* the (req, res) handler.

// READ: Get all todos *for the logged-in user*
router.route('/').get(authMiddleware, async (req, res) => {
    try {
        // Find todos where the 'user' field matches the ID from the token
        const todos = await Todo.find({ user: req.user.id }).sort({ createdAt: -1 });
        res.json(todos);
    } catch (err) {
        res.status(500).json('Error: ' + err);
    }
});

// CREATE: Add a new todo *for the logged-in user*
router.route('/add').post(authMiddleware, (req, res) => {
    const { task, priority } = req.body;
    
    const newTodo = new Todo({ 
        task,
        priority,
        user: req.user.id // NEW: Attach the user's ID
    });

    newTodo.save()
        .then(() => res.json('Todo added!'))
        .catch(err => res.status(400).json('Error: ' + err));
});

// DELETE: Delete a todo
router.route('/:id').delete(authMiddleware, async (req, res) => {
    try {
        const todo = await Todo.findById(req.params.id);
        if (!todo) return res.status(404).json('Error: Todo not found');

        // NEW: Security check - make sure the user owns this todo
        if (todo.user.toString() !== req.user.id) {
            return res.status(401).json('Error: Not authorized');
        }

        await Todo.findByIdAndDelete(req.params.id);
        res.json('Todo deleted.');
    } catch (err) {
        // --- THIS IS THE FIX ---
        // Removed the extra 'Hi' from the string
        res.status(500).json('Error: ' + err);
    }
});

// UPDATE (Toggle Complete)
router.route('/update/:id').patch(authMiddleware, async (req, res) => {
    try {
        const todo = await Todo.findById(req.params.id);
        if (!todo) return res.status(404).json('Error: Todo not found');

        // NEW: Security check
        if (todo.user.toString() !== req.user.id) {
            return res.status(401).json('Error: Not authorized');
        }

        todo.completed = !todo.completed;
        await todo.save();
        res.json('Todo updated!');
    } catch (err) {
        res.status(500).json('Error: ' + err);
    }
});

// UPDATE (Text)
router.route('/update/text/:id').patch(authMiddleware, async (req, res) => {
     try {
        const todo = await Todo.findById(req.params.id);
        if (!todo) return res.status(404).json('Error: Todo not found');

        // NEW: Security check
        if (todo.user.toString() !== req.user.id) {
            return res.status(401).json('Error: Not authorized');
        }

        todo.task = req.body.task;
        await todo.save();
        res.json('Todo text updated!');
    } catch (err) {
        res.status(500).json('Error: ' + err);
    }
});

module.exports = router;