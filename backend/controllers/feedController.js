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
