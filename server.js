require('dotenv').config();
const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');
const meetRoutes = require('./routes/meetRoutes');
const testRoutes = require('./routes/testRoutes');
const callendarRoutes = require('./routes/callendarRoutes');
const connectDB = require('./config/db');
const cookieParser = require('cookie-parser');

const app = express();

// Middleware
app.use(cors({
    origin: 'http://localhost:5173', 
    credentials: true,
}));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());

// Database connection
connectDB();

// Routes
app.use('/', authRoutes);
app.use('/api/meet', meetRoutes);
app.use('/api/test', testRoutes);
app.use('/api/callendar', callendarRoutes);


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));