require('dotenv').config({ path: '../.env' });

const { PrismaClient } = require('@prisma/client'); 
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting Database Seeder...');

  // 1. CLEANUP (Hapus data lama)
  console.log('🧹 Cleaning up old data...');
  // Hapus dari anak ke induk (Foreign Key Constraints)
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.menu.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();

  // 2. CREATE USERS
  console.log('👤 Creating Users...');
  const passwordHash = await bcrypt.hash('password123', 10);

  const admin = await prisma.user.create({
    data: {
      name: 'Super Admin',
      email: 'admin@kafe.com',
      password: passwordHash,
      role: 'ADMIN'
    }
  });

  const staff1 = await prisma.user.create({
    data: {
      name: 'Budi Staff',
      email: 'budi@kafe.com',
      password: passwordHash,
      role: 'USER'
    }
  });

  const staff2 = await prisma.user.create({
    data: {
      name: 'Siti Kasir',
      email: 'siti@kafe.com',
      password: passwordHash,
      role: 'USER'
    }
  });

  // 3. CREATE CATEGORIES
  console.log('📂 Creating Categories...');
  const catMakanan = await prisma.category.create({ data: { name: 'Makanan Berat' } });
  const catMinuman = await prisma.category.create({ data: { name: 'Minuman' } });
  const catSnack = await prisma.category.create({ data: { name: 'Camilan' } });

  // 4. CREATE MENUS
  console.log('🍔 Creating Menus...');
  // Simpan hasil create ke variabel agar bisa diambil ID-nya
  
  await prisma.menu.createMany({
    data: [
      { name: 'Nasi Goreng Spesial', price: 25000, categoryId: catMakanan.id, description: 'Pedas Mantap', isAvailable: true },
      { name: 'Ayam Bakar Madu', price: 30000, categoryId: catMakanan.id, description: 'Manis Gurih', isAvailable: true },
      { name: 'Es Teh Manis', price: 5000, categoryId: catMinuman.id, isAvailable: true },
      { name: 'Kopi Susu Gula Aren', price: 18000, categoryId: catMinuman.id, isAvailable: true },
      { name: 'Kentang Goreng', price: 15000, categoryId: catSnack.id, isAvailable: true },
      { name: 'Pisang Bakar Coklat', price: 12000, categoryId: catSnack.id, isAvailable: true },
    ]
  });

  // Ambil data menu yang baru dibuat
  const allMenus = await prisma.menu.findMany();

  // 5. CREATE DUMMY ORDERS
  console.log('📝 Creating Dummy Orders...');

  // Order 1 (DINE IN - MEJA 5)
  await prisma.order.create({
    data: {
      userId: staff1.id,
      status: 'PAID',
      totalPrice: 55000,
      orderType: 'DINE_IN',     // <--- FITUR BARU
      tableNumber: '5',       
      orderItems: {
        create: [
          { menuId: allMenus[0].id, quantity: 1, price: allMenus[0].price }, 
          { menuId: allMenus[1].id, quantity: 1, price: allMenus[1].price }
        ]
      }
    }
  });

  // Order 2 (TAKE AWAY)
  await prisma.order.create({
    data: {
      userId: staff2.id,
      status: 'PENDING',
      totalPrice: 10000,
      orderType: 'TAKE_AWAY', 
      tableNumber: '-',         
      orderItems: {
        create: [
          { menuId: allMenus[2].id, quantity: 2, price: allMenus[2].price }
        ]
      }
    }
  });

  console.log('🚀 Seeding Completed Successfully!');
}

main()
  .catch(e => {
    console.error('❌ Seeding Failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });