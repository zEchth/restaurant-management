const jwt = require('jsonwebtoken');
const prisma = require('../config/db');

exports.authenticate = async (req, res, next) => {
  try {
    // 1. Ambil token dari Header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Akses ditolak, token tidak ditemukan' });
    }

    const token = authHeader.split(' ')[1];

    // 2. Verifikasi Token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 3. (Opsional tapi Recommended) Cek apakah user masih ada di DB
    // Berguna jika user dihapus tapi token masih valid
    const currentUser = await prisma.user.findUnique({ where: { id: decoded.id } });
    if (!currentUser) {
      return res.status(401).json({ message: 'User pemilik token ini sudah tidak ada' });
    }

    // 4. Attach user ke request object
    req.user = {
      id: currentUser.id,
      role: currentUser.role,
      email: currentUser.email
    };

    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token kadaluarsa, silakan refresh token' });
    }
    return res.status(401).json({ message: 'Token tidak valid' });
  }
};