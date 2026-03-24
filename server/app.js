require('dotenv').config();
require('express-async-errors'); // Handle async errors without try/catch blocks
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const AppError = require('./utils/appError');
const errorHandler = require('./middlewares/errorHandler');

// Route imports
const userRoutes = require('./routes/userRoutes');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Connect to database
connectDB();

// API Routes
app.use('/api/v1/users', userRoutes);

// Basic health check route
app.get('/api/v1/health', (req, res) => {
  res.status(200).json({ status: 'success', message: 'Server is running' });
});

// Handle undefined routes
app.all('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// Global error handling middleware
app.use(errorHandler);

const PORT = process.env.PORT || 3000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT}`);
});
