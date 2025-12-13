const prisma = require('../config/db');
const { successResponse, errorResponse } = require('../utils/responseHelper');

// 1. GET ALL CATEGORIES
exports.getAllCategories = async (req, res, next) => {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { name: 'asc' },
      include: { _count: { select: { menus: true } } } // Hitung jumlah menu di dlmnya
    });
    return successResponse(res, 200, 'Data kategori berhasil diambil', categories);
  } catch (err) {
    next(err);
  }
};

// 2. CREATE CATEGORY
exports.createCategory = async (req, res, next) => {
  try {
    const { name } = req.body;
    if (!name) return errorResponse(res, 400, 'Nama kategori wajib diisi');

    const newCategory = await prisma.category.create({
      data: { name }
    });
    return successResponse(res, 201, 'Kategori berhasil dibuat', newCategory);
  } catch (err) {
    next(err);
  }
};

// 3. DELETE CATEGORY
exports.deleteCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Cek apakah kategori dipakai oleh menu?
    const category = await prisma.category.findUnique({
      where: { id: parseInt(id) },
      include: { _count: { select: { menus: true } } }
    });

    if (!category) return errorResponse(res, 404, 'Kategori tidak ditemukan');
    
    if (category._count.menus > 0) {
      return errorResponse(res, 400, `Gagal hapus: Kategori ini memiliki ${category._count.menus} menu. Hapus/pindahkan menu terlebih dahulu.`);
    }

    await prisma.category.delete({ where: { id: parseInt(id) } });
    return successResponse(res, 200, 'Kategori berhasil dihapus');
  } catch (err) {
    next(err);
  }
};