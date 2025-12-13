const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const { authenticate, authorize } = require('../middleware/authMiddleware');

// Public Read (Agar POS bisa baca)
router.get('/', authenticate, categoryController.getAllCategories);

// Admin Write (Tambah/Hapus Kategori)
router.post('/', authenticate, authorize('ADMIN'), categoryController.createCategory);
router.delete('/:id', authenticate, authorize('ADMIN'), categoryController.deleteCategory);

module.exports = router;