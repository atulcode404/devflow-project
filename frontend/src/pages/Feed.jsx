import React, { useState, useEffect, useContext } from 'react';
import api, { SOCKET_URL } from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { UserPlus, Code, Check, Search, Sparkles, Loader2, Award, FolderGit2, Github } from 'lucide-react';
import { io } from 'socket.io-client';
import CreatePostModal from '../components/CreatePostModal';
import PostCard from '../components/PostCard';
import RecommendationCard from '../components/RecommendationCard';

const Feed = () => {
  const [developers, setDevelopers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [skillFilter, setSkillFilter] = useState('');
  const { user } = useContext(AuthContext);
  const [sentRequests, setSentRequests] = useState(new Set());
  const [connectingId, setConnectingId] = useState(null);

  const [activeTab, setActiveTab] = useState('developers');
  const [posts, setPosts] = useState([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const [projectTypeFilter, setProjectTypeFilter] = useState('');
  const [projectStatusFilter, setProjectStatusFilter] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Recommendations state
  const [recommendations, setRecommendations] = useState([]);
  const [recommendationsLoading, setRecommendationsLoading] = useState(false);

  useEffect(() => {
    if (activeTab === 'developers') {
      fetchFeed();
    } else if (activeTab === 'projects') {
      fetchPosts();
    } else if (activeTab === 'recommended') {
      fetchRecommendations();
    }
    
    // Setup socket listener for real-time updates
    const socket = io(SOCKET_URL, {
      withCredentials: true,
    });
    
    if (user) {
      socket.emit('join', user._id);
    }
    
    return () => {
      socket.disconnect();
    };
  }, [user, skillFilter, activeTab, projectTypeFilter, projectStatusFilter]);

  const fetchPosts = async () => {
    try {
      setPostsLoading(true);
      let queryParams = [];
      if (projectTypeFilter) queryParams.push(`projectType=${projectTypeFilter}`);
      if (projectStatusFilter) queryParams.push(`status=${projectStatusFilter}`);
      if (skillFilter) queryParams.push(`skill=${skillFilter}`);

      const queryString = queryParams.length > 0 ? `?${queryParams.join('&')}` : '';
      const res = await api.get(`/posts${queryString}`);
      setPosts(res.data);
    } catch (error) {
      console.error('Error fetching posts', error);
    } finally {
      setPostsLoading(false);
    }
  };

  const fetchFeed = async () => {
    try {
      setLoading(true);
      const url = skillFilter ? `/feed?skill=${skillFilter}` : '/feed';
      const res = await api.get(url);
      setDevelopers(res.data.data);
    } catch (error) {
      console.error('Error fetching feed', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecommendations = async () => {
    try {
      setRecommendationsLoading(true);
      const res = await api.get('/recommend/projects');
      setRecommendations(res.data);
    } catch (error) {
      console.error('Error fetching recommendations', error);
    } finally {
      setRecommendationsLoading(false);
    }
  };

  const handleConnect = async (receiverId) => {
    try {
      setConnectingId(receiverId);
      await api.post(`/connections/send/${receiverId}`);
      // Optimistically update UI
      setSentRequests(new Set([...sentRequests, receiverId]));
    } catch (error) {
      alert(error.response?.data?.message || 'Error sending request');
    } finally {
      setConnectingId(null);
    }
  };

  // Helper to determine match badge colors
  const getMatchScoreBadge = (score) => {
    if (score >= 70) {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-green-500/10 text-green-400 border border-green-500/25 px-2 py-0.5 rounded-full shadow shadow-green-950/20">
          <Award size={12} /> Elite Match ({score}%)
        </span>
      );
    } else if (score >= 40) {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/25 px-2 py-0.5 rounded-full shadow shadow-indigo-950/20">
          <Sparkles size={12} /> Good Match ({score}%)
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-medium bg-slate-800 text-slate-400 border border-slate-700 px-2 py-0.5 rounded-full">
        Standard Match ({score}%)
      </span>
    );
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-950 text-slate-100 py-10 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-10 left-10 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl"></div>
      <div className="absolute bottom-20 right-20 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl"></div>

      <div className="max-w-5xl mx-auto relative z-10 space-y-8">
        
        {/* Page Header and Search Input */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-900 pb-8">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-100 flex items-center gap-2">
              {activeTab === 'developers' && 'Developer Feed'}
              {activeTab === 'projects' && 'Project Collaborations'}
              {activeTab === 'recommended' && 'AI Recommendations'}
            </h1>
            <p className="text-slate-400 text-sm mt-1.5">
              {activeTab === 'developers' 
                ? 'Explore and network with developers matched based on matching skillsets.'
                : activeTab === 'projects'
                  ? 'Browse project collaboration posts or find partners to build your startup ideas.'
                  : 'AI-curated projects tailored to your skills, experience, and interests.'}
            </p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            {/* Skill Filter Box */}
            <div className="relative max-w-sm w-full md:w-64">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                <Search size={16} />
              </span>
              <input
                type="text"
                placeholder={activeTab === 'developers' ? "Filter by skill (e.g. React, Node)..." : "Filter by required skill..."}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-slate-100 text-sm transition placeholder-slate-500"
                value={skillFilter}
                onChange={(e) => setSkillFilter(e.target.value)}
              />
            </div>

            {/* Create Post Button */}
            {activeTab === 'projects' && user && (
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition shadow-lg shadow-indigo-950/30 cursor-pointer w-full md:w-auto justify-center"
              >
                <Sparkles size={13} /> Create Post
              </button>
            )}
          </div>
        </div>

        {/* Tab Toggle Navigation */}
        <div className="flex bg-slate-900 border border-slate-800 rounded-xl p-1 w-full md:w-max">
          <button
            onClick={() => setActiveTab('developers')}
            className={`flex-1 md:flex-none px-6 py-2.5 rounded-lg text-sm font-semibold transition ${
              activeTab === 'developers' 
                ? 'bg-slate-800 text-white shadow-sm' 
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            Find Developers
          </button>
          <button
            onClick={() => setActiveTab('projects')}
            className={`flex-1 md:flex-none px-6 py-2.5 rounded-lg text-sm font-semibold transition ${
              activeTab === 'projects' 
                ? 'bg-slate-800 text-white shadow-sm' 
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            All Projects
          </button>
          <button
            onClick={() => setActiveTab('recommended')}
            className={`flex-1 md:flex-none px-6 py-2.5 rounded-lg text-sm font-semibold transition flex items-center justify-center gap-2 ${
              activeTab === 'recommended' 
                ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-950/50' 
                : 'text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10'
            }`}
          >
            <Sparkles size={14} /> AI Recommended
          </button>
        </div>

        {/* Projects Filter Bar (Rendered only on projects tab) */}
        {activeTab === 'projects' && (
          <div className="flex flex-wrap items-center gap-4 bg-slate-900/30 border border-slate-850 p-4 rounded-2xl">
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Project Type:</span>
              <select
                value={projectTypeFilter}
                onChange={(e) => setProjectTypeFilter(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none"
              >
                <option value="">All Types</option>
                <option value="Startup">Startup Idea</option>
                <option value="Hackathon">Hackathon</option>
                <option value="Open Source">Open Source</option>
                <option value="Side Project">Side Project</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Status:</span>
              <select
                value={projectStatusFilter}
                onChange={(e) => setProjectStatusFilter(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none"
              >
                <option value="">All Statuses</option>
                <option value="open">Open</option>
                <option value="closed">Closed</option>
              </select>
            </div>
          </div>
        )}

        {/* Main Grid Content Area */}
        {activeTab === 'developers' ? (
          /* Developer Grid Content */
          loading ? (
            <div className="flex flex-col justify-center items-center h-80 space-y-3">
              <Loader2 className="animate-spin h-10 w-10 text-indigo-500" />
              <p className="text-slate-500 text-xs animate-pulse">Scanning developers...</p>
            </div>
          ) : developers.length === 0 ? (
            <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-16 text-center max-w-md mx-auto space-y-4">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-slate-950 border border-slate-855 rounded-xl text-slate-500">
                <Code size={24} />
              </div>
              <h3 className="text-lg font-bold text-slate-200">No Developers Found</h3>
              <p className="text-slate-400 text-xs max-w-xs mx-auto">
                There are no matching developers for this filter. Try adjusting your search query or check back later!
              </p>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {developers.map((dev) => (
                <div 
                  key={dev._id} 
                  className="bg-slate-900/30 border border-slate-850 hover:border-slate-700/80 rounded-2xl p-6 flex flex-col justify-between transition duration-300 hover:shadow-xl hover:shadow-indigo-950/10 hover:-translate-y-0.5 relative group"
                >
                  {/* Header Information */}
                  <div>
                    <div className="flex items-start gap-4">
                      <img 
                        src={dev.profilePicture} 
                        alt={dev.fullName} 
                        className="w-14 h-14 rounded-full object-cover border-2 border-slate-800 group-hover:border-indigo-500/50 transition-colors duration-300" 
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h3 className="text-base font-bold text-slate-100 truncate">{dev.fullName}</h3>
                          {dev.githubProfile && (
                            <a 
                              href={dev.githubProfile.githubUrl} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-slate-500 hover:text-indigo-400 transition"
                              title={`GitHub: @${dev.githubProfile.username}`}
                            >
                              <Github size={14} />
                            </a>
                          )}
                        </div>
                        <div className="mt-1">
                          {getMatchScoreBadge(dev.matchScore)}
                        </div>
                      </div>
                    </div>
                    
                    {/* Bio block */}
                    <p className="mt-4 text-slate-400 text-xs leading-relaxed line-clamp-3 min-h-[54px]">
                      {dev.bio || 'This developer hasn\'t written a bio yet.'}
                    </p>
  
                    {/* GitHub Languages Distribution */}
                    {dev.githubLanguages && Object.keys(dev.githubLanguages).length > 0 && (
                      <div className="mt-3 flex items-center gap-1.5">
                        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Top Tech:</span>
                        <div className="flex flex-wrap gap-1">
                          {Object.keys(dev.githubLanguages).slice(0, 3).map((lang) => (
                            <span 
                              key={lang} 
                              className="text-[9px] bg-indigo-950/20 text-indigo-400 border border-indigo-900/30 px-1.5 py-0.5 rounded font-semibold"
                            >
                              {lang} ({dev.githubLanguages[lang]}%)
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
  
                    {/* Skills Grid */}
                    <div className="mt-4 flex flex-wrap gap-1.5">
                      {(() => {
                        const currentUserSkillsLower = new Set(user?.skills?.map(s => s.toLowerCase()) || []);
                        const sortedSkills = [...dev.skills].sort((a, b) => {
                          const aMatch = currentUserSkillsLower.has(a.toLowerCase());
                          const bMatch = currentUserSkillsLower.has(b.toLowerCase());
                          if (aMatch && !bMatch) return -1;
                          if (!aMatch && bMatch) return 1;
                          return 0;
                        });
  
                        return (
                          <>
                            {sortedSkills.slice(0, 3).map((skill, index) => {
                              const isMatch = currentUserSkillsLower.has(skill.toLowerCase());
                              return (
                                <span 
                                  key={index} 
                                  className={`px-2.5 py-0.5 border text-[10px] rounded-lg font-medium transition ${
                                    isMatch 
                                      ? 'bg-indigo-950/40 border-indigo-500/30 text-indigo-300' 
                                      : 'bg-slate-950 border-slate-850/80 text-slate-300'
                                  }`}
                                >
                                  {skill}{isMatch ? ` (${dev.matchScore}% match)` : ''}
                                </span>
                              );
                            })}
                            {sortedSkills.length > 3 && (
                              <span className="px-2.5 py-0.5 bg-slate-950 border border-slate-850 text-slate-500 text-[10px] rounded-lg font-medium">
                                +{sortedSkills.length - 3} more
                              </span>
                            )}
                          </>
                        );
                      })()}
                    </div>
                  </div>
                  
                  {/* Action button */}
                  <div className="mt-6 pt-4 border-t border-slate-850/60">
                    {sentRequests.has(dev._id) ? (
                      <button 
                        disabled 
                        className="w-full py-2 bg-green-500/10 border border-green-500/25 text-green-400 rounded-xl flex items-center justify-center gap-1.5 text-xs font-semibold"
                      >
                        <Check size={14} /> Request Sent
                      </button>
                    ) : (
                      <button 
                        onClick={() => handleConnect(dev._id)}
                        disabled={connectingId === dev._id}
                        className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl flex items-center justify-center gap-1.5 transition text-xs font-semibold shadow-md shadow-indigo-950/20 disabled:opacity-50"
                      >
                        {connectingId === dev._id ? (
                          <Loader2 className="animate-spin h-3.5 w-3.5" />
                        ) : (
                          <>
                            <UserPlus size={14} /> Connect
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )
        ) : activeTab === 'projects' ? (
          /* Projects Grid Content */
          postsLoading ? (
            <div className="flex flex-col justify-center items-center h-80 space-y-3">
              <Loader2 className="animate-spin h-10 w-10 text-indigo-500" />
              <p className="text-slate-500 text-xs animate-pulse">Scanning projects...</p>
            </div>
          ) : posts.length === 0 ? (
            <div className="bg-slate-900/40 border border-slate-855 rounded-2xl p-16 text-center max-w-md mx-auto space-y-4">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-slate-950 border border-slate-855 rounded-xl text-slate-500">
                <FolderGit2 size={24} />
              </div>
              <h3 className="text-lg font-bold text-slate-200">No Projects Found</h3>
              <p className="text-slate-400 text-xs max-w-xs mx-auto">
                There are no collaboration posts matching your filters right now. Why not write one yourself?
              </p>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2">
              {posts.map((post) => (
                <PostCard 
                  key={post._id} 
                  post={post} 
                  onPostDeleted={(id) => setPosts(posts.filter(p => p._id !== id))}
                />
              ))}
            </div>
          )
        ) : (
          /* Recommended Grid Content */
          recommendationsLoading ? (
            <div className="flex flex-col justify-center items-center h-80 space-y-3">
              <Loader2 className="animate-spin h-10 w-10 text-indigo-500" />
              <p className="text-slate-500 text-xs animate-pulse">Analyzing profiles and matching projects...</p>
            </div>
          ) : recommendations.length === 0 ? (
            <div className="bg-slate-900/40 border border-slate-855 rounded-2xl p-16 text-center max-w-md mx-auto space-y-4">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-slate-950 border border-slate-855 rounded-xl text-indigo-500 shadow-inner shadow-indigo-950/50">
                <Sparkles size={24} />
              </div>
              <h3 className="text-lg font-bold text-slate-200">No Recommendations Yet</h3>
              <p className="text-slate-400 text-xs max-w-xs mx-auto">
                Update your profile with more skills and sync your GitHub to get AI-powered project recommendations.
              </p>
            </div>
          ) : (
            <div className="grid gap-6 lg:grid-cols-2">
              {recommendations.map((rec, idx) => (
                <RecommendationCard 
                  key={idx} 
                  recommendation={rec} 
                />
              ))}
            </div>
          )
        )}
      </div>

      {/* Collaboration Creation Modal */}
      <CreatePostModal 
        isOpen={isCreateModalOpen} 
        onClose={() => setIsCreateModalOpen(false)} 
        onPostCreated={(newPost) => setPosts([newPost, ...posts])}
      />
    </div>
  );
};

export default Feed;
