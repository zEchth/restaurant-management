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

// Global Error Handler (Centralized)
app.use((err, req, res, next) => {
  console.error(err); // Tetap log ke console server

  // 1. Handle Prisma Error (P2002 = Unique Constraint, misal Email kembar)
  if (err.code === 'P2002') {
    return res.status(409).json({
      success: false,
      message: 'Data sudah ada (Duplikat)',
      field: err.meta?.target
    });
  }

  // 2. Handle Prisma Not Found
  if (err.code === 'P2025') {
    return res.status(404).json({
      success: false,
      message: 'Data tidak ditemukan'
    });
  }

  // 3. Handle Joi Validation Error (Jika pakai middleware terpisah)
  if (err.isJoi) {
    return res.status(400).json({
      success: false,
      message: 'Validasi Gagal',
      errors: err.details.map(d => d.message)
    });
  }

  // 4. Default Error (Internal Server Error)
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal Server Error',
    // Sesuai syarat: Stack trace hanya muncul di development
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
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