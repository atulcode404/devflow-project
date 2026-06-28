import User from '../models/User.js';
import { calculateReputation } from '../services/reputationService.js';

// Sync GitHub Profile and fetch statistics, repos, languages, and calculate achievements/skills
export const syncGithubProfile = async (req, res, next) => {
  try {
    const { githubUsername } = req.body;
    const userId = req.user._id;

    if (!githubUsername) {
      res.status(400);
      throw new Error('GitHub username is required');
    }

    const user = await User.findById(userId);
    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }

    // Cooldown check: Limit manual syncs to once every 5 minutes in development
    const COOLDOWN_MS = 5 * 60 * 1000; // 5 minutes
    if (user.githubLastSync && (Date.now() - new Date(user.githubLastSync).getTime() < COOLDOWN_MS)) {
      res.status(429);
      throw new Error('Please wait at least 5 minutes between profile syncs');
    }

    // GitHub API Request Options (Optional token for higher rate limit)
    const headers = {
      'User-Agent': 'DevFlow-App',
      'Accept': 'application/vnd.github.v3+json',
    };
    if (process.env.GITHUB_TOKEN) {
      headers['Authorization'] = `token ${process.env.GITHUB_TOKEN}`;
    }

    // 1. Fetch User Profile Details
    const profileResponse = await fetch(`https://api.github.com/users/${githubUsername}`, { headers });
    if (!profileResponse.ok) {
      if (profileResponse.status === 404) {
        res.status(404);
        throw new Error('GitHub user not found');
      }
      const errText = await profileResponse.text();
      res.status(profileResponse.status);
      throw new Error(`GitHub API Error: ${errText || profileResponse.statusText}`);
    }
    const profileData = await profileResponse.json();

    // 2. Fetch User Repositories
    // Fetch up to 100 repositories
    const reposResponse = await fetch(`https://api.github.com/users/${githubUsername}/repos?per_page=100&sort=updated`, { headers });
    if (!reposResponse.ok) {
      res.status(reposResponse.status);
      throw new Error('Failed to fetch repositories from GitHub');
    }
    const reposData = await reposResponse.json();

    // 3. Process Repository Data & Calculate Stats
    let totalStars = 0;
    const languagesMap = {};
    const processedRepos = [];

    reposData.forEach((repo) => {
      totalStars += repo.stargazers_count;

      // Track programming languages frequency
      if (repo.language) {
        languagesMap[repo.language] = (languagesMap[repo.language] || 0) + 1;
      }

      processedRepos.push({
        name: repo.name,
        description: repo.description || '',
        url: repo.html_url,
        stars: repo.stargazers_count,
        language: repo.language || 'Unknown',
        updatedAt: repo.updated_at,
        forks: repo.forks_count,
      });
    });

    // Sort repositories by stars descending (top repos)
    const topRepos = [...processedRepos]
      .sort((a, b) => b.stars - a.stars)
      .slice(0, 5);

    // Calculate language percentages
    const totalReposWithLanguage = Object.values(languagesMap).reduce((sum, count) => sum + count, 0);
    const languagesPercentage = {};
    if (totalReposWithLanguage > 0) {
      Object.keys(languagesMap).forEach((lang) => {
        languagesPercentage[lang] = Math.round((languagesMap[lang] / totalReposWithLanguage) * 100);
      });
    }

    // 4. Achievement Badges (Dynamic heuristics)
    const badges = [];
    const uniqueLanguages = Object.keys(languagesMap).length;

    if (uniqueLanguages >= 4) {
      badges.push({
        name: 'Polyglot',
        description: 'Mastered 4+ programming languages',
        icon: 'code-2',
        color: 'purple',
      });
    }
    if (totalStars >= 5) {
      badges.push({
        name: 'Star Collector',
        description: 'Earned 5+ stars on repositories',
        icon: 'star',
        color: 'yellow',
      });
    }
    if (processedRepos.length >= 10) {
      badges.push({
        name: 'Active Creator',
        description: 'Created 10+ public repositories',
        icon: 'git-branch',
        color: 'green',
      });
    }
    if (profileData.followers >= 10) {
      badges.push({
        name: 'Networker',
        description: 'Followed by 10+ GitHub users',
        icon: 'users',
        color: 'indigo',
      });
    }

    // 5. Skill Extraction from repos (AI/Heuristic mapping)
    // Scan repo names, descriptions, and languages to infer framework/stack skills
    const skillKeywords = {
      'react': ['react', 'react.js', 'reactjs'],
      'vue': ['vue', 'vue.js', 'vuejs'],
      'angular': ['angular', 'angularjs'],
      'node': ['node', 'node.js', 'nodejs'],
      'express': ['express', 'expressjs'],
      'django': ['django'],
      'flask': ['flask'],
      'laravel': ['laravel'],
      'spring boot': ['spring boot', 'springboot', 'spring-boot'],
      'docker': ['docker', 'dockerfile'],
      'kubernetes': ['kubernetes', 'k8s'],
      'aws': ['aws', 'amazon web services'],
      'firebase': ['firebase'],
      'mongodb': ['mongodb', 'mongo'],
      'postgresql': ['postgresql', 'postgres'],
    };

    const extractedSkills = new Set();
    // Add programming languages themselves
    Object.keys(languagesMap).forEach(lang => {
      if (languagesMap[lang] >= 2) extractedSkills.add(lang); // At least 2 repos in that language
    });

    processedRepos.forEach((repo) => {
      const searchSpace = `${repo.name} ${repo.description}`.toLowerCase();
      Object.keys(skillKeywords).forEach((skill) => {
        const matches = skillKeywords[skill].some(kw => searchSpace.includes(kw));
        if (matches) {
          extractedSkills.add(skill.charAt(0).toUpperCase() + skill.slice(1));
        }
      });
    });

    // Merge extracted skills with existing user skills, keeping duplicates out
    const updatedSkills = Array.from(new Set([...user.skills, ...Array.from(extractedSkills)]));

    // Save stats to user model
    user.githubUsername = githubUsername;
    user.githubProfile = {
      name: profileData.name || profileData.login,
      username: profileData.login,
      avatarUrl: profileData.avatar_url,
      bio: profileData.bio || '',
      followers: profileData.followers,
      following: profileData.following,
      publicRepos: profileData.public_repos,
      location: profileData.location || '',
      company: profileData.company || '',
      blog: profileData.blog || '',
      githubUrl: profileData.html_url,
      createdAt: profileData.created_at,
    };
    user.githubStats = {
      totalStars,
      badges,
    };
    user.githubRepos = topRepos;
    user.githubLanguages = languagesPercentage;
    user.githubLastSync = new Date();
    
    // Automatically update skills with extracted GitHub skills
    user.skills = updatedSkills;

    const updatedUser = await user.save();

    // Update reputation asynchronously
    calculateReputation(updatedUser._id);

    res.status(200).json({
      success: true,
      message: 'GitHub profile synchronized successfully',
      user: {
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        bio: user.bio || profileData.bio || '',
        skills: user.skills,
        profilePicture: user.profilePicture || profileData.avatar_url,
        githubUsername: user.githubUsername,
        githubProfile: user.githubProfile,
        githubStats: user.githubStats,
        githubRepos: user.githubRepos,
        githubLanguages: user.githubLanguages,
        githubLastSync: user.githubLastSync,
        githubLink: profileData.html_url,
      }
    });
  } catch (error) {
    next(error);
  }
};
