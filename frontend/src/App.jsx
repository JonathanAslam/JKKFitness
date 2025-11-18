import React, { useEffect } from 'react'
import { BrowserRouter as Router } from 'react-router-dom'
import './App.css';
import AppContent from './pages/appcontent/AppContent';
import api from './api/api'

function App() {

  // Wake up ML server AND Node backend on app load
  useEffect(() => {
    const wakeUpServer = async () => {
      try {
        // ping ml server using the node route which pings the default flask route.
        // this will also wake up the node backend since this call is made from the frontend to the backend, then flask call inside the route
        await api.get('/ml/ping-server'); 
        console.log('ML server is awake');
      } catch (error) {
        console.error('Error waking up ML server:', error);
      }
    };

    wakeUpServer();
  }, []); // Empty dependency array ensures this runs once on mount

  return (
    <>
      <Router>
        <AppContent/>
      </Router>
    </>
  )
}

export default App
