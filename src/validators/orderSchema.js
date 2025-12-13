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
  }),
  tableNumber: Joi.string().allow('', null).optional(),
  orderType: Joi.string().valid('DINE_IN', 'TAKE_AWAY').default('DINE_IN')
});

module.exports = { createOrderSchema };