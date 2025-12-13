// src/utils/responseHelper.js

// Format Success Response (200, 201)
const successResponse = (res, statusCode, message, data = null, pagination = null) => {
  const response = {
    success: true,
    message: message,
  };

  if (data !== null) response.data = data;
  if (pagination) response.pagination = pagination;

  return res.status(statusCode).json(response);
};

// Format Error Response (400, 401, 404, 500, dll)
const errorResponse = (res, statusCode, message, errors = null) => {
  const response = {
    success: false,
    message: message,
  };

  if (errors) response.errors = errors;

  return res.status(statusCode).json(response);
};

module.exports = { successResponse, errorResponse };