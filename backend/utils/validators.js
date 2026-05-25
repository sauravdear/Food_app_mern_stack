import { body, param, query } from 'express-validator';

export const registerValidation = [
  body('fullName').trim().notEmpty().withMessage('Full name is required').isLength({ max: 100 }),
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain uppercase, lowercase, and number'),
  body('role')
    .isIn(['admin', 'regional_manager', 'store_manager', 'staff'])
    .withMessage('Invalid role'),
];

export const loginValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('password').notEmpty().withMessage('Password is required'),
];

export const foodItemValidation = [
  body('name').trim().notEmpty().withMessage('Food item name is required'),
  body('SKU').trim().notEmpty().withMessage('SKU is required'),
  body('category')
    .isIn(['Dairy', 'Meat', 'Produce', 'Bakery', 'Seafood', 'Prepared'])
    .withMessage('Invalid category'),
  body('batchNumber').trim().notEmpty().withMessage('Batch number is required'),
  body('expirationDate').isISO8601().withMessage('Valid expiration date required'),
  body('basePrice').isFloat({ min: 0 }).withMessage('Price must be non-negative'),
  body('unitType').isIn(['kg', 'pieces', 'liters', 'packets']).withMessage('Invalid unit type'),
];

export const storeValidation = [
  body('storeName').trim().notEmpty().withMessage('Store name is required'),
  body('storeCode').trim().notEmpty().withMessage('Store code is required'),
  body('location.city').trim().notEmpty().withMessage('City is required'),
  body('location.state').trim().notEmpty().withMessage('State is required'),
];

export const transferValidation = [
  body('foodItemId').isMongoId().withMessage('Valid food item ID required'),
  body('sourceStoreId').isMongoId().withMessage('Valid source store ID required'),
  body('destinationStoreId').isMongoId().withMessage('Valid destination store ID required'),
  body('quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
];

export const mongoIdParam = (paramName = 'id') => [
  param(paramName).isMongoId().withMessage('Invalid ID format'),
];
