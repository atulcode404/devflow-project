import Post from '../models/Post.js';
import User from '../models/User.js';

// @desc    Get recommended projects for user
// @route   GET /api/recommend/projects
// @access  Private
export const getRecommendedProjects = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get all open posts (projects) that were not created by the user
    const posts = await Post.find({ 
      status: 'open',
      author: { $ne: user._id }
    }).populate('author', 'fullName profilePicture');

    const recommendations = [];

    // User data for matching
    const userSkills = user.skills ? user.skills.map(s => s.toLowerCase().trim()) : [];
    const userTechs = Object.keys(user.githubLanguages || {}).map(s => s.toLowerCase().trim());
    const userInterests = user.interests ? user.interests.map(s => s.toLowerCase().trim()) : [];
    
    // Fallback if no specific github languages but preferred technologies exist
    const preferredTechs = user.preferredTechnologies ? user.preferredTechnologies.map(s => s.toLowerCase().trim()) : [];
    const combinedTechs = [...new Set([...userTechs, ...preferredTechs])];

    posts.forEach(post => {
      // 1. Skill Match (40%)
      const postSkills = post.requiredSkills ? post.requiredSkills.map(s => s.toLowerCase().trim()) : [];
      let skillMatchScore = 0;
      let matchedSkills = [];
      let missingSkills = [];
      
      if (postSkills.length > 0) {
        let matchCount = 0;
        postSkills.forEach(skill => {
          if (userSkills.includes(skill)) {
            matchCount++;
            matchedSkills.push(skill);
          } else {
            missingSkills.push(skill);
          }
        });
        skillMatchScore = (matchCount / postSkills.length) * 40;
      } else {
        skillMatchScore = 40; // If no required skills, give full points or maybe 0? Let's give full.
      }

      // 2. GitHub Tech Match (25%)
      const postTechs = post.technologies ? post.technologies.map(s => s.toLowerCase().trim()) : [];
      let techMatchScore = 0;
      if (postTechs.length > 0) {
        let matchCount = 0;
        postTechs.forEach(tech => {
          if (combinedTechs.includes(tech) || userSkills.includes(tech)) {
            matchCount++;
          }
        });
        techMatchScore = (matchCount / postTechs.length) * 25;
      } else {
        techMatchScore = 25; // Default if not specified
      }

      // 3. Interest Match (15%)
      const postTags = post.tags ? post.tags.map(s => s.toLowerCase().trim()) : [];
      if (post.category) postTags.push(post.category.toLowerCase().trim());
      
      let interestMatchScore = 0;
      if (postTags.length > 0 && userInterests.length > 0) {
        const intersection = postTags.filter(tag => userInterests.includes(tag));
        interestMatchScore = Math.min((intersection.length / Math.max(1, Math.min(postTags.length, 3))) * 15, 15);
      } else if (postTags.length === 0) {
        interestMatchScore = 15;
      }

      // 4. Experience Match (10%)
      let expMatchScore = 0;
      const experienceLevels = { 'Beginner': 1, 'Intermediate': 2, 'Advanced': 3 };
      const userLevel = experienceLevels[user.experienceLevel] || 2;
      const postLevel = experienceLevels[post.experienceLevel] || 2;
      
      // If user level is >= post required level, full points. Otherwise partial.
      if (userLevel >= postLevel) {
        expMatchScore = 10;
      } else if (userLevel === postLevel - 1) {
        expMatchScore = 5;
      }

      // 5. Activity Score (10%)
      // Normalize activity score up to max 10
      const activityScoreVal = Math.min((user.activityScore || 50) / 10, 10);

      // Total Score
      let finalScore = skillMatchScore + techMatchScore + interestMatchScore + expMatchScore + activityScoreVal;
      finalScore = Math.round(finalScore);

      // Generate Explanation
      let explanation = `Based on your profile, this project is a ${finalScore}% match. `;
      if (skillMatchScore >= 30) {
        explanation += "You have a strong alignment with the required skills. ";
      } else if (missingSkills.length > 0) {
        explanation += `Learning ${missingSkills[0]} could increase your compatibility. `;
      }
      
      if (expMatchScore === 10) {
        explanation += "It perfectly fits your experience level.";
      }

      recommendations.push({
        project: post,
        score: finalScore,
        metrics: {
          skillMatch: Math.round(skillMatchScore),
          techMatch: Math.round(techMatchScore),
          interestMatch: Math.round(interestMatchScore),
          expMatch: Math.round(expMatchScore),
          activityScore: Math.round(activityScoreVal)
        },
        matchedSkills,
        missingSkills,
        explanation
      });
    });

    // Sort by highest score first
    recommendations.sort((a, b) => b.score - a.score);

    res.json(recommendations.slice(0, 10)); // Return top 10

  } catch (error) {
    console.error('Recommend Projects Error:', error);
    res.status(500).json({ message: 'Server error fetching recommendations' });
  }
};
