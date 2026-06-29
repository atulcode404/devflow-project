import mongoose from 'mongoose';
import Post from '../models/Post.js';
import User from '../models/User.js';
import { createNotification } from '../utils/createNotification.js';
import { calculateReputation } from '../services/reputationService.js';

// @desc    Create a collaboration post
// @route   POST /api/posts
// @access  Private
export const createPost = async (req, res, next) => {
  try {
    const { title, description, content, images, requiredSkills, projectType, experienceLevel, contactMethod } = req.body;
    const authorId = req.user._id;

    if (!content && !description && !title) {
      res.status(400);
      throw new Error('Post must have either content, title, or description');
    }

    const post = await Post.create({
      author: authorId,
      title,
      description,
      content,
      images: images || [],
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
      .limit(50)
      .populate('author', 'fullName profilePicture skills')
      .populate({
        path: 'comments.user',
        select: 'fullName profilePicture'
      })
      .lean();

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

// @desc    Get posts by user
// @route   GET /api/posts/user/:identifier
// @access  Public
export const getPostsByUser = async (req, res, next) => {
  try {
    const identifier = req.params.identifier;
    // Protect against literal "undefined" string
    if (!identifier || identifier === 'undefined') {
      return res.status(404).json({ message: 'User not found' });
    }

    const query = {
      $or: [
        { username: identifier }
      ]
    };

    if (mongoose.Types.ObjectId.isValid(identifier)) {
      query.$or.push({ _id: identifier });
    }

    const user = await User.findOne(query);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const posts = await Post.find({ author: user._id })
      .sort({ createdAt: -1 })
      .populate('author', 'fullName username profilePicture headline')
      .populate('comments.user', 'fullName username profilePicture');

    res.json(posts);
  } catch (error) {
    res.status(500).json({ message: 'Server error getting user posts' });
  }
};

// @desc    Save a post
// @route   POST /api/posts/:id/save
// @access  Private
export const savePost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const userId = req.user._id;
    const isSaved = post.saves.includes(userId);

    if (isSaved) {
      post.saves.pull(userId);
    } else {
      post.saves.push(userId);
    }

    await post.save();
    res.json(post.saves);
  } catch (error) {
    res.status(500).json({ message: 'Server error saving post' });
  }
};

// @desc    Share a post
// @route   POST /api/posts/:id/share
// @access  Private
export const sharePost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const userId = req.user._id;
    
    // Simplistic share functionality (just increment tracking for now)
    // A real implementation would create a new post object referencing the original
    if (!post.shares.includes(userId)) {
      post.shares.push(userId);
      await post.save();
    }

    res.json(post.shares);
  } catch (error) {
    res.status(500).json({ message: 'Server error sharing post' });
  }
};
