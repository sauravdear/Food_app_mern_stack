import express from 'express';
import {
  getWasteMetrics,
  getVelocityTrends,
  getCategoryAnalysis,
  getStorePerformanceRanking,
  exportReport,
} from '../controllers/analyticsController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';

const router = express.Router();

router.use(protect);

router.get('/waste', getWasteMetrics);
router.get('/velocity-trends', getVelocityTrends);
router.get('/categories', getCategoryAnalysis);
router.get('/store-performance', getStorePerformanceRanking);
router.get('/export', authorize('admin', 'regional_manager'), exportReport);

export default router;
