import express from 'express';
import { getFeed, getFeedStats } from '../controllers/feedController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.get('/stats', protect, getFeedStats);
router.get('/', protect, getFeed);

export default router;
