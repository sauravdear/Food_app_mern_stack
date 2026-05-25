import express from 'express';
import {
  getStores,
  getStoreById,
  createStore,
  updateStore,
  getStorePerformance,
} from '../controllers/storeController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';
import { storeValidation } from '../utils/validators.js';

const router = express.Router();

router.use(protect);

router.get('/', getStores);
router.get('/:id', getStoreById);
router.get('/:id/performance', getStorePerformance);
router.post('/', authorize('admin', 'regional_manager'), storeValidation, createStore);
router.put('/:id', authorize('admin', 'regional_manager'), updateStore);

export default router;
