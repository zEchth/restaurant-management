require('dotenv').config(); 
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const fs = require('fs');
const path = require('path');

const accessLogStream = fs.createWriteStream(path.join(__dirname, 'access.log'), { flags: 'a' });

const compression = require('compression');

// Import Routes
const authRoutes = require('./routes/authRoutes');
const orderRoutes = require('./routes/orderRoutes');
const menuRoutes = require('./routes/menuRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const userRoutes = require('./routes/userRoutes');

const app = express();

// Konfigurasi Limiter
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // Jangka waktu: 15 menit
  max: 100, // Batas: maksimal 100 request per IP dalam 15 menit
  message: {
    success: false,
    message: "Terlalu banyak permintaan dari IP ini, silakan coba lagi setelah 15 menit"
  },
  standardHeaders: true, // Kembalikan info limit di header `RateLimit-*`
  legacyHeaders: false, // Matikan header `X-RateLimit-*` yang lama
});

// Global Middleware
app.use(compression());
app.use(helmet({
  contentSecurityPolicy: false, 
  crossOriginResourcePolicy: { policy: "cross-origin" } 
}));
app.use('/api/', limiter);
app.use(express.json()); // Parsing body JSON

// Logger hanya di Development
if (process.env.NODE_ENV === 'production') {
    app.use(morgan('combined', { stream: accessLogStream })); 
} else {
    app.use(morgan('dev')); // Format log 'dev' untuk pengembangan
}

app.use(cors({
  origin: 'http://100.28.231.115',
}));

// Routes Registration
app.use('/api/auth', authRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/menus', menuRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/users', userRoutes);

// --- HEALTH CHECK ENDPOINT ---
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'Server is running healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// --- SERVE FRONTEND (STATIC FILES) ---
// const frontendPath = path.join(__dirname, '../../restaurant-frontend/dist');
// app.use(express.static(frontendPath));

// 2. Handle React Routing (SPA)
// Jika route tidak dikenali API, kirimkan index.html React
// app.use((req, res) => {
//   res.sendFile(path.join(frontendPath, 'index.html'));
// });

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