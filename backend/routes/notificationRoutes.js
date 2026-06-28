import express from 'express';
import { 
  getNotifications, getUnreadCount, markAsRead, markAllAsRead, deleteNotification, clearAllNotifications 
} from '../controllers/notificationController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.get('/', protect, getNotifications);
router.get('/unread-count', protect, getUnreadCount);
router.put('/read-all', protect, markAllAsRead);
router.delete('/clear-all', protect, clearAllNotifications);

router.put('/:id/read', protect, markAsRead);
router.delete('/:id', protect, deleteNotification);

export default router;
