import express from 'express';
import {
  getBoards,
  getBoardById,
  createBoard,
  updateBoard,
  deleteBoard,
  activateBoard
} from '../controllers/boardController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect); // Protect all routes in this router

router.route('/')
  .get(getBoards)
  .post(createBoard);

router.route('/:id')
  .get(getBoardById)
  .put(updateBoard)
  .delete(deleteBoard);

router.post('/:id/activate', activateBoard);

export default router;
