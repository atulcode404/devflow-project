import express from 'express';
import { 
  createPost, getPosts, getPostById, updatePost, deletePost, toggleLikePost, addComment,
  getPostsByUser, savePost, sharePost
} from '../controllers/postController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.get('/user/:identifier', getPostsByUser);

router.route('/')
  .post(protect, createPost)
  .get(getPosts);

router.route('/:id')
  .get(getPostById)
  .put(protect, updatePost)
  .delete(protect, deletePost);

router.post('/:id/like', protect, toggleLikePost);
router.post('/:id/comment', protect, addComment);
router.post('/:id/save', protect, savePost);
router.post('/:id/share', protect, sharePost);

export default router;
