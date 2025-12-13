const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
require('dotenv').config();

// Import Routes
const authRoutes = require('./routes/authRoutes'); // Asumsi file ini ada (dari langkah sblmnya)
const orderRoutes = require('./routes/orderRoutes');

const app = express();

// Global Middleware
app.use(cors());
app.use(express.json()); // Parsing body JSON
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev')); // Logger
}

// Routes Registration
app.use('/api/auth', authRoutes);
app.use('/api/orders', orderRoutes);

// 404 Handler
app.use((req, res, next) => {
  res.status(404).json({ status: 'fail', message: 'Route not found' });
});

// Global Error Handler (Centralized)
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    status: 'error',
    message: err.message || 'Internal Server Error'
  });
});

module.exports = app;