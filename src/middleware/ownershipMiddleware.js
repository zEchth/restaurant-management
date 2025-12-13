const prisma = require('../config/db');

// Middleware Khusus untuk Cek Kepemilikan Order
// Mencegah user A mengedit/cancel order milik user B (Kecuali ADMIN)
exports.checkOrderOwnership = async (req, res, next) => {
  try {
    const orderId = parseInt(req.params.id);
    
    // 1. Validasi ID
    if (isNaN(orderId)) {
      return res.status(400).json({ message: 'Invalid Order ID' });
    }

    // 2. Cari Resource di Database
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { userId: true } // Hanya ambil userId untuk efisiensi
    });

    if (!order) {
      return res.status(404).json({ message: 'Order tidak ditemukan' });
    }

    // 3. Logika Validasi Kepemilikan
    // Admin selalu boleh (Bypass check)
    if (req.user.role === 'ADMIN') {
      return next();
    }

    // Jika bukan Admin, User ID di Order harus sama dengan User ID yang login
    if (order.userId !== req.user.id) {
      return res.status(403).json({ 
        message: 'Forbidden: Anda tidak memiliki akses ke order ini (BOLA Protection)' 
      });
    }

    // Lolos validasi
    next();
    
  } catch (err) {
    next(err);
  }
};