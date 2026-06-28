import express from 'express';
import { getRecommendedProjects } from '../controllers/recommendationController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.get('/projects', protect, getRecommendedProjects);

export default router;
