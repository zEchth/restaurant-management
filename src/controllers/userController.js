const prisma = require('../config/db');
const bcrypt = require('bcrypt');
const { successResponse, errorResponse } = require('../utils/responseHelper');

// 1. GET ALL USERS (Admin Only)
exports.getAllUsers = async (req, res, next) => {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, name: true, email: true, role: true, createdAt: true }
    });
    return successResponse(res, 200, 'Data karyawan berhasil diambil', users);
  } catch (err) {
    next(err);
  }
};

// 2. CREATE USER (Admin Only)
exports.createUser = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;

    if (!email || !password || !name) {
      return errorResponse(res, 400, 'Semua field wajib diisi');
    }

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

// 3. UPDATE USER (Fitur Baru: Edit Profil & Karyawan)
exports.updateUser = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const { name, email, password, role } = req.body;

    // A. Cek Otorisasi (Hanya Admin atau Diri Sendiri)
    if (req.user.role !== 'ADMIN' && req.user.id !== id) {
      return errorResponse(res, 403, 'Anda tidak diizinkan mengedit profil orang lain');
    }

    // Cegah user (termasuk Admin) mengubah role milik sendiri
    if (parseInt(id) === req.user.id && role && role !== req.user.role) {
      return errorResponse(res, 400, 'Demi keamanan, Anda tidak diizinkan mengubah Role akun sendiri.');
    }

    // B. Cek Role (User biasa gaboleh ganti role sendiri)
    if (req.user.role !== 'ADMIN' && role && role !== req.user.role) {
      return errorResponse(res, 403, 'Anda tidak bisa mengubah role sendiri');
    }

    // C. Cek Email Unik
    if (email) {
      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser && existingUser.id !== id) {
        return errorResponse(res, 400, 'Email sudah digunakan oleh user lain');
      }
    }

    // D. Siapkan Data
    const updateData = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;

    if (role && req.user.role === 'ADMIN') {
      updateData.role = role;
    }

    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    // E. Eksekusi
    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
      select: { id: true, name: true, email: true, role: true }
    });

    return successResponse(res, 200, 'Profil berhasil diperbarui', updatedUser);

  } catch (err) {
    next(err);
  }
};

// 4. DELETE USER (Admin Only)
exports.deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (parseInt(id) === req.user.id) {
      return errorResponse(res, 400, 'Anda tidak bisa menghapus akun sendiri saat sedang login');
    }

    await prisma.user.delete({ where: { id: parseInt(id) } });
    return successResponse(res, 200, 'Karyawan berhasil dihapus');
  } catch (err) {
    if (err.code === 'P2003') {
      return errorResponse(res, 400, 'User tidak bisa dihapus karena memiliki riwayat transaksi.');
    }
    next(err);
  }
};