const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { authenticate, authorize } = require('../middleware/authMiddleware');
const { checkOrderOwnership } = require('../middleware/ownershipMiddleware');

// 1. Semua route di bawah ini butuh Login (Authentication)
router.use(authenticate);

// 2. Get All Orders & Create Order
// Staff (USER) boleh buat order, Admin boleh
router.get('/', authorize('USER', 'ADMIN'), orderController.getOrders);
router.post('/', authorize('USER', 'ADMIN'), orderController.createOrder);

// 3. Delete/Cancel Order (BOLA Protected)
// - Butuh Login
// - Role minimal USER atau ADMIN
// - CheckOwnership: Hanya pembuat order atau Admin yang bisa hapus
router.delete('/:id', 
  authorize('USER', 'ADMIN'), 
  checkOrderOwnership, // <--- Ini Guardrail BOLA-nya
  orderController.cancelOrder
);

module.exports = router;