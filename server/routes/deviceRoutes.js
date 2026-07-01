import express from 'express';
import {
  registerDevice,
  getDevices,
  getDeviceById,
  heartbeatDevice,
  updateDevice,
  deleteDevice,
  getDeviceConfig
} from '../controllers/deviceController.js';

const router = express.Router();

// Public endpoints for devices
router.post('/register', registerDevice);
router.post('/heartbeat', heartbeatDevice);
router.get('/:deviceId/config', getDeviceConfig);

// Administrative CRUD endpoints
router.get('/', getDevices);
router.get('/:deviceId', getDeviceById);
router.put('/:deviceId', updateDevice);
router.delete('/:deviceId', deleteDevice);

export default router;
