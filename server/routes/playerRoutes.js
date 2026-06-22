import express from 'express';
import {
  generateActivationCode,
  checkActivation,
  getPlaylist,
  sendHeartbeat,
  logPlayback,
  logPlayerAuditEvent
} from '../controllers/playerController.js';
import { protectDevice } from '../middleware/auth.js';

const router = express.Router();

// Public Activation Endpoints
router.get('/activate-code', generateActivationCode);
router.get('/check-activation', checkActivation);
router.post('/audit', logPlayerAuditEvent);

// Protected Device Endpoints
router.get('/playlist', protectDevice, getPlaylist);
router.post('/heartbeat', protectDevice, sendHeartbeat);
router.post('/log', protectDevice, logPlayback);

export default router;
