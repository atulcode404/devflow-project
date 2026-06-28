import express from 'express';
import { getUserProfile, updateUserProfile, getUserById, uploadProfilePhoto, getReputationScore, getUserReputation } from '../controllers/userController.js';
import { protect } from '../middlewares/authMiddleware.js';
import upload from '../middlewares/uploadMiddleware.js';

const router = express.Router();

router.route('/profile').get(protect, getUserProfile).put(protect, updateUserProfile);
router.post('/profile/photo', protect, upload.single('photo'), uploadProfilePhoto);
router.get('/reputation', protect, getReputationScore);
router.get('/:id/reputation', protect, getUserReputation);
router.route('/:id').get(protect, getUserById);

export default router;
