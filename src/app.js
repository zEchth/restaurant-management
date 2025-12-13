require('dotenv').config(); // 1. Pindahkan ke paling atas (Best Practice)
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

// Import Routes
const authRoutes = require('./routes/authRoutes');
const orderRoutes = require('./routes/orderRoutes');
const menuRoutes = require('./routes/menuRoutes');

const app = express();

// Global Middleware
app.use(cors());
app.use(express.json()); // Parsing body JSON

// Logger hanya di Development
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Routes Registration
app.use('/api/auth', authRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/menus', menuRoutes);

// 404 Handler (Route Not Found)
app.use((req, res, next) => {
  // 2. Ubah format response agar konsisten dengan Error Handler (success: false)
  res.status(404).json({ 
    success: false, 
    message: `Route ${req.originalUrl} not found` 
  });
});

// Global Error Handler (Centralized)
app.use((err, req, res, next) => {
  console.error(err); // Log error di console server (penting untuk debugging)

  // A. Handle Prisma Error (P2002 = Unique Constraint, misal Email kembar)
  if (err.code === 'P2002') {
    return res.status(409).json({
      success: false,
      message: 'Data conflict (Duplikat)',
      field: err.meta?.target
    });
  }

  // B. Handle Prisma Not Found (P2025)
  if (err.code === 'P2025') {
    return res.status(404).json({
      success: false,
      message: 'Data tidak ditemukan'
    });
  }

  // C. Handle Joi Validation Error
  if (err.isJoi) {
    return res.status(400).json({
      success: false,
      message: 'Validasi Gagal',
      errors: err.details.map(d => d.message)
    });
  }

  // D. Default Error (Internal Server Error)
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal Server Error',
    // Security: Stack trace hanya muncul di development
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

module.exports = app;