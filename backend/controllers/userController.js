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
      user.skills = req.body.skills || user.skills;
      user.profilePicture = req.body.profilePicture || user.profilePicture;
      user.githubLink = req.body.githubLink !== undefined ? req.body.githubLink : user.githubLink;
      user.linkedinLink = req.body.linkedinLink !== undefined ? req.body.linkedinLink : user.linkedinLink;

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
        skills: updatedUser.skills,
        profilePicture: updatedUser.profilePicture,
        githubLink: updatedUser.githubLink,
        linkedinLink: updatedUser.linkedinLink,
        role: updatedUser.role,
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
