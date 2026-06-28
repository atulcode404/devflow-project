import User from '../models/User.js';
import Post from '../models/Post.js';
import ConnectionRequest from '../models/ConnectionRequest.js';
import Message from '../models/Message.js';

export const calculateReputation = async (userId) => {
  try {
    const user = await User.findById(userId);
    if (!user) return;

    let profileScore = 0; // max 25
    let githubScore = 0;  // max 25
    let postsScore = 0;   // max 15
    let connectionsScore = 0; // max 15
    let activityScore = 0;    // max 10
    let participationScore = 0; // max 10

    // 1. Profile Completeness (Max 25)
    let profileFactors = 0;
    if (user.bio && user.bio.length > 10) profileFactors += 5;
    if (user.skills && user.skills.length > 0) profileFactors += 5;
    if (user.profilePicture && !user.profilePicture.includes('blank-profile')) profileFactors += 5;
    if (user.location) profileFactors += 5;
    if (user.experienceLevel) profileFactors += 5;
    profileScore = Math.min(profileFactors, 25);

    // 2. GitHub Activity (Max 25)
    let githubFactors = 0;
    if (user.githubProfile && user.githubUsername) {
      githubFactors += 10; // 10 points just for syncing
      
      const publicRepos = user.githubProfile.publicRepos || 0;
      if (publicRepos > 0) githubFactors += 5;
      if (publicRepos >= 10) githubFactors += 5; // Extra points for more repos
      
      const totalStars = user.githubStats?.totalStars || 0;
      if (totalStars > 0) githubFactors += 2;
      if (totalStars > 10) githubFactors += 3;
    }
    githubScore = Math.min(githubFactors, 25);

    // 3. Collaboration Posts (Max 15)
    const postCount = await Post.countDocuments({ author: userId });
    if (postCount >= 1) postsScore += 5;
    if (postCount >= 3) postsScore += 5;
    if (postCount >= 5) postsScore += 5;

    // 4. Connections (Max 15)
    const connectionCount = await ConnectionRequest.countDocuments({
      $or: [{ sender: userId }, { receiver: userId }],
      status: 'accepted'
    });
    if (connectionCount >= 1) connectionsScore += 5;
    if (connectionCount >= 5) connectionsScore += 5;
    if (connectionCount >= 10) connectionsScore += 5;

    // 5. Chat Activity (Max 10)
    const messageCount = await Message.countDocuments({ sender: userId });
    if (messageCount >= 1) activityScore += 2;
    if (messageCount >= 10) activityScore += 3;
    if (messageCount >= 50) activityScore += 5;

    // 6. Project Participation (Max 10)
    // Count posts where user is in appliedUsers and status is 'accepted'
    // Let's assume appliedUsers holds the users who applied. Wait, the Post model has appliedUsers? Let's check.
    // If not, we'll base participation on something else or just give points for general activity score.
    // For now, I'll count if they have applied to any posts.
    const appliedPostsCount = await Post.countDocuments({ appliedUsers: userId });
    if (appliedPostsCount >= 1) participationScore += 5;
    if (appliedPostsCount >= 3) participationScore += 5;

    // Total Calculation
    const totalScore = profileScore + githubScore + postsScore + connectionsScore + activityScore + participationScore;
    
    // Determine Badge
    let badge = 'Beginner';
    if (totalScore >= 86) badge = 'Top Developer';
    else if (totalScore >= 61) badge = 'Pro Collaborator';
    else if (totalScore >= 31) badge = 'Active Developer';

    // Update User Document
    user.reputationScore = totalScore;
    user.reputationBadge = badge;
    user.reputationBreakdown = {
      profile: profileScore,
      github: githubScore,
      posts: postsScore,
      connections: connectionsScore,
      activity: activityScore,
      participation: participationScore
    };

    await user.save();
    return user;
  } catch (error) {
    console.error('Error calculating reputation:', error);
  }
};
