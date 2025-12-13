const prisma = require('../config/db');
const { successResponse, errorResponse } = require('../utils/responseHelper');
const { createOrderSchema } = require('../validators/orderSchema');

// 1. CREATE ORDER
exports.createOrder = async (req, res, next) => {
  try {
    // Validasi Input
    const { error, value } = createOrderSchema.validate(req.body);
    if (error) {
      return errorResponse(res, 400, error.details[0].message);
    }

    const { items, tableNumber, orderType } = req.body;

    // Cek Menu di DB
    const menuIds = items.map(item => item.menuId);
    const dbMenus = await prisma.menu.findMany({
      where: {
        id: { in: menuIds },
        isAvailable: true
      }
    });

    if (dbMenus.length !== menuIds.length) {
      return errorResponse(res, 404, 'Beberapa menu tidak ditemukan atau stok habis');
    }

    // Hitung Total & Siapkan Data Item
    let totalPrice = 0;
    const orderItemsData = items.map(item => {
      const menuInfo = dbMenus.find(m => m.id === item.menuId);
      const subtotal = Number(menuInfo.price) * item.quantity;
      totalPrice += subtotal;

      return {
        menuId: item.menuId,
        quantity: item.quantity,
        price: menuInfo.price
      };
    });

    // Transaksi Database
    const newOrder = await prisma.$transaction(async (tx) => {
      return await tx.order.create({
        data: {
          userId: req.user.id,
          totalPrice: totalPrice,
          status: 'PENDING',
          tableNumber: tableNumber || '-', // Default strip jika kosong
          orderType: orderType || 'DINE_IN',
          orderItems: {
            create: orderItemsData
          }
        },
        include: {
          orderItems: {
            include: { menu: true }
          }
        }
      });
    });

    // Gunakan helper successResponse
    return successResponse(res, 201, 'Order berhasil dibuat', {
      orderId: newOrder.id,
      totalPrice: newOrder.totalPrice,
      status: newOrder.status,
      items: newOrder.orderItems.map(item => ({
        name: item.menu.name,
        qty: item.quantity,
        price: item.price
      })),
      cashier: req.user.name
    });

  } catch (err) {
    next(err);
  }
};

// 2. GET ALL ORDERS (Advanced: Pagination, Filter, Search)
exports.getOrders = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      order = 'desc',
      status,
      search,
      startDate,
      endDate
    } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Filter Logic
    const whereClause = {};

    // Filter Role (User lihat punya sendiri, Admin lihat semua)
    if (req.user.role !== 'ADMIN') {
      whereClause.userId = req.user.id;
    }

    // Filter Status
    if (status) whereClause.status = status;

    // Search Nama Kasir
    if (search) {
      whereClause.user = {
        name: { contains: search } // SQLite default case-insensitive
      };
    }

    // Filter Tanggal
    if (startDate || endDate) {
      whereClause.createdAt = {};
      if (startDate) whereClause.createdAt.gte = new Date(startDate);
      if (endDate) whereClause.createdAt.lte = new Date(endDate);
    }

    // Query Database
    const [totalRecords, orders] = await Promise.all([
      prisma.order.count({ where: whereClause }),
      prisma.order.findMany({
        where: whereClause,
        skip: skip,
        take: limitNum,
        orderBy: { [sortBy]: order },
        include: {
          user: { select: { name: true } },
          orderItems: { include: { menu: { select: { name: true } } } }
        }
      })
    ]);

    const paginationInfo = {
      totalRecords,
      totalPages: Math.ceil(totalRecords / limitNum),
      currentPage: pageNum,
      limit: limitNum
    };

    return successResponse(res, 200, 'List pesanan berhasil diambil', orders, paginationInfo);

  } catch (err) {
    next(err);
  }
};

// 3. GET SINGLE ORDER (Detail)
exports.getOrderById = async (req, res, next) => {
  try {
    const orderId = parseInt(req.params.id);
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: { select: { name: true, email: true } },
        orderItems: { include: { menu: true } }
      }
    });

    if (!order) return errorResponse(res, 404, 'Order tidak ditemukan');

    // Cek kepemilikan (Ownership)
    if (req.user.role !== 'ADMIN' && order.userId !== req.user.id) {
      return errorResponse(res, 403, 'Akses ditolak');
    }

    return successResponse(res, 200, 'Detail order berhasil diambil', order);
  } catch (err) { next(err); }
};

// 4. UPDATE STATUS (PATCH)
exports.updateStatus = async (req, res, next) => {
  try {
    const orderId = parseInt(req.params.id);
    const { status } = req.body;

    const allowedStatuses = ['PAID', 'READY', 'PENDING', 'CANCELLED'];
    if (!allowedStatuses.includes(status)) {
      return errorResponse(res, 400, 'Status tidak valid');
    }

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: { status: status }
    });

    return successResponse(res, 200, `Status berhasil diubah jadi ${status}`, updatedOrder);

  } catch (err) {
    if (err.code === 'P2025') return errorResponse(res, 404, 'Order tidak ditemukan');
    next(err);
  }
};

// 5. CANCEL ORDER (DELETE) - Ini yang tadi hilang!
exports.cancelOrder = async (req, res, next) => {
  try {
    const orderId = parseInt(req.params.id);

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: { status: 'CANCELLED' }
    });

    return successResponse(res, 200, 'Order berhasil dibatalkan', updatedOrder);
  } catch (err) {
    if (err.code === 'P2025') return errorResponse(res, 404, 'Order tidak ditemukan');
    next(err);
  }
};