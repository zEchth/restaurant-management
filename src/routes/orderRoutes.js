const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { authenticate, authorize } = require('../middleware/authMiddleware');
const { checkOrderOwnership } = require('../middleware/ownershipMiddleware');

// ==========================================================
// GLOBAL MIDDLEWARE
// Semua route di bawah ini mewajibkan Login (Token Valid)
// ==========================================================
router.use(authenticate);


// ==========================================================
// ROUTE UMUM (Tanpa ID)
// ==========================================================

// GET /api/orders (List semua order dengan filter/pagination)
router.get('/', authorize('USER', 'ADMIN'), orderController.getOrders);

// POST /api/orders (Buat order baru)
router.post('/', authorize('USER', 'ADMIN'), orderController.createOrder);


// ==========================================================
// ROUTE SPESIFIK (Butuh ID)
// ==========================================================

// GET /api/orders/:id (Lihat Detail Order)
router.get('/:id', authorize('USER', 'ADMIN'), orderController.getOrderById);

// PATCH /api/orders/:id/status (Update Status: PAID/READY)
router.patch('/:id/status', authorize('USER', 'ADMIN'), orderController.updateStatus);

// DELETE /api/orders/:id (Cancel Order)
// pakai middleware tambahan 'checkOrderOwnership'
// BOLA Protection
router.delete('/:id',
  authorize('USER', 'ADMIN'), 
  checkOrderOwnership, 
  orderController.cancelOrder
);

module.exports = router;