const Joi = require('joi');

const registerSchema = Joi.object({
  name: Joi.string().min(3).required(),
  email: Joi.string().email().required(),
  // Password: Min 8 chars, 1 huruf besar, 1 huruf kecil, 1 angka
  password: Joi.string()
    .min(8)
    .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])'))
    .required()
    .messages({
      'string.min': 'Password harus minimal 8 karakter',
      'string.pattern.base': 'Password harus mengandung huruf besar, huruf kecil, dan angka'
    }),
  role: Joi.string().valid('USER', 'ADMIN').optional()
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

module.exports = { registerSchema, loginSchema };