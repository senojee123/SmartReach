import express from 'express';
import {
  getCampaigns,
  getCampaignById,
  createCampaign,
  updateCampaign,
  deleteCampaign
} from '../controllers/campaignController.js';
import {
  assignCampaignBoards,
  getCampaignTargets
} from '../controllers/targetingController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect); // Protect all routes under this namespace

router.route('/')
  .get(getCampaigns)
  .post(createCampaign);

router.route('/:id')
  .get(getCampaignById)
  .put(updateCampaign)
  .delete(deleteCampaign);

// Targeting assignments
router.post('/:id/assign-boards', assignCampaignBoards);
router.get('/:id/targets', getCampaignTargets);

export default router;
