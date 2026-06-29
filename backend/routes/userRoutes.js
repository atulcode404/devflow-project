import express from 'express';
import { 
  getUserProfile, 
  updateUserProfile, 
  getUserById, 
  uploadProfilePhoto, 
  getReputationScore, 
  getUserReputation,
  getNetworkUsers,
  getUserProfileByIdentifier,
  toggleFollowUser,
  updateUserStatus
} from '../controllers/userController.js';
import { protect } from '../middlewares/authMiddleware.js';
import upload from '../middlewares/uploadMiddleware.js';

const router = express.Router();

router.get('/network', protect, getNetworkUsers);
router.put('/status', protect, updateUserStatus);
router.get('/profile/public/:identifier', getUserProfileByIdentifier);
router.post('/:id/follow', protect, toggleFollowUser);

router.route('/profile').get(protect, getUserProfile).put(protect, updateUserProfile);
router.post('/profile/photo', protect, upload.single('photo'), uploadProfilePhoto);
router.get('/reputation', protect, getReputationScore);
router.get('/:id/reputation', protect, getUserReputation);
router.route('/:id').get(protect, getUserById);

export default router;
