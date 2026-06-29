import User from '../models/User.js';
import Post from '../models/Post.js';
import Message from '../models/Message.js';
import ConnectionRequest from '../models/ConnectionRequest.js';

// @desc    Get dashboard statistics
// @route   GET /api/admin/stats
// @access  Private/Admin
export const getStats = async (req, res, next) => {
  try {
    const totalUsers = await User.countDocuments({});
    const activeUsers = await User.countDocuments({ isActive: true });
    const reportedUsers = await User.countDocuments({ isReported: true });
    
    // Calculate new users this month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    const newUsersThisMonth = await User.countDocuments({ createdAt: { $gte: startOfMonth } });

    const totalPosts = await Post.countDocuments({});
    const totalConnections = await ConnectionRequest.countDocuments({ status: 'accepted' });
    const totalMessages = await Message.countDocuments({});

    // Top skills aggregation
    const skillStats = await User.aggregate([
      { $unwind: '$skills' },
      { $group: { _id: { $toLower: '$skills' }, count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    const topSkills = skillStats.map(s => ({
      skill: s._id,
      count: s.count
    }));

    // Call Analytics from global scope
    const activeCallsCount = global.activeCallsMap ? Math.ceil(global.activeCallsMap.size / 2) : 0;
    const totalVideoCalls = global.totalVideoCalls || 0;
    const totalVoiceCalls = global.totalVoiceCalls || 0;
    const failedCalls = global.failedCalls || 0;

    res.status(200).json({
      totalUsers,
      activeUsers,
      newUsersThisMonth,
      reportedUsers,
      totalPosts,
      totalConnections,
      totalMessages,
      topSkills,
      callStats: {
        totalVideoCalls,
        totalVoiceCalls,
        failedCalls,
        activeCallsCount
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all users with search and pagination
// @route   GET /api/admin/users
// @access  Private/Admin
export const getUsers = async (req, res, next) => {
  try {
    const { keyword, page = 1, limit = 10 } = req.query;

    const query = {};
    if (keyword) {
      const regex = new RegExp(keyword, 'i');
      query.$or = [
        { fullName: regex },
        { email: regex },
        { username: regex }
      ];
    }

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const total = await User.countDocuments(query);
    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    res.status(200).json({
      success: true,
      count: users.length,
      total,
      pages: Math.ceil(total / limitNum),
      page: pageNum,
      data: users
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get reported users
// @route   GET /api/admin/reports
// @access  Private/Admin
export const getReports = async (req, res, next) => {
  try {
    const reportedUsers = await User.find({ 
      $or: [
        { isReported: true }, 
        { reportCount: { $gt: 0 } }
      ]
    })
    .select('-password')
    .sort({ reportCount: -1 });

    res.status(200).json(reportedUsers);
  } catch (error) {
    next(error);
  }
};

// @desc    Get skill and GitHub language analytics
// @route   GET /api/admin/skills
// @access  Private/Admin
export const getSkillAnalytics = async (req, res, next) => {
  try {
    // 1. Skill occurrences
    const skillStats = await User.aggregate([
      { $unwind: '$skills' },
      { $group: { _id: { $toLower: '$skills' }, count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    const skillsCount = skillStats.map(s => ({
      name: s._id,
      count: s.count
    }));

    // 2. GitHub languages analytics
    const usersWithGitLangs = await User.find({ 
      githubLanguages: { $exists: true, $ne: null } 
    }).select('githubLanguages');

    const langCounts = {};
    usersWithGitLangs.forEach(u => {
      if (u.githubLanguages && typeof u.githubLanguages === 'object') {
        Object.keys(u.githubLanguages).forEach(lang => {
          langCounts[lang] = (langCounts[lang] || 0) + 1;
        });
      }
    });

    const githubLanguages = Object.keys(langCounts).map(lang => ({
      name: lang,
      count: langCounts[lang]
    })).sort((a, b) => b.count - a.count);

    res.status(200).json({
      skillsCount,
      githubLanguages
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Block user
// @route   PUT /api/admin/users/:id/block
// @access  Private/Admin
export const blockUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }

    if (user.role === 'master_admin') {
      res.status(403);
      throw new Error('Cannot block a master admin');
    }

    user.isActive = false;
    await user.save();

    res.status(200).json({ success: true, message: 'User blocked successfully', user });
  } catch (error) {
    next(error);
  }
};

// @desc    Unblock user
// @route   PUT /api/admin/users/:id/unblock
// @access  Private/Admin
export const unblockUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }

    if (user.role === 'master_admin') {
      res.status(403);
      throw new Error('Cannot unblock a master admin');
    }

    user.isActive = true;
    user.isReported = false;
    user.reportCount = 0;
    await user.save();

    res.status(200).json({ success: true, message: 'User unblocked successfully', user });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete user
// @route   DELETE /api/admin/users/:id
// @access  Private/Admin
export const deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }

    if (user.role === 'master_admin') {
      res.status(403);
      throw new Error('Cannot delete a master admin');
    }

    // Delete user's posts
    await Post.deleteMany({ author: user._id });

    // Delete user's connections
    await ConnectionRequest.deleteMany({
      $or: [
        { sender: user._id },
        { receiver: user._id }
      ]
    });

    // Delete user's messages
    await Message.deleteMany({
      $or: [
        { sender: user._id },
        { receiver: user._id }
      ]
    });

    // Delete user profile
    await user.deleteOne();

    res.status(200).json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// @desc    Change User Role
// @route   PUT /api/admin/users/:id/role
// @access  Private/Admin
export const changeRole = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }

    if (user.role === 'master_admin') {
      res.status(403);
      throw new Error('Cannot change the role of a master admin');
    }

    // Toggle role
    user.role = user.role === 'admin' ? 'user' : 'admin';
    await user.save();

    res.status(200).json({ success: true, message: 'User role updated', user });
  } catch (error) {
    next(error);
  }
};

// @desc    Send announcement to all users
// @route   POST /api/admin/announcements
// @access  Private/Admin (specifically master_admin typically, but we can allow admin too)
export const sendAnnouncement = async (req, res, next) => {
  try {
    const { title, message } = req.body;
    
    if (!title || !message) {
      res.status(400);
      throw new Error('Title and message are required for announcements');
    }

    // Since we're keeping it simple, we will fetch all user IDs except the sender
    const users = await User.find({ _id: { $ne: req.user._id } }).select('_id');
    
    const notifications = users.map(u => ({
      recipient: u._id,
      sender: req.user._id,
      type: 'system_announcement',
      title,
      message,
      isRead: false
    }));

    // Import Notification model dynamically or ensure it's imported at top
    const { default: Notification } = await import('../models/Notification.js');
    
    await Notification.insertMany(notifications);

    res.status(200).json({ success: true, message: `Announcement sent to ${users.length} users.` });
  } catch (error) {
    next(error);
  }
};
