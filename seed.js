// seed.js
require('dotenv').config();
const { PrismaClient } = require('./generated/prisma');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting Database Seeder...');

  // 1. CLEANUP (Hapus data lama agar bersih/idempotent)
  // Urutan menghapus PENTING: Anak dulu, baru Orang Tua (Foreign Key Constraint)
  console.log('🧹 Cleaning up old data...');
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
  const menus = await prisma.menu.createMany({
    data: [
      { name: 'Nasi Goreng Spesial', price: 25000, categoryId: catMakanan.id, description: 'Pedas Mantap' },
      { name: 'Ayam Bakar Madu', price: 30000, categoryId: catMakanan.id, description: 'Manis Gurih' },
      { name: 'Es Teh Manis', price: 5000, categoryId: catMinuman.id },
      { name: 'Kopi Susu Gula Aren', price: 18000, categoryId: catMinuman.id },
      { name: 'Kentang Goreng', price: 15000, categoryId: catSnack.id },
      { name: 'Pisang Bakar Coklat', price: 12000, categoryId: catSnack.id },
    ]
  });

  // 5. CREATE DUMMY ORDERS (Opsional: Agar list tidak kosong saat demo)
  console.log('📝 Creating Dummy Orders...');
  
  // Kita perlu ID menu yang baru dibuat
  const allMenus = await prisma.menu.findMany();
  
  // Order 1 oleh Budi
  await prisma.order.create({
    data: {
      userId: staff1.id,
      status: 'PAID',
      totalPrice: 55000,
      orderItems: {
        create: [
          { menuId: allMenus[0].id, quantity: 1, price: allMenus[0].price }, // Nasgor
          { menuId: allMenus[1].id, quantity: 1, price: allMenus[1].price }  // Ayam
        ]
      }
    }
  });

  // Order 2 oleh Siti
  await prisma.order.create({
    data: {
      userId: staff2.id,
      status: 'PENDING',
      totalPrice: 10000,
      orderItems: {
        create: [
          { menuId: allMenus[2].id, quantity: 2, price: allMenus[2].price } // 2 Es Teh
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