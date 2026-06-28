import express from 'express';
import { 
  getStats, getUsers, getReports, getSkillAnalytics, 
  blockUser, unblockUser, deleteUser 
} from '../controllers/adminController.js';
import { protect, admin } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Apply protect and admin middleware globally to all routes below
router.use(protect);
router.use(admin);

router.get('/stats', getStats);
router.get('/users', getUsers);
router.get('/reports', getReports);
router.get('/skills', getSkillAnalytics);

router.put('/users/:id/block', blockUser);
router.put('/users/:id/unblock', unblockUser);
router.delete('/users/:id', deleteUser);

export default router;
