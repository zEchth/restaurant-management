const { PrismaClient } = require('../../generated/prisma');

// Inisialisasi Client
// Log query berguna saat development untuk melihat RAW SQL yang dieksekusi
const prisma = new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

module.exports = prisma;