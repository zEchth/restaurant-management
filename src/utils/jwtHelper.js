const jwt = require('jsonwebtoken');

const generateTokens = (user) => {
  const payload = {
    id: user.id,
    role: user.role,
    name: user.name,
    email: user.email,
  };

  // Access Token (15 menit)
  const accessToken = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN
  });

  // Refresh Token (7 hari)
  const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN
  });

  return { accessToken, refreshToken };
};

module.exports = { generateTokens };