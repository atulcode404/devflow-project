import mongoose from 'mongoose';
import User from '../models/User.js';
import { createNotification } from '../utils/createNotification.js';
import Notification from '../models/Notification.js';
import { calculateReputation } from '../services/reputationService.js';

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
export const getUserProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);

    if (user) {
      res.json({
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        bio: user.bio,
        skills: user.skills,
        profilePicture: user.profilePicture,
        githubLink: user.githubLink,
        linkedinLink: user.linkedinLink,
        role: user.role,
      });
    } else {
      res.status(404);
      throw new Error('User not found');
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
export const updateUserProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);

    if (user) {
      user.fullName = req.body.fullName || user.fullName;
      user.email = req.body.email || user.email;
      user.bio = req.body.bio !== undefined ? req.body.bio : user.bio;
      user.headline = req.body.headline !== undefined ? req.body.headline : user.headline;
      user.skills = req.body.skills || user.skills;
      user.profilePicture = req.body.profilePicture || user.profilePicture;
      user.backgroundPicture = req.body.backgroundPicture || user.backgroundPicture;
      user.githubLink = req.body.githubLink !== undefined ? req.body.githubLink : user.githubLink;
      user.linkedinLink = req.body.linkedinLink !== undefined ? req.body.linkedinLink : user.linkedinLink;
      user.experience = req.body.experience || user.experience;
      user.education = req.body.education || user.education;
      user.projects = req.body.projects || user.projects;
      user.portfolio = req.body.portfolio || user.portfolio;

      if (req.body.password) {
        user.password = req.body.password;
      }

      const updatedUser = await user.save();

      // Update reputation asynchronously
      calculateReputation(updatedUser._id);

      res.json({
        _id: updatedUser._id,
        fullName: updatedUser.fullName,
        email: updatedUser.email,
        bio: updatedUser.bio,
        headline: updatedUser.headline,
        skills: updatedUser.skills,
        profilePicture: updatedUser.profilePicture,
        backgroundPicture: updatedUser.backgroundPicture,
        githubLink: updatedUser.githubLink,
        linkedinLink: updatedUser.linkedinLink,
        role: updatedUser.role,
        experience: updatedUser.experience,
        education: updatedUser.education,
        projects: updatedUser.projects,
        portfolio: updatedUser.portfolio,
      });
    } else {
      res.status(404);
      throw new Error('User not found');
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error updating profile' });
  }
};

// @desc    Get current user reputation score
// @route   GET /api/users/reputation
// @access  Private
export const getReputationScore = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('reputationScore reputationBadge reputationBreakdown');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error getting reputation' });
  }
};

// @desc    Get user reputation score by ID
// @route   GET /api/users/:id/reputation
// @access  Private
export const getUserReputation = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('reputationScore reputationBadge');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error getting user reputation' });
  }
};

// @desc    Upload profile photo
// @route   POST /api/users/profile/photo
// @access  Private
export const uploadProfilePhoto = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No image file provided' });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Construct image URL
    // e.g., http://localhost:5000/uploads/profile/filename.jpg
    const imageUrl = `${req.protocol}://${req.get('host')}/${req.file.path.replace(/\\/g, '/')}`;

    user.profilePicture = imageUrl;
    await user.save();

    // Update reputation asynchronously
    calculateReputation(user._id);

    res.json({
      message: 'Profile photo uploaded successfully',
      profilePicture: user.profilePicture,
    });
  } catch (error) {
    console.error('Upload Photo Error:', error);
    res.status(500).json({ message: 'Server error uploading photo' });
  }
};

// @desc    Get user by ID
// @route   GET /api/users/:id
// @access  Private
export const getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (user) {
      // Trigger profile_viewed notification with 24h cooldown check
      if (req.user && req.user._id.toString() !== req.params.id.toString()) {
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const existingView = await Notification.findOne({
          recipient: req.params.id,
          sender: req.user._id,
          type: 'profile_viewed',
          createdAt: { $gte: oneDayAgo }
        });

        if (!existingView) {
          await createNotification(req, {
            recipient: req.params.id,
            sender: req.user._id,
            type: 'profile_viewed',
            title: 'Profile Viewed',
            message: `${req.user.fullName} viewed your profile.`,
            link: '/profile',
          });
        }
      }

      res.json(user);
    } else {
      res.status(404);
      throw new Error('User not found');
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Get network users
// @route   GET /api/users/network
// @access  Private
export const getNetworkUsers = async (req, res, next) => {
  try {
    const users = await User.find({ 
      _id: { $ne: req.user._id },
      role: { $nin: ['admin', 'master_admin'] }
    })
      .select('fullName username role skills profilePicture isOnline lastSeen followers following headline location experienceLevel projects availability')
      .sort({ lastSeen: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Server error getting network users' });
  }
};

// @desc    Get user by username or ID
// @route   GET /api/users/profile/:identifier
// @access  Public
export const getUserProfileByIdentifier = async (req, res, next) => {
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

    const user = await User.findOne(query)
      .select('-password')
      .populate('followers', 'fullName username profilePicture')
      .populate('following', 'fullName username profilePicture');
      
    if (user) {
      // Increment profile views safely without triggering full document validation
      await User.updateOne({ _id: user._id }, { $inc: { profileViews: 1 } });
      user.profileViews = (user.profileViews || 0) + 1; // Update locally for response
      res.json(user);
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error getting user' });
  }
};

// @desc    Toggle Follow user
// @route   POST /api/users/:id/follow
// @access  Private
export const toggleFollowUser = async (req, res, next) => {
  try {
    const targetUserId = req.params.id;
    const currentUserId = req.user._id;

    if (targetUserId === currentUserId.toString()) {
      return res.status(400).json({ message: 'You cannot follow yourself' });
    }

    const targetUser = await User.findById(targetUserId);
    const currentUser = await User.findById(currentUserId);

    if (!targetUser || !currentUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    const isFollowing = currentUser.following.includes(targetUserId);

    if (isFollowing) {
      // Unfollow
      await User.updateOne({ _id: currentUserId }, { $pull: { following: targetUserId } });
      await User.updateOne({ _id: targetUserId }, { $pull: { followers: currentUserId } });
    } else {
      // Follow
      await User.updateOne({ _id: currentUserId }, { $push: { following: targetUserId } });
      await User.updateOne({ _id: targetUserId }, { $push: { followers: currentUserId } });
      
      // Notify target user
      await createNotification(req, {
        recipient: targetUserId,
        sender: currentUserId,
        type: 'follow',
        title: 'New Follower',
        message: `${currentUser.fullName} started following you.`,
        link: `/developer/${currentUser.username || currentUser._id}`,
      });
    }

    res.json({ message: isFollowing ? 'Unfollowed successfully' : 'Followed successfully', isFollowing: !isFollowing });
  } catch (error) {
    res.status(500).json({ message: 'Server error following user' });
  }
};

// @desc    Update online status
// @route   PUT /api/users/status
// @access  Private
export const updateUserStatus = async (req, res, next) => {
  try {
    const { isOnline } = req.body;
    const user = await User.findById(req.user._id);
    
    if (user) {
      user.isOnline = isOnline;
      user.lastSeen = Date.now();
      await user.save();
      res.json({ isOnline: user.isOnline, lastSeen: user.lastSeen });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error updating status' });
  }
};
