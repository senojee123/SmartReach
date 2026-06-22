import express from 'express';
import {
  getContentList,
  createContent,
  updateContent,
  deleteContent
} from '../controllers/contentController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// All content control endpoints require authentication
router.route('/')
  .get(protect, getContentList)
  .post(protect, createContent);

router.route('/:id')
  .put(protect, updateContent)
  .delete(protect, deleteContent);

export default router;
