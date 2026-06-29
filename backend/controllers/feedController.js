import User from '../models/User.js';
import ConnectionRequest from '../models/ConnectionRequest.js';

// @desc    Get developer feed with matching algorithm
// @route   GET /api/feed
// @access  Private
export const getFeed = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;
    const skillFilter = req.query.skill;

    const currentUser = await User.findById(req.user._id).lean();

    // 1. Get all connections of current user to exclude them from the feed
    const userConnections = await ConnectionRequest.find({
      $or: [{ sender: currentUser._id }, { receiver: currentUser._id }],
    }).lean();

    const excludedUserIds = new Set();
    excludedUserIds.add(currentUser._id.toString()); // Exclude self

    userConnections.forEach((conn) => {
      excludedUserIds.add(conn.sender.toString());
      excludedUserIds.add(conn.receiver.toString());
    });

    const excludedIdsArray = Array.from(excludedUserIds);

    // 2. Build base query
    const query = { _id: { $nin: excludedIdsArray } };
    if (skillFilter) {
      // Case insensitive match
      query.skills = { $regex: new RegExp(skillFilter, 'i') };
    }

    // 3. Fetch potential matches
    // Note: We fetch more than the limit because we will sort them in memory
    // In a massive production app, this sorting would happen via an aggregation pipeline or specialized search engine (Elasticsearch).
    // For this app, we will do a fast in-memory sort after pulling a reasonable chunk.
    const potentialMatches = await User.find(query)
      .select('-password')
      .lean();

    // 4. Matching Algorithm: Calculate Relevance Score
    // Score factors:
    // - Number of matching skills (high weight)
    const currentUserSkillsLower = new Set(currentUser.skills.map((s) => s.toLowerCase()));
    const totalCurrentSkills = currentUserSkillsLower.size;

    const scoredMatches = potentialMatches.map((user) => {
      let matchedSkillsCount = 0;
      
      if (user.skills && user.skills.length > 0) {
        user.skills.forEach((skill) => {
          if (currentUserSkillsLower.has(skill.toLowerCase())) {
            matchedSkillsCount++;
          }
        });
      }

      // Calculate percentage match relative to current user's total skills
      const matchPercentage = totalCurrentSkills > 0 
        ? Math.round((matchedSkillsCount / totalCurrentSkills) * 100) 
        : 0;

      return {
        ...user,
        matchScore: matchPercentage,
      };
    });

    // 5. Sort by score (descending)
    scoredMatches.sort((a, b) => b.matchScore - a.matchScore);

    // 6. Paginate the sorted array
    const paginatedMatches = scoredMatches.slice(skip, skip + limit);

    res.json({
      success: true,
      count: paginatedMatches.length,
      total: scoredMatches.length,
      page,
      pages: Math.ceil(scoredMatches.length / limit),
      data: paginatedMatches,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get real-time feed statistics
// @route   GET /api/feed/stats
// @access  Private
export const getFeedStats = async (req, res, next) => {
  try {
    const importPost = await import('../models/Post.js');
    const Post = importPost.default;

    // 1. Active Developers (Users excluding admins)
    const activeDevelopers = await User.countDocuments({ role: { $nin: ['admin', 'master_admin'] } });

    // 2. Projects Shared (Posts where postType is 'Project')
    const projectsShared = await Post.countDocuments({ postType: 'Project' });

    // 3. Discussions (Total comments across all posts + posts of type 'Question' or 'Discussion')
    const discussionsResult = await Post.aggregate([
      { $project: { numComments: { $size: { $ifNull: ["$comments", []] } } } },
      { $group: { _id: null, total: { $sum: "$numComments" } } }
    ]);
    const totalComments = discussionsResult.length > 0 ? discussionsResult[0].total : 0;
    const totalQuestions = await Post.countDocuments({ postType: 'Question' });
    const discussions = totalComments + totalQuestions;

    // 4. Trending Skills (Top 2 from users)
    const topSkillsResult = await User.aggregate([
      { $unwind: "$skills" },
      // normalize to title case
      { $project: { skill: { $toLower: "$skills" } } },
      { $group: { _id: "$skill", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 2 }
    ]);
    
    // Capitalize top skills
    const formatSkill = (str) => str ? str.charAt(0).toUpperCase() + str.slice(1) : '';
    const trendingSkills = topSkillsResult.length === 2 
      ? `${formatSkill(topSkillsResult[0]._id)} & ${formatSkill(topSkillsResult[1]._id)}`
      : topSkillsResult.length === 1 ? formatSkill(topSkillsResult[0]._id) : 'React & AI';

    res.json({
      success: true,
      data: {
        activeDevelopers,
        projectsShared,
        discussions,
        trendingSkills
      }
    });
  } catch (error) {
    console.error('Error fetching feed stats:', error);
    next(error);
  }
};

