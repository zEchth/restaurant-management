const Joi = require('joi');

const createOrderSchema = Joi.object({
  items: Joi.array().items(
    Joi.object({
      menuId: Joi.number().integer().required(),
      quantity: Joi.number().integer().min(1).required()
    })
  ).min(1).required().messages({
    'array.min': 'Order harus memiliki minimal 1 item',
    'any.required': 'Daftar item wajib diisi'
  })
});

module.exports = { createOrderSchema };