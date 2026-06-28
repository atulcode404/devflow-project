import express from 'express';
import { 
  searchDevelopers, searchPosts, getSearchHistory, getSearchAnalytics 
} from '../controllers/searchController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.get('/developers', protect, searchDevelopers);
router.get('/posts', protect, searchPosts);
router.get('/history', protect, getSearchHistory);
router.get('/analytics', protect, getSearchAnalytics);

export default router;
