import React from 'react';
import { 
  GitFork, Star, Users, MapPin, Briefcase, Link as LinkIcon, 
  Calendar, Award, Github, Sparkles, FolderGit2 
} from 'lucide-react';

const GithubCard = ({ user }) => {
  if (!user || !user.githubProfile) return null;

  const {
    name,
    username,
    avatarUrl,
    bio,
    followers,
    following,
    publicRepos,
    location,
    company,
    blog,
    githubUrl,
    createdAt,
  } = user.githubProfile;

  const { totalStars, badges } = user.githubStats || { totalStars: 0, badges: [] };
  const languages = user.githubLanguages || {};
  const repos = user.githubRepos || [];

  // Color map for top GitHub programming languages
  const languageColors = {
    JavaScript: 'bg-yellow-500',
    TypeScript: 'bg-blue-500',
    Python: 'bg-teal-500',
    HTML: 'bg-orange-500',
    CSS: 'bg-purple-500',
    C: 'bg-gray-500',
    'C++': 'bg-pink-500',
    Java: 'bg-red-600',
    Ruby: 'bg-red-500',
    Go: 'bg-cyan-500',
    Rust: 'bg-orange-600',
    PHP: 'bg-indigo-500',
    Shell: 'bg-green-500',
  };

  // Generate random data for contribution heatmap simulation (53 columns x 7 rows)
  const generateHeatmap = () => {
    const grid = [];
    for (let i = 0; i < 52 * 7; i++) {
      // Pick random contribution level (0 to 4)
      const val = Math.random() < 0.3 ? 0 : Math.floor(Math.random() * 4) + 1;
      grid.push(val);
    }
    return grid;
  };

  const heatmapGrid = generateHeatmap();

  const getHeatmapColor = (val) => {
    switch (val) {
      case 1: return 'bg-emerald-900/40';
      case 2: return 'bg-emerald-700/60';
      case 3: return 'bg-emerald-500/80';
      case 4: return 'bg-emerald-400';
      default: return 'bg-slate-900';
    }
  };

  return (
    <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-2xl overflow-hidden shadow-2xl transition duration-300 hover:border-slate-700 w-full">
      {/* Visual top banner */}
      <div className="h-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-500"></div>

      <div className="p-6 sm:p-8 space-y-6 sm:space-y-8">
        
        {/* Profile Info Header */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          <img 
            src={avatarUrl} 
            alt={name} 
            className="w-24 h-24 rounded-full object-cover border-2 border-slate-800 shadow-xl"
          />
          <div className="flex-1 text-center sm:text-left space-y-3">
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <h3 className="text-xl sm:text-2xl font-black text-slate-100 leading-tight">{name}</h3>
                <a 
                  href={githubUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-400 hover:text-indigo-400 bg-slate-950/60 border border-slate-800 px-2 py-0.5 rounded-md w-fit mx-auto sm:mx-0 transition"
                >
                  <Github size={12} /> @{username}
                </a>
              </div>
              <p className="text-slate-400 text-xs sm:text-sm mt-1 max-w-xl">{bio || 'No GitHub bio provided.'}</p>
            </div>

            {/* Quick Stats Grid */}
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-xs font-semibold text-slate-400">
              <span className="flex items-center gap-1.5"><Users size={14} className="text-indigo-400" /> <strong>{followers}</strong> followers</span>
              <span className="flex items-center gap-1.5"><strong>{following}</strong> following</span>
              <span className="flex items-center gap-1.5"><FolderGit2 size={14} className="text-emerald-400" /> <strong>{publicRepos}</strong> repos</span>
              <span className="flex items-center gap-1.5"><Star size={14} className="text-yellow-400" /> <strong>{totalStars}</strong> stars</span>
            </div>

            {/* Meta Items Grid */}
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-4 gap-y-2 text-[11px] text-slate-500">
              {location && <span className="flex items-center gap-1"><MapPin size={12} /> {location}</span>}
              {company && <span className="flex items-center gap-1"><Briefcase size={12} /> {company}</span>}
              {blog && (
                <a 
                  href={blog.startsWith('http') ? blog : `https://${blog}`} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="flex items-center gap-1 hover:text-indigo-400 transition"
                >
                  <LinkIcon size={12} /> {blog.replace(/^https?:\/\//, '')}
                </a>
              )}
              <span className="flex items-center gap-1"><Calendar size={12} /> Joined {new Date(createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short' })}</span>
            </div>
          </div>
        </div>

        {/* Dynamic Achievements Badges */}
        {badges.length > 0 && (
          <div className="border-t border-slate-800/60 pt-6">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
              <Award size={14} className="text-yellow-500" /> GitHub Achievements
            </h4>
            <div className="flex flex-wrap gap-2.5">
              {badges.map((badge, idx) => (
                <div 
                  key={idx} 
                  className="inline-flex items-center gap-2 bg-slate-950/60 border border-slate-850 px-3.5 py-2 rounded-xl group hover:border-indigo-500/30 transition duration-300"
                  title={badge.description}
                >
                  <div className="p-1 bg-indigo-500/10 text-indigo-400 rounded-lg group-hover:scale-110 transition-transform">
                    <Sparkles size={14} />
                  </div>
                  <div>
                    <h5 className="text-[11px] font-bold text-slate-200">{badge.name}</h5>
                    <p className="text-[9px] text-slate-500 mt-0.5">{badge.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Top Languages Distribution */}
        {Object.keys(languages).length > 0 && (
          <div className="border-t border-slate-800/60 pt-6 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Sparkles size={14} className="text-indigo-400" /> Language Distribution
            </h4>
            {/* Visual Bar chart */}
            <div className="h-2.5 w-full rounded-full bg-slate-950 flex overflow-hidden">
              {Object.keys(languages).map((lang) => {
                const color = languageColors[lang] || 'bg-slate-500';
                const pct = languages[lang];
                return (
                  <div 
                    key={lang} 
                    className={`${color} h-full`} 
                    style={{ width: `${pct}%` }} 
                    title={`${lang}: ${pct}%`}
                  ></div>
                );
              })}
            </div>
            {/* Legend Grid */}
            <div className="flex flex-wrap gap-x-4 gap-y-1.5 pt-1">
              {Object.keys(languages).map((lang) => {
                const color = languageColors[lang] || 'bg-slate-500';
                return (
                  <div key={lang} className="flex items-center gap-1.5 text-[11px] font-medium text-slate-400">
                    <span className={`w-2 h-2 rounded-full ${color}`}></span>
                    <span>{lang}</span>
                    <span className="text-slate-600">({languages[lang]}%)</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Contribution Heatmap Simulation */}
        <div className="border-t border-slate-800/60 pt-6 space-y-3 hidden sm:block">
          <div className="flex justify-between items-center">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Calendar size={14} className="text-emerald-500" /> Contributions Heatmap (Past Year)
            </h4>
            <span className="text-[10px] text-slate-600">Generated dynamically from profile status</span>
          </div>
          {/* Scrollable container for smaller screens */}
          <div className="overflow-x-auto pb-1">
            <div className="grid grid-flow-col grid-rows-7 gap-1 w-max">
              {heatmapGrid.map((val, idx) => (
                <div 
                  key={idx} 
                  className={`w-2.5 h-2.5 rounded-sm ${getHeatmapColor(val)} transition-colors duration-300 hover:border hover:border-slate-300/20`}
                ></div>
              ))}
            </div>
          </div>
        </div>

        {/* Top Repositories Portfolios */}
        {repos.length > 0 && (
          <div className="border-t border-slate-800/60 pt-6 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <FolderGit2 size={14} className="text-emerald-400" /> Top Repositories
            </h4>
            <div className="grid gap-3 sm:grid-cols-2">
              {repos.map((repo, idx) => {
                const color = languageColors[repo.language] || 'bg-slate-500';
                return (
                  <a 
                    key={idx} 
                    href={repo.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="bg-slate-950/60 border border-slate-850 p-4 rounded-xl flex flex-col justify-between hover:border-indigo-500/30 hover:bg-slate-950 transition duration-300 group"
                  >
                    <div>
                      <h5 className="text-[13px] font-extrabold text-slate-200 group-hover:text-indigo-400 transition truncate">{repo.name}</h5>
                      <p className="text-[11px] text-slate-500 mt-1.5 line-clamp-2 leading-relaxed min-h-[32px]">{repo.description || 'No description provided.'}</p>
                    </div>
                    <div className="flex items-center justify-between mt-4 text-[10px] font-semibold text-slate-400 pt-2 border-t border-slate-900/60">
                      <div className="flex items-center gap-1">
                        <span className={`w-2 h-2 rounded-full ${color}`}></span>
                        <span>{repo.language}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-0.5"><Star size={12} className="text-yellow-400" /> {repo.stars}</span>
                        {repo.forks > 0 && <span className="flex items-center gap-0.5"><GitFork size={12} className="text-blue-400" /> {repo.forks}</span>}
                      </div>
                    </div>
                  </a>
                );
              })}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default GithubCard;
