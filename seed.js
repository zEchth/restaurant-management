// seed.js
const { PrismaClient } = require('./generated/prisma');
const bcrypt = require('bcrypt'); // Kita butuh ini untuk enkripsi

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Mulai seeding (Fix Password)...');

  // 1. Hash Password dulu supaya bisa dibaca oleh Controller Login
  const hashedPassword = await bcrypt.hash('password123', 10);

  // 2. Upsert User (Update password jika user sudah ada)
  const user = await prisma.user.upsert({
    where: { email: 'kasir@kafe.com' },
    // BAGIAN PENTING: Jika user sudah ada, TIMPA password lamanya dengan yang baru (hashed)
    update: { 
      password: hashedPassword 
    },
    create: {
      name: 'Budi Kasir',
      email: 'kasir@kafe.com',
      password: hashedPassword, // Simpan versi terenkripsi
      role: 'USER',
    },
  });
  console.log(`✅ User updated/created: ${user.name}`);

  // 3. Data Kategori & Menu (Tetap sama)
  const category = await prisma.category.upsert({
    where: { name: 'Makanan Berat' },
    update: {},
    create: { name: 'Makanan Berat' },
  });

  await prisma.menu.create({
    data: {
      name: 'Nasi Goreng Spesial',
      price: 25000,
      description: 'Pedas level 3',
      categoryId: category.id,
    },
  });
  
  console.log('🚀 Seeding selesai! Password user sekarang valid.');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });