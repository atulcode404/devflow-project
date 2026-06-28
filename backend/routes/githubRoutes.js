import express from 'express';
import { syncGithubProfile } from '../controllers/githubController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.post('/sync', protect, syncGithubProfile);

export default router;
