import Post from '../models/Post.js';
import User from '../models/User.js';
import { createNotification } from '../utils/createNotification.js';
import { calculateReputation } from '../services/reputationService.js';

// @desc    Create a collaboration post
// @route   POST /api/posts
// @access  Private
export const createPost = async (req, res, next) => {
  try {
    const { title, description, requiredSkills, projectType, experienceLevel, contactMethod } = req.body;
    const authorId = req.user._id;

    if (!title || !description || !projectType || !experienceLevel || !contactMethod) {
      res.status(400);
      throw new Error('Please fill in all required fields');
    }

    const post = await Post.create({
      author: authorId,
      title,
      description,
      requiredSkills: requiredSkills || [],
      projectType,
      experienceLevel,
      contactMethod,
    });

    const populatedPost = await Post.findById(post._id).populate('author', 'fullName profilePicture skills');

    // Update reputation asynchronously
    calculateReputation(authorId);

    res.status(201).json(populatedPost);
  } catch (error) {
    next(error);
  }
};

// @desc    Get all collaboration posts with optional filtering
// @route   GET /api/posts
// @access  Public
export const getPosts = async (req, res, next) => {
  try {
    const { skill, projectType, status } = req.query;

    const query = {};

    if (status) {
      query.status = status;
    }
    if (projectType) {
      query.projectType = projectType;
    }
    if (skill) {
      query.requiredSkills = { $regex: new RegExp(skill, 'i') };
    }

    const posts = await Post.find(query)
      .sort({ createdAt: -1 })
      .populate('author', 'fullName profilePicture skills')
      .populate('comments.user', 'fullName profilePicture');

    res.status(200).json(posts);
  } catch (error) {
    next(error);
  }
};

// @desc    Get single post by ID
// @route   GET /api/posts/:id
// @access  Public
export const getPostById = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate('author', 'fullName profilePicture skills')
      .populate('comments.user', 'fullName profilePicture');

    if (!post) {
      res.status(404);
      throw new Error('Post not found');
    }

    res.status(200).json(post);
  } catch (error) {
    next(error);
  }
};

// @desc    Update collaboration post
// @route   PUT /api/posts/:id
// @access  Private
export const updatePost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      res.status(404);
      throw new Error('Post not found');
    }

    // Check post ownership
    if (post.author.toString() !== req.user._id.toString()) {
      res.status(401);
      throw new Error('Not authorized to edit this post');
    }

    const updatedPost = await Post.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    )
      .populate('author', 'fullName profilePicture skills')
      .populate('comments.user', 'fullName profilePicture');

    res.status(200).json(updatedPost);
  } catch (error) {
    next(error);
  }
};

// @desc    Delete collaboration post
// @route   DELETE /api/posts/:id
// @access  Private
export const deletePost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      res.status(404);
      throw new Error('Post not found');
    }

    // Check post ownership
    if (post.author.toString() !== req.user._id.toString()) {
      res.status(401);
      throw new Error('Not authorized to delete this post');
    }

    await post.deleteOne();

    res.status(200).json({ success: true, message: 'Post deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle like / unlike on a post
// @route   POST /api/posts/:id/like
// @access  Private
export const toggleLikePost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      res.status(404);
      throw new Error('Post not found');
    }

    const userId = req.user._id;
    const isLiked = post.likes.includes(userId);

    if (isLiked) {
      // Unlike post
      post.likes = post.likes.filter((id) => id.toString() !== userId.toString());
    } else {
      // Like post
      post.likes.push(userId);
    }

    await post.save();

    // Trigger post_liked notification (only if liked, and not self-like)
    if (!isLiked && post.author.toString() !== userId.toString()) {
      await createNotification(req, {
        recipient: post.author,
        sender: userId,
        type: 'post_liked',
        title: 'Post Liked',
        message: `${req.user.fullName} liked your collaboration post.`,
        link: '/',
        metadata: { postId: post._id.toString() }
      });
    }

    res.status(200).json(post.likes);
  } catch (error) {
    next(error);
  }
};

// @desc    Add comment to a post
// @route   POST /api/posts/:id/comment
// @access  Private
export const addComment = async (req, res, next) => {
  try {
    const { text } = req.body;
    const userId = req.user._id;

    if (!text || !text.trim()) {
      res.status(400);
      throw new Error('Comment text is required');
    }

    const post = await Post.findById(req.params.id);

    if (!post) {
      res.status(404);
      throw new Error('Post not found');
    }

    const newComment = {
      user: userId,
      text: text.trim(),
      createdAt: new Date(),
    };

    post.comments.push(newComment);
    await post.save();

    const populatedPost = await Post.findById(post._id)
      .populate('comments.user', 'fullName profilePicture');

    // Trigger post_commented notification (if not self-comment)
    if (post.author.toString() !== userId.toString()) {
      await createNotification(req, {
        recipient: post.author,
        sender: userId,
        type: 'post_commented',
        title: 'New Comment on Post',
        message: `${req.user.fullName} commented on your collaboration post.`,
        link: '/',
        metadata: { postId: post._id.toString() }
      });
    }

    res.status(201).json(populatedPost.comments);
  } catch (error) {
    next(error);
  }
};
