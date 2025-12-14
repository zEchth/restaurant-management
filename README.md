# Restaurant Management System (POS & Admin)

Sistem aplikasi Point of Sales (POS) Fullstack untuk manajemen restoran. Aplikasi ini mencakup fitur Back-office (Admin) untuk manajemen stok/karyawan dan Front-office (Kasir) untuk transaksi Dine-in/Take-away.

## 🛠 Tech Stack

### Backend
- **Runtime:** Node.js v18+
- **Framework:** Express.js
- **Database:** SQLite (Dev) / PostgreSQL (Prod)
- **ORM:** Prisma v6
- **Auth:** JWT (Access & Refresh) + Bcrypt

### Frontend
- **Framework:** React + Vite
- **UI:** Tailwind CSS + Lucide Icons
- **State:** Context API
- **Charts:** Recharts

## ✨ Fitur Unggulan
1. **Multi-Role:** Admin (Superuser) & User (Kasir).
2. **POS Modern:** Input pesanan dengan gambar, dukungan **Nomor Meja** & **Take Away**.
3. **Manajemen Produk:** CRUD Menu & Kategori yang dinamis.
4. **Manajemen Karyawan:** Admin dapat merekrut/menghapus kasir.
5. **Real-time Dashboard:** Grafik omset harian & statistik pesanan.
6. **Cetak Struk:** Modal detail pesanan siap cetak (Thermal Printer friendly).
7. **Security:** Proteksi BOLA, Hashing Password, & Secure Headers.

## 🚀 Cara Instalasi & Menjalankan

### 1. Setup Backend & Database
```bash
# Masuk ke folder backend
cd restaurant-management
npm install

# Setup Environment
cp .env.example .env

# Setup Database & Seeding (PENTING!)
npx prisma generate
npx prisma db push
node prisma/seed.js 

# Jika server mati
npx prisma db push
node prisma/seed.js

```

### 2. Setup Frontend
```bash
# Masuk ke folder frontend
cd ../restaurant-frontend
npm install
npm run build

# Frontend disajikan melalui NGINX sebagai static files.
# Backend berjalan sebagai REST API dan diakses melalui reverse proxy.

#Akses aplikasi: http://<IP-SERVER>

```

### 3. Menjalankan Aplikasi (Production)

Backend dijalankan menggunakan PM2 dan frontend diserve oleh NGINX
```bash
pm2 start src/server.js --name resto-app
pm2 save
```

## 👥 Akun Demo (Seeder)
``` bash
Password default: password123

Role,    Email,            Deskripsi
ADMIN,   admin@kafe.com,   "Akses penuh (Menu, User, Laporan)"
USER,    budi@kafe.com,    "Kasir (POS, Order History)"
```

