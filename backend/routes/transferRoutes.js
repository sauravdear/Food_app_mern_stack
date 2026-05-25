import express from 'express';
import {
  createTransfer,
  approveTransfer,
  updateTransferStatus,
  getTransfers,
  getTransferById,
  getTransferAnalytics,
} from '../controllers/transferController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';
import { transferValidation } from '../utils/validators.js';

const router = express.Router();

router.use(protect);

router.get('/analytics', getTransferAnalytics);
router.get('/', getTransfers);
router.get('/:id', getTransferById);
router.post('/', transferValidation, createTransfer);
router.put('/:id/approve', authorize('admin', 'regional_manager', 'store_manager'), approveTransfer);
router.put('/:id/status', updateTransferStatus);

export default router;
