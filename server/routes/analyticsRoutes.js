import express from 'express';
import {
  getOverviewAnalytics,
  getCampaignAnalytics,
  getSystemHealth,
  exportDataCSV
} from '../controllers/analyticsController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect); // All analytics endpoints require logging in

router.get('/overview', getOverviewAnalytics);
router.get('/campaign/:id', getCampaignAnalytics);
router.get('/health', getSystemHealth);
router.get('/export/:type', exportDataCSV);

export default router;
