import express from 'express';
import { createRoom, getRoom, joinRoom, saveCode, closeRoom } from '../controllers/roomController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.post('/create', createRoom);
router.post('/join', joinRoom);
router.get('/:roomId', getRoom);
router.put('/:roomId/code', saveCode);
router.delete('/:roomId', closeRoom);

export default router;
