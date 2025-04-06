require('dotenv').config();
const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');
const meetRoutes = require('./routes/meetRoutes');
const testRoutes = require('./routes/testRoutes');
const callendarRoutes = require('./routes/callendarRoutes');
const translationRoutes = require('./routes/translationRoutes');
const connectDB = require('./config/db');
const cookieParser = require('cookie-parser');

const app = express();

// Middleware
app.use(cors({
    origin: [
      'http://localhost:3000',
      'http://localhost:5173',
      'https://dashboard.lingomeet.space',
      'https://api.lingomeet.space',
      'https://addon.lingomeet.space'
    ], // Add both origins
    credentials: true,
  }));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());


// Database connection
connectDB();

// Routes

app.get('/', (req, res) => {
    res.send('Welcome to the lingomeet backend...');
});

app.get('/api', (req, res) => {
    res.send('API is running...');

});

app.use('/api/auth', authRoutes);
app.use('/api/meet', meetRoutes);
app.use('/api/test', testRoutes);
app.use('/api/callendar', callendarRoutes);
app.use('/api/translation', translationRoutes);


app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

module.exports = app; // Export the app for testing purposes