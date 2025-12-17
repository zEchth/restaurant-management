// src/server.js
const http = require('http');
const app = require('./app');
const prisma = require('./config/db');

// Gunakan port dari .env atau default 3000
const PORT = process.env.PORT || 3000;

const server = http.createServer(app);

async function startServer() {
  try {
    // Tes koneksi database sebelum buka port
    await prisma.$connect();
    console.log('✅ Database connected');

    server.listen(PORT, () => {
      console.log(`✅ Server is running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode.`);
    });
  } catch (err) {
    console.error('❌ Failed to start server:', err);
    process.exit(1);
  }
}

startServer();