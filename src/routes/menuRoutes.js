// src/routes/menuRoutes.js
const express = require('express');
const router = express.Router();
const menuController = require('../controllers/menuController');
const { authenticate, authorize } = require('../middleware/authMiddleware');

// 1. Route PUBLIC / USER (Hanya Read)
router.get('/', authenticate, menuController.getAllMenus);
router.get('/:id', authenticate, menuController.getMenuById);

// 2. Route ADMIN (Write Access)
// Semua operasi perubahan data WAJIB role ADMIN
router.post('/', authenticate, authorize('ADMIN'), menuController.createMenu);
router.patch('/:id', authenticate, authorize('ADMIN'), menuController.updateMenu);
router.delete('/:id', authenticate, authorize('ADMIN'), menuController.deleteMenu);

module.exports = router;