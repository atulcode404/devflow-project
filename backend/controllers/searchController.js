import User from '../models/User.js';
import Post from '../models/Post.js';
import SearchQuery from '../models/SearchQuery.js';
import ConnectionRequest from '../models/ConnectionRequest.js';

// Helper to calculate profile completion
const calculateProfileCompletion = (user) => {
  let score = 0;
  if (user.fullName) score += 15;
  if (user.email) score += 15;
  if (user.bio) score += 15;
  if (user.skills && user.skills.length > 0) score += 15;
  if (user.profilePicture && !user.profilePicture.includes('blank-profile-picture')) score += 15;
  if (user.githubUsername || user.githubProfile) score += 15;
  if (user.location) score += 10;
  return score;
};

// @desc    Search and filter developers
// @route   GET /api/search/developers
// @access  Private
export const searchDevelopers = async (req, res, next) => {
  try {
    const { 
      keyword, skills, location, experience, availability, minCompletion, 
      page = 1, limit = 6, sortBy = 'newest' 
    } = req.query;

    const query = { 
      _id: { $ne: req.user._id },
      role: { $nin: ['admin', 'master_admin'] }
    }; // Exclude current user and admin accounts

    if (keyword) {
      const regex = new RegExp(keyword, 'i');
      query.$or = [
        { fullName: regex },
        { username: regex },
        { bio: regex },
      ];
    }

    if (skills) {
      const skillsArray = skills.split(',').map(s => s.trim()).filter(Boolean);
      if (skillsArray.length > 0) {
        query.skills = { $in: skillsArray.map(s => new RegExp(s, 'i')) };
      }
    }

    if (location) {
      query.location = { $regex: new RegExp(location, 'i') };
    }

    if (experience) {
      query.experienceLevel = experience;
    }

    if (availability) {
      query.availability = availability;
    }

    // Execute query (leaning to inject dynamic profileCompletion field)
    let developers = await User.find(query).select('-password').lean();

    // Fetch all connection requests related to current user
    const connectionRequests = await ConnectionRequest.find({
      $or: [
        { sender: req.user._id },
        { receiver: req.user._id }
      ]
    }).lean();

    // Map profile completion score and connection status
    developers = developers.map(dev => {
      const conn = connectionRequests.find(c => 
        (c.sender.toString() === req.user._id.toString() && c.receiver.toString() === dev._id.toString()) ||
        (c.receiver.toString() === req.user._id.toString() && c.sender.toString() === dev._id.toString())
      );
      return {
        ...dev,
        profileCompletion: calculateProfileCompletion(dev),
        connectionStatus: conn ? conn.status : null,
        connectionSender: conn ? conn.sender.toString() : null,
      };
    });

    // Filter by completion if set
    if (minCompletion) {
      const minVal = parseInt(minCompletion, 10);
      developers = developers.filter(dev => dev.profileCompletion >= minVal);
    }

    // Sorting logic
    if (sortBy === 'newest') {
      developers.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } else if (sortBy === 'oldest') {
      developers.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    } else if (sortBy === 'most_repos') {
      developers.sort((a, b) => (b.githubProfile?.public_repos || 0) - (a.githubProfile?.public_repos || 0));
    } else if (sortBy === 'most_followers') {
      developers.sort((a, b) => (b.githubProfile?.followers || 0) - (a.githubProfile?.followers || 0));
    }

    // Pagination
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const startIndex = (pageNum - 1) * limitNum;
    const endIndex = pageNum * limitNum;

    const total = developers.length;
    const paginatedDevs = developers.slice(startIndex, endIndex);

    // Log query in background (if keyword or filters are active)
    if (keyword || skills || location || experience || availability) {
      await SearchQuery.create({
        user: req.user._id,
        keyword: keyword || '',
        filters: {
          skills: skills ? skills.split(',') : [],
          location: location || '',
          experienceLevel: experience || '',
        },
        searchType: 'developer',
      });
    }

    res.status(200).json({
      success: true,
      count: paginatedDevs.length,
      total,
      pages: Math.ceil(total / limitNum),
      page: pageNum,
      data: paginatedDevs,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Search and filter collaboration posts
// @route   GET /api/search/posts
// @access  Private
export const searchPosts = async (req, res, next) => {
  try {
    const { 
      keyword, skills, projectType, status, experience, 
      page = 1, limit = 6, sortBy = 'newest' 
    } = req.query;

    const query = {};

    if (keyword) {
      const regex = new RegExp(keyword, 'i');
      query.$or = [
        { title: regex },
        { description: regex },
      ];
    }

    if (skills) {
      const skillsArray = skills.split(',').map(s => s.trim()).filter(Boolean);
      if (skillsArray.length > 0) {
        query.requiredSkills = { $in: skillsArray.map(s => new RegExp(s, 'i')) };
      }
    }

    if (projectType) {
      query.projectType = projectType;
    }

    if (status) {
      query.status = status;
    }

    if (experience) {
      query.experienceLevel = experience;
    }

    let sortOptions = { createdAt: -1 };
    if (sortBy === 'oldest') {
      sortOptions = { createdAt: 1 };
    }

    // If sorting by likes count, we'll fetch then sort or aggregate
    let posts;
    if (sortBy === 'most_likes') {
      posts = await Post.find(query)
        .populate('author', 'fullName profilePicture skills')
        .populate('comments.user', 'fullName profilePicture')
        .lean();
      
      posts.sort((a, b) => (b.likes?.length || 0) - (a.likes?.length || 0));
    } else {
      posts = await Post.find(query)
        .sort(sortOptions)
        .populate('author', 'fullName profilePicture skills')
        .populate('comments.user', 'fullName profilePicture')
        .lean();
    }

    // Pagination
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const startIndex = (pageNum - 1) * limitNum;
    const endIndex = pageNum * limitNum;

    const total = posts.length;
    const paginatedPosts = posts.slice(startIndex, endIndex);

    // Log query in background
    if (keyword || skills || projectType || status || experience) {
      await SearchQuery.create({
        user: req.user._id,
        keyword: keyword || '',
        filters: {
          skills: skills ? skills.split(',') : [],
          projectType: projectType || '',
          status: status || '',
          experienceLevel: experience || '',
        },
        searchType: 'post',
      });
    }

    res.status(200).json({
      success: true,
      count: paginatedPosts.length,
      total,
      pages: Math.ceil(total / limitNum),
      page: pageNum,
      data: paginatedPosts,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user's recent search queries
// @route   GET /api/search/history
// @access  Private
export const getSearchHistory = async (req, res, next) => {
  try {
    const history = await SearchQuery.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(6);

    res.status(200).json(history);
  } catch (error) {
    next(error);
  }
};

// @desc    Get search aggregation analytics
// @route   GET /api/search/analytics
// @access  Private
export const getSearchAnalytics = async (req, res, next) => {
  try {
    // 1. Trending Skills: Unwind skills filter array and count frequencies
    const skillStats = await SearchQuery.aggregate([
      { $match: { 'filters.skills': { $exists: true, $ne: [] } } },
      { $unwind: '$filters.skills' },
      { $group: { _id: { $toLower: '$filters.skills' }, count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);

    // 2. Trending Locations
    const locationStats = await SearchQuery.aggregate([
      { $match: { 'filters.location': { $exists: true, $ne: '' } } },
      { $group: { _id: { $toLower: '$filters.location' }, count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);

    // 3. Trending Project Categories
    const projectStats = await SearchQuery.aggregate([
      { $match: { 'filters.projectType': { $exists: true, $ne: '' } } },
      { $group: { _id: '$filters.projectType', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);

    res.status(200).json({
      trendingSkills: skillStats.map(s => ({ name: s._id, count: s.count })),
      trendingLocations: locationStats.map(l => ({ name: l._id, count: l.count })),
      trendingProjects: projectStats.map(p => ({ name: p._id, count: p.count })),
    });
  } catch (error) {
    next(error);
  }
};
