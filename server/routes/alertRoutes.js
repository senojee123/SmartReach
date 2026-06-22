import express from 'express';
import {
  getAlertList,
  createAlert,
  approveAlert,
  deleteAlert,
  getAuditHistory
} from '../controllers/alertController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.route('/audit')
  .get(protect, getAuditHistory);

router.route('/')
  .get(protect, getAlertList)
  .post(protect, createAlert);

router.route('/:id')
  .delete(protect, deleteAlert);

router.route('/:id/approve')
  .post(protect, approveAlert);

export default router;
