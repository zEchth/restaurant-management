// src/validators/menuSchema.js
const Joi = require('joi');

// Schema untuk Create Menu Baru
const createMenuSchema = Joi.object({
  name: Joi.string().min(3).required(),
  description: Joi.string().allow('', null).optional(),
  price: Joi.number().min(0).required(),
  categoryId: Joi.number().integer().required(), // Wajib connect ke Kategori
  isAvailable: Joi.boolean().optional().default(true)
});

// Schema untuk Update (Semua field optional)
const updateMenuSchema = Joi.object({
  name: Joi.string().min(3).optional(),
  description: Joi.string().allow('', null).optional(),
  price: Joi.number().min(0).optional(),
  categoryId: Joi.number().integer().optional(),
  isAvailable: Joi.boolean().optional()
});

module.exports = { createMenuSchema, updateMenuSchema };

// memastikan Admin tidak menginput harga negatif atau data kosong.