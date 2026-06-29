import express from 'express';
import { registerUser, loginUser, logoutUser } from '../controllers/authController.js';
import { rateLimiter } from '../middlewares/rateLimitMiddleware.js';

const router = express.Router();

router.post('/register', rateLimiter, registerUser);
router.post('/login', rateLimiter, loginUser);
router.post('/logout', logoutUser);

export default router;
