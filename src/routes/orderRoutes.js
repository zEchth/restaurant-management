const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { authenticate } = require('../middleware/authMiddleware'); // Pastikan path sesuai

// Semua route di sini diproteksi oleh JWT (Wajib Login)
router.use(authenticate);

// POST /api/orders -> Buat pesanan baru
router.post('/', orderController.createOrder);

// GET /api/orders -> Lihat daftar pesanan
router.get('/', orderController.getOrders);

module.exports = router;