import express from 'express';
import { getDashboardStats, getPlaybackLogs } from '../controllers/dashboardController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.get('/stats', protect, getDashboardStats);
router.get('/logs', protect, getPlaybackLogs);

export default router;
