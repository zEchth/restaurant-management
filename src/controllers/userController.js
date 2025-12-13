const prisma = require('../config/db');
const bcrypt = require('bcrypt');
const { successResponse, errorResponse } = require('../utils/responseHelper');

// 1. GET ALL USERS (Admin Only)
exports.getAllUsers = async (req, res, next) => {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, name: true, email: true, role: true, createdAt: true } // Jangan tampilkan password!
    });
    return successResponse(res, 200, 'Data karyawan berhasil diambil', users);
  } catch (err) {
    next(err);
  }
};

// 2. CREATE USER (Admin Only - Beda dengan Register Public)
exports.createUser = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;
    
    // Validasi manual sederhana
    if (!email || !password || !name) {
        return errorResponse(res, 400, 'Semua field wajib diisi');
    }

    // Cek duplikat
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return errorResponse(res, 400, 'Email sudah digunakan');

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: role || 'USER'
      }
    });

    return successResponse(res, 201, 'Karyawan berhasil ditambahkan', {
        id: newUser.id, name: newUser.name, email: newUser.email
    });
  } catch (err) {
    next(err);
  }
};

// 3. DELETE USER (Admin Only)
exports.deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Gaboleh hapus diri sendiri!
    if (parseInt(id) === req.user.id) {
        return errorResponse(res, 400, 'Anda tidak bisa menghapus akun sendiri saat sedang login');
    }

    await prisma.user.delete({ where: { id: parseInt(id) } });
    return successResponse(res, 200, 'Karyawan berhasil dihapus');
  } catch (err) {
    // Handle error foreign key (misal user ini punya riwayat order)
    if (err.code === 'P2003') {
        return errorResponse(res, 400, 'User tidak bisa dihapus karena memiliki riwayat transaksi. Nonaktifkan saja (Fitur next).');
    }
    next(err);
  }
};