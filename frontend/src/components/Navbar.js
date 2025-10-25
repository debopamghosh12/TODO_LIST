// frontend/src/components/Navbar.js
import React from 'react';
import { Link } from 'react-router-dom';
import './Navbar.css';

const Navbar = ({ token, setToken }) => {
  const handleLogout = () => {
    setToken(null);
    localStorage.removeItem('token');
  };

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-brand">My To-Do List</Link>
      <div className="navbar-links">
        {token ? (
          <button onClick={handleLogout} className="nav-button">Logout</button>
        ) : (
          <>
            <Link to="/login" className="nav-link">Login</Link>
            <Link to="/signup" className="nav-link">Signup</Link>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
