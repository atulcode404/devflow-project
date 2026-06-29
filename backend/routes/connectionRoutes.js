import express from 'express';
import { sendConnectionRequest, respondConnectionRequest, getConnections } from '../controllers/connectionController.js';
import { protect } from '../middlewares/authMiddleware.js';
import { connectionRateLimiter } from '../middlewares/rateLimiter.js';

const router = express.Router();

router.post('/send/:id', protect, connectionRateLimiter, sendConnectionRequest);
router.post('/respond/:id', protect, respondConnectionRequest);
router.get('/', protect, getConnections);

export default router;
