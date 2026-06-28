import express from 'express';
import { getFeed } from '../controllers/feedController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.get('/', protect, getFeed);

export default router;
