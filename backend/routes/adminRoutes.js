import express from 'express';
import { 
  getStats, getUsers, getReports, getSkillAnalytics, 
  blockUser, unblockUser, deleteUser, changeRole, sendAnnouncement
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
router.put('/users/:id/role', changeRole);
router.delete('/users/:id', deleteUser);
router.post('/announcements', sendAnnouncement);

export default router;
