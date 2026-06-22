import express from 'express';
import multer from 'multer';
import {
  getAssets,
  getAssetById,
  uploadAsset,
  deleteAsset
} from '../controllers/assetController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();
const storage = multer.memoryStorage();
const upload = multer({ storage });

router.use(protect); // Protect all media library routes

router.route('/')
  .get(getAssets);

router.post('/upload', upload.single('file'), uploadAsset);

router.route('/:id')
  .get(getAssetById)
  .delete(deleteAsset);

export default router;
