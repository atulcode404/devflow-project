import express from 'express';
import { 
  createPost, getPosts, getPostById, updatePost, deletePost, toggleLikePost, addComment 
} from '../controllers/postController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.route('/')
  .post(protect, createPost)
  .get(getPosts);

router.route('/:id')
  .get(getPostById)
  .put(protect, updatePost)
  .delete(protect, deletePost);

router.post('/:id/like', protect, toggleLikePost);
router.post('/:id/comment', protect, addComment);

export default router;
