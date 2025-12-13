const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const prisma = require('../config/db');
const { generateTokens } = require('../utils/jwtHelper');
const { registerSchema, loginSchema } = require('../validators/authSchema');

// 1. POST /register
exports.register = async (req, res, next) => {
  try {
    const { error, value } = registerSchema.validate(req.body);
    if (error) return res.status(400).json({ message: error.details[0].message });

    // Cek email duplikat
    const existingUser = await prisma.user.findUnique({ where: { email: value.email } });
    if (existingUser) return res.status(400).json({ message: 'Email sudah digunakan' });

    // Hash Password (Salt Round 10)
    const hashedPassword = await bcrypt.hash(value.password, 10);

    const user = await prisma.user.create({
      data: {
        name: value.name,
        email: value.email,
        password: hashedPassword,
        role: value.role || 'USER' // Default role
      }
    });

    res.status(201).json({
      message: 'Registrasi berhasil',
      userId: user.id
    });
  } catch (err) {
    next(err);
  }
};

// 2. POST /login
exports.login = async (req, res, next) => {
  try {
    const { error, value } = loginSchema.validate(req.body);
    if (error) return res.status(400).json({ message: error.details[0].message });

    // Cari User
    const user = await prisma.user.findUnique({ where: { email: value.email } });
    if (!user) return res.status(401).json({ message: 'Email atau password salah' });

    // Verifikasi Password
    const isMatch = await bcrypt.compare(value.password, user.password);
    if (!isMatch) return res.status(401).json({ message: 'Email atau password salah' });

    // Generate Token
    const tokens = generateTokens(user);

    res.json({
      message: 'Login berhasil',
      ...tokens
    });
  } catch (err) {
    next(err);
  }
};

// 3. POST /refresh
exports.refreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(400).json({ message: 'Refresh token wajib dikirim' });

    // Verifikasi Refresh Token
    // Gunakan try-catch khusus untuk JWT verify agar error handling spesifik
    let decoded;
    try {
      decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    } catch (err) {
      return res.status(403).json({ message: 'Refresh token tidak valid atau kadaluarsa' });
    }

    // Cek user di DB (Security check)
    const user = await prisma.user.findUnique({ where: { id: decoded.id } });
    if (!user) return res.status(403).json({ message: 'User tidak ditemukan' });

    // Generate Access Token BARU saja (Refresh token biasanya tetap, atau di-rotate tergantung kebijakan)
    // Di sini kita buat Access Token baru saja sesuai standar umum.
    const newAccessToken = jwt.sign(
      { id: user.id, role: user.role }, 
      process.env.JWT_SECRET, 
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    res.json({ accessToken: newAccessToken });
  } catch (err) {
    next(err);
  }
};

// 4. GET /me
exports.getMe = async (req, res, next) => {
  try {
    // req.user didapat dari middleware 'authenticate'
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true
      } // Exclude password!
    });

    res.json({ user });
  } catch (err) {
    next(err);
  }
};