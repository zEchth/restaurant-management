const prisma = require('../config/db');
const { createOrderSchema } = require('../validators/orderSchema');

// Create New Order
exports.createOrder = async (req, res, next) => {
  try {
    // 1. Validasi Input (Joi)
    const { error, value } = createOrderSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ 
        status: 'fail', 
        message: error.details[0].message 
      });
    }

    const { items } = value; // items = [{ menuId: 1, quantity: 2 }, ...]

    // 2. Ambil Data Menu dari Database (Untuk mendapatkan harga ASLI)
    // Jangan pernah percaya harga yang dikirim dari frontend
    const menuIds = items.map(item => item.menuId);
    const dbMenus = await prisma.menu.findMany({
      where: {
        id: { in: menuIds },
        isAvailable: true // Hanya ambil menu yang tersedia
      }
    });

    // Cek jika ada menu yang tidak ditemukan / habis
    if (dbMenus.length !== menuIds.length) {
      return res.status(404).json({
        status: 'fail',
        message: 'Beberapa menu tidak ditemukan atau stok habis'
      });
    }

    // 3. Hitung Total Price & Siapkan Data OrderItem
    let totalPrice = 0;
    const orderItemsData = items.map(item => {
      const menuInfo = dbMenus.find(m => m.id === item.menuId);
      const subtotal = Number(menuInfo.price) * item.quantity;
      
      totalPrice += subtotal;

      return {
        menuId: item.menuId,
        quantity: item.quantity,
        price: menuInfo.price // Simpan harga snapshot saat transaksi
      };
    });

    // 4. Eksekusi Database Transaction (Atomic Operation)
    // Order dan OrderItems dibuat bersamaan. Jika satu gagal, semua batal.
    const newOrder = await prisma.$transaction(async (tx) => {
      return await tx.order.create({
        data: {
          userId: req.user.id, // ID Kasir dari token JWT
          totalPrice: totalPrice,
          status: 'PENDING',
          orderItems: {
            create: orderItemsData // Nested write (Prisma feature)
          }
        },
        include: {
          orderItems: {
            include: { menu: true } // Return detail menu di response
          }
        }
      });
    });

    // 5. Response Sukses
    res.status(201).json({
      status: 'success',
      data: {
        orderId: newOrder.id,
        totalPrice: newOrder.totalPrice,
        status: newOrder.status,
        items: newOrder.orderItems.map(item => ({
          name: item.menu.name,
          qty: item.quantity,
          price: item.price
        })),
        cashier: req.user.name
      }
    });

  } catch (err) {
    next(err); // Lempar ke Error Handling Middleware
  }
};

// Get All Orders (Untuk Dapur/Laporan)
exports.getOrders = async (req, res, next) => {
  try {
    const orders = await prisma.order.findMany({
      include: {
        user: { select: { name: true } }, // Ambil nama kasir saja
        orderItems: {
          include: { menu: { select: { name: true } } }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.status(200).json({
      status: 'success',
      data: orders
    });
  } catch (err) {
    next(err);
  }
};

// Batalkan Order (Soft Delete atau Update Status)
exports.cancelOrder = async (req, res, next) => {
  try {
    const orderId = parseInt(req.params.id);

    // Kita update status jadi CANCELLED (Best Practice daripada hapus data permanen)
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: { status: 'CANCELLED' }
    });

    res.status(200).json({
      status: 'success',
      message: 'Order berhasil dibatalkan',
      data: updatedOrder
    });
  } catch (err) {
    next(err);
  }
};