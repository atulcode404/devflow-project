import express from 'express';
import { sendMessage, getConversation } from '../controllers/messageController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.post('/', protect, sendMessage);
router.get('/:userId', protect, getConversation);

export default router;
