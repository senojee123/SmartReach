import express from 'express';
import { logScan, logPoll } from '../controllers/engagementController.js';

const router = express.Router();

router.post('/scan', logScan);
router.post('/poll', logPoll);

export default router;
