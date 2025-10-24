const express = require('express');
const cors = require('cors');
const connectedDB = require('./db/conn');
require('dotenv').config();

const PORT = process.env.PORT || 5050;
const app = express();

// connect to db with connectedDB function from ./db/conn.js
connectedDB();

// middleware
app.use(express.json());
app.use(cors());

// routes (auth routes for login and singup from ./routes/auth.js)
// (/api/auth) route handles signup/login.
const authRoute = require('./routes/auth');
app.use("/api/auth", authRoute);

// simple message when checking if backend port is running to verify
app.get('/', (req, res) => {
  res.send('Backend is running!');
});

// start the Express server
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});