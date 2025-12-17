// src/controllers/menuController.js
const prisma = require('../config/db');
const { successResponse, errorResponse } = require('../utils/responseHelper');
const { createMenuSchema, updateMenuSchema } = require('../validators/menuSchema');

// Lengkap dengan fitur Pagination & Search agar memenuhi syarat "Fitur Wajib List Endpoint"

// 1. GET ALL MENUS (Public/User/Admin)
// Mendukung Pagination & Search Name
exports.getAllMenus = async (req, res, next) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      search, 
      category, // Filter by Category ID
      isAvailable 
    } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Build Filter
    const whereClause = {};
    if (search) whereClause.name = { contains: search }; // Case-insensitive di SQLite
    if (category) whereClause.categoryId = parseInt(category);
    if (isAvailable) whereClause.isAvailable = (isAvailable === 'true');

    // Execute Query
    const [totalRecords, menus] = await Promise.all([
      prisma.menu.count({ where: whereClause }),
      prisma.menu.findMany({
        where: whereClause,
        skip: skip,
        take: limitNum,
        orderBy: { name: 'asc' },
        include: {
          category: { select: { name: true } }
        }
      })
    ]);

    const paginationInfo = {
      totalRecords,
      totalPages: Math.ceil(totalRecords / limitNum),
      currentPage: pageNum,
      limit: limitNum
    };

    return successResponse(res, 200, 'Data menu berhasil diambil', menus, paginationInfo);
  } catch (err) {
    next(err);
  }
};

// 2. GET MENU BY ID
exports.getMenuById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const menu = await prisma.menu.findUnique({
      where: { id: parseInt(id) },
      include: { category: true }
    });

    if (!menu) return errorResponse(res, 404, 'Menu tidak ditemukan');

    return successResponse(res, 200, 'Detail menu berhasil diambil', menu);
  } catch (err) {
    next(err);
  }
};

// 3. CREATE MENU (Admin Only)
exports.createMenu = async (req, res, next) => {
  try {
    // Validasi Input
    const { error, value } = createMenuSchema.validate(req.body);
    if (error) return errorResponse(res, 400, error.details[0].message);

    // Cek apakah Category ID valid
    const categoryExists = await prisma.category.findUnique({
      where: { id: value.categoryId }
    });
    if (!categoryExists) return errorResponse(res, 404, 'Category ID tidak ditemukan');

    const newMenu = await prisma.menu.create({
      data: value
    });

    return successResponse(res, 201, 'Menu berhasil dibuat', newMenu);
  } catch (err) {
    next(err);
  }
};

// 4. UPDATE MENU (Admin Only)
exports.updateMenu = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Validasi Input
    const { error, value } = updateMenuSchema.validate(req.body);
    if (error) return errorResponse(res, 400, error.details[0].message);

    // Cek eksistensi menu
    const menuExists = await prisma.menu.findUnique({ where: { id: parseInt(id) } });
    if (!menuExists) return errorResponse(res, 404, 'Menu tidak ditemukan');

    const updatedMenu = await prisma.menu.update({
      where: { id: parseInt(id) },
      data: value
    });

    return successResponse(res, 200, 'Menu berhasil diupdate', updatedMenu);
  } catch (err) {
    next(err);
  }
};

// 5. DELETE MENU (Admin Only)
exports.deleteMenu = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Cek eksistensi
    const menuExists = await prisma.menu.findUnique({ where: { id: parseInt(id) } });
    if (!menuExists) return errorResponse(res, 404, 'Menu tidak ditemukan');

    // Hapus
    await prisma.menu.delete({
      where: { id: parseInt(id) }
    });

    return successResponse(res, 200, 'Menu berhasil dihapus');
  } catch (err) {
    // Handle error jika menu sudah pernah dipesan (Foreign Key Constraint)
    if (err.code === 'P2003') {
        return errorResponse(res, 400, 'Menu tidak bisa dihapus karena sudah ada riwayat pesanan.');
    }
    next(err);
  }
};