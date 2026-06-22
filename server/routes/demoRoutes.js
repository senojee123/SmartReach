import express from 'express';
import {
  getPlaylist,
  sendHeartbeat,
  logPlayback,
  triggerFloodWarning,
  cancelFloodWarning,
  getDemoStats,
  getAllBoards
} from '../controllers/demoController.js';

const router = express.Router();

router.get('/playlist/:boardId', getPlaylist);
router.post('/heartbeat/:boardId', sendHeartbeat);
router.post('/log/:boardId', logPlayback);
router.post('/trigger', triggerFloodWarning);
router.post('/cancel', cancelFloodWarning);
router.get('/stats', getDemoStats);
router.get('/boards', getAllBoards);

export default router;
