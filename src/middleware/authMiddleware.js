const jwt = require('jsonwebtoken');
const prisma = require('../config/db');

// A. Middleware Autentikasi (Sudah ada, diperjelas error handlingnya)
exports.authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Unauthorized: Token tidak ditemukan' });
    }

    const token = authHeader.split(' ')[1];
    
    // Verifikasi Token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Cek User di DB (Penting jika user dihapus/banned saat token masih hidup)
    const user = await prisma.user.findUnique({ where: { id: decoded.id } });
    
    if (!user) {
      return res.status(401).json({ message: 'Unauthorized: User tidak ditemukan' });
    }

    // Attach user ke request
    req.user = {
      id: user.id,
      role: user.role,
      email: user.email
    };

    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Unauthorized: Token kadaluarsa' });
    }
    return res.status(401).json({ message: 'Unauthorized: Token invalid' });
  }
};

// B. Middleware Otorisasi (RBAC)
// Usage: authorize('ADMIN') atau authorize('USER', 'ADMIN')
exports.authorize = (...roles) => {
  return (req, res, next) => {
    // 1. Pastikan user sudah terautentikasi sebelumnya
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized: Login diperlukan' });
    }

    // 2. Cek Role
    // Jika role user tidak ada dalam daftar yang diizinkan
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: 'Forbidden: Anda tidak memiliki akses untuk resource ini' 
      });
    }

    next();
  };
};