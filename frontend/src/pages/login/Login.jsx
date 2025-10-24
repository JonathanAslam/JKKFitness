import React, { useState } from 'react'
import '../pagestyle/FormStyle.css';
import axios from 'axios';

const Login = () => {
  // Toggle between login and signup
  const [hasAccount, setHasAccount] = useState(false);

  // State for form values
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
  });

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle user signup
  const handleSignUp = async (e) => {
    e.preventDefault();
    // Add future login logic here (use same port number as .env PORT)
    try {
      const result = await axios.post('http://localhost:5001/api/auth/signup', formData);
      localStorage.setItem('token', result.data.token);
      alert('Successfully Signed Up!');
    } catch (error) {
      console.error('Error Creating Account:', error);
      // show error from backend as well with alert() 
      alert('Sign up failed. Please check your credentials.');
    }

    console.log('Form submitted:', formData);
  };

  // Handle user login
  const handleLogin = async (e) => {
    e.preventDefault();
    // grab email and password from the form state
    const { email, password } = formData;

    try {
      // only pass email and password for login, no username needed
      const result = await axios.post('http://localhost:5001/api/auth/login', { email, password });

      // Expect the backend to return a token at result.data.token
      if (result?.data?.token) {
        localStorage.setItem('token', result.data.token);
        alert('Login successful!');
        // you could redirect here if you have routing, e.g. navigate('/app')
      } else {
        console.error('Unexpected login response:', result);
        alert('Login failed: no token returned from server.');
      }
    } catch (error) {
      console.error('Login error:', error);
      // show error from backend as well with alert() 
      alert('Login failed. Please check your credentials.');
    }

    console.log('Form submitted:', formData);
  };

  // Reset form to initial values
  const handleReset = () => {
    setFormData({
      username: '',
      password: '',
      email: '',
    });


  };
  return (
    <div className="container">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>

        <h3>{hasAccount ? 'Login' : 'Sign Up'}</h3>

        <button
          onClick={() => setHasAccount(!hasAccount)}
          className="button button-primary"
        >
          {hasAccount ? "Sign Up Here" : " Login Here"}
        </button>
      </div>

      <div className="form">
        {/* need to handle signup and login differently so call the function depending which form is showing */}
        <form onSubmit={hasAccount ? handleLogin : handleSignUp} noValidate>

          {!hasAccount && (
            <div className="form-row">
              <label>Username</label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                className='form-select'
                required
              />
            </div>
          )}

          <div className="form-row">
            <label>Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className='form-select'
              required
            />
          </div>

          <div className="form-row">
            <label>Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className='form-select'
              required
            />
          </div>

          <div className="form-actions">
            <button
              type="button"
              onClick={handleReset}
              className="button button-secondary"
            >
              Reset
            </button>

            <button
              type="submit"
              className="button button-primary"
            >
              {hasAccount ? 'Login' : 'Create Account'}
            </button>

          </div>


        </form>
      </div>
    </div>
  )
}

export default Login
