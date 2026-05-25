import express from 'express';
import {
  getInventoryOverview,
  getTransferRecommendations,
  getExpiringItems,
  getStoreInventory,
  createFoodItem,
  updateStock,
  updateVelocity,
  batchUploadInventory,
  getAllFoodItems,
  updateFoodItem,
  deleteFoodItem,
} from '../controllers/inventoryController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';
import { foodItemValidation, mongoIdParam } from '../utils/validators.js';

const router = express.Router();

router.use(protect);

router.get('/overview', getInventoryOverview);
router.get('/recommendations', getTransferRecommendations);
router.get('/expiring', getExpiringItems);
router.get('/items', getAllFoodItems);
router.get('/store/:storeId', getStoreInventory);

router.post('/items', authorize('admin', 'regional_manager', 'store_manager'), foodItemValidation, createFoodItem);
router.put('/items/:id', authorize('admin', 'regional_manager', 'store_manager'), updateFoodItem);
router.delete('/items/:id', authorize('admin', 'regional_manager'), deleteFoodItem);
router.post('/update-stock', authorize('admin', 'regional_manager', 'store_manager', 'staff'), updateStock);
router.put('/velocity/:id', authorize('admin', 'regional_manager', 'store_manager'), updateVelocity);
router.post('/batch-upload', authorize('admin', 'regional_manager', 'store_manager'), batchUploadInventory);

export default router;
