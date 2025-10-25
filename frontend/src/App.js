// In frontend/src/App.js
import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, Navigate } from 'react-router-dom';
import axios from 'axios';

// Import Components
import Navbar from './components/Navbar';
import Login from './components/Login';
import Signup from './components/Signup';

// Import CSS
import './App.css'; 

// --- Set Axios defaults ---
// This is a helper function to attach the token to all future requests
const setAuthToken = (token) => {
  if (token) {
    axios.defaults.headers.common['x-auth-token'] = token;
  } else {
    delete axios.defaults.headers.common['x-auth-token'];
  }
};

// ===================================================
// 1. MAIN APP COMPONENT (Router & Auth Manager)
// ===================================================
function App() {
  // Get token from localStorage (if it exists)
  const [token, setToken] = useState(localStorage.getItem('token'));
  
  // Set the token in axios headers whenever it changes
  useEffect(() => {
    if (token) {
      setAuthToken(token);
    }
  }, [token]);

  return (
    <div>
      <Navbar token={token} setToken={setToken} />
      <Routes>
        <Route 
          path="/" 
          element={
            // NEW: Protected Route
            // If user is logged in (has token), show TodoList
            // Otherwise, redirect to /login
            token ? <TodoList /> : <Navigate to="/login" />
          } 
        />
        <Route 
          path="/login" 
          element={
            // If user is logged *in*, redirect to home
            !token ? <Login setToken={setToken} /> : <Navigate to="/" />
          } 
        />
        <Route 
          path="/signup" 
          element={
            !token ? <Signup setToken={setToken} /> : <Navigate to="/" />
          } 
        />
      </Routes>
    </div>
  );
}

export default App;


// ===================================================
// 2. TODOLIST COMPONENT (Your old App.js logic)
// ===================================================
// We've moved all your old to-do list logic into its own component.
// This component will *only* be shown if the user is logged in.

const API_URL = 'http://localhost:5000/todos';

const TodoList = () => {
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState('');
  const [newPriority, setNewPriority] = useState('Medium');
  const [editingTask, setEditingTask] = useState(null); 
  const [editText, setEditText] = useState('');

  // UI/UX state variables
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const navigate = useNavigate(); // To redirect if token is bad

  // 1. READ
  useEffect(() => {
    setLoading(true);
    setError(null);

    // Because we set the token in axios defaults, this request
    // will automatically include the 'x-auth-token' header.
    axios.get(API_URL)
      .then(res => {
        const sortedTasks = res.data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setTasks(sortedTasks);
        setLoading(false);
      })
      .catch(err => {
        console.log(err);
        // NEW: If token is invalid (401), log out the user
        if (err.response && err.response.status === 401) {
            localStorage.removeItem('token');
            navigate('/login'); // Redirect to login
        } else {
            setError('Failed to load tasks. Is the server running?');
        }
        setLoading(false);
      });
  }, [navigate]); // Add navigate as dependency

  // 2. CREATE
  const addTask = (e) => {
    e.preventDefault(); 
    if (!newTask) return;
    setError(null);
    
    axios.post(`${API_URL}/add`, { task: newTask, priority: newPriority })
      .then(res => {
        // Refetch to get the new list
        axios.get(API_URL)
          .then(res => {
            const sortedTasks = res.data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            setTasks(sortedTasks);
          })
          .catch(err => setError('Failed to refresh tasks list.'));
        setNewTask('');
        setNewPriority('Medium');
      })
      .catch(err => setError('Failed to add task. Please try again.'));
  };

  // 3. DELETE
  const deleteTask = (id) => {
    axios.delete(`${API_URL}/${id}`)
      .then(res => setTasks(tasks.filter(task => task._id !== id)))
      .catch(err => setError('Failed to delete task.'));
  };

  // 4. UPDATE (Toggle Complete)
  const toggleTask = (id) => {
    axios.patch(`${API_URL}/update/${id}`)
      .then(res => {
        setTasks(tasks.map(task =>
          task._id === id ? { ...task, completed: !task.completed } : task
        ));
      })
      .catch(err => setError('Failed to update task.'));
  };

  // 5. UPDATE (Edit Text)
  const handleEdit = (task) => {
    setEditingTask(task._id);
    setEditText(task.task);
  };

  // 6. UPDATE (Save Text)
  const handleSave = (id) => {
    axios.patch(`${API_URL}/update/text/${id}`, { task: editText })
      .then(res => {
        setTasks(tasks.map(task =>
          task._id === id ? { ...task, task: editText } : task
        ));
        setEditingTask(null);
        setEditText('');
      })
      .catch(err => setError('Failed to save task.'));
  };

  // Helper function to render the task list area
  const renderTaskList = () => {
    if (loading) {
      return <div className="loading">Loading tasks...</div>;
    }
    
    if (tasks.length === 0 && !loading) {
        return <div className="empty-message">No tasks yet. Add one!</div>;
    }

    return (
      <ul className="task-list">
        {tasks.map(task => (
          <li key={task._id} className={task.completed ? 'completed' : ''}>
            {editingTask === task._id ? (
              <>
                <input 
                  type="text" 
                  className="edit-input"
                  value={editText} 
                  onChange={(e) => setEditText(e.target.value)} 
                />
                <button className="save-btn" onClick={() => handleSave(task._id)}>Save</button>
              </>
            ) : (
              <>
                <span className={`priority-badge priority-${task.priority?.toLowerCase() || 'n/a'}`}>
                  {task.priority || 'N/A'} 
                </span>
                <span className="task-text" onClick={() => toggleTask(task._id)}>
                  {task.task}
                </span>
                <div className="buttons-container">
                  <button className="edit-btn" onClick={() => handleEdit(task)}>Edit</button>
                  <button className="delete-btn" onClick={() => deleteTask(task._id)}>Delete</button>
                </div>
              </>
            )}
          </li>
        ))}
      </ul>
    );
  }

  // This is the JSX for the TodoList component
  return (
    <div className="App">
      <h1>My To-Do List</h1>
      <form onSubmit={addTask}>
        <input
          type="text"
          className="task-input"
          value={newTask}
          onChange={(e) => setNewTask(e.target.value)}
          placeholder="Add a new task..."
        />
        <select 
          className="priority-select"
          value={newPriority} 
          onChange={(e) => setNewPriority(e.target.value)}
        >
          <option value="Low">Low</option>
          <option value="Medium">Medium</option>
          <option value="High">High</option>
        </select>
        <button type="submit">Add Task</button>
      </form>
      {error && <div className="error-message">{error}</div>}
      {renderTaskList()}
    </div>
  );
};