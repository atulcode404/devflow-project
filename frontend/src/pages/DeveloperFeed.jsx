import React, { useState, useEffect, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, Loader2, TrendingUp, Users, Bookmark, Code2, 
  MapPin, CheckCircle, Flame, Star, Activity, Briefcase, 
  Filter, X, Sparkles, ChevronRight, Check, Image as ImageIcon,
  MessageSquare, Layout, Github, ExternalLink, ThumbsUp, Send, Trophy, Plus, HelpCircle, BarChart2
} from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';
import PostCard from '../components/common/PostCard';

// Mock Data for Sidebars (to give a production-ready feel)
const SUGGESTED_ACTIONS = [
  { icon: <Code2 size={16} />, text: 'Add GitHub Link', complete: true },
  { icon: <Briefcase size={16} />, text: 'Update Experience', complete: false },
  { icon: <Users size={16} />, text: 'Follow 5 Developers', complete: false },
];

const TOP_CONTRIBUTORS = [
  { name: 'Sarah Jenkins', role: 'Full Stack', score: 2450 },
  { name: 'Alex Rivera', role: 'AI Engineer', score: 2120 },
  { name: 'Aman Sharma', role: 'Backend Dev', score: 1890 },
];

const TRENDING_TECH = [
  { name: 'React', count: '12.4k', trend: '+15%' },
  { name: 'Next.js', count: '8.2k', trend: '+22%' },
  { name: 'AI Agents', count: '5.1k', trend: '+45%' },
  { name: 'Python', count: '4.8k', trend: '+8%' },
  { name: 'TypeScript', count: '3.9k', trend: '+12%' },
];

const RECENT_ACTIVITY = [
  { user: 'Rahul', action: 'published a new project', time: '2m ago' },
  { user: 'Priya', action: 'asked a question about React', time: '1h ago' },
  { user: 'Ankit', action: 'uploaded portfolio', time: '5h ago' },
];

const DeveloperFeed = () => {
  const { user: currentUser } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);
  
  // Post Feed State
  const [posts, setPosts] = useState([]);
  
  // Real-time Stats State
  const [stats, setStats] = useState({
    activeDevelopers: '12.5K+',
    projectsShared: '4,832',
    discussions: '24.1K',
    trendingSkills: 'React & AI'
  });
  
  // Create Post State
  const [postType, setPostType] = useState('Update'); // Update, Project, Question, Poll
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('');
  const [projectLink, setProjectLink] = useState('');
  const [liveDemoLink, setLiveDemoLink] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchPosts();
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await api.get('/feed/stats');
      if (res.data && res.data.success) {
        const { activeDevelopers, projectsShared, discussions, trendingSkills } = res.data.data;
        
        // Format numbers for clean display
        const formatNum = (num) => {
          if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
          return num;
        };

        setStats({
          activeDevelopers: formatNum(activeDevelopers),
          projectsShared: formatNum(projectsShared),
          discussions: formatNum(discussions),
          trendingSkills: trendingSkills || 'React & AI'
        });
      }
    } catch (err) {
      console.error('Error fetching feed stats:', err);
    }
  };

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const res = await api.get('/posts');
      setPosts(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handlePostUpdate = (updatedPost) => {
    setPosts(posts.map(p => p._id === updatedPost._id ? updatedPost : p));
  };

  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!content.trim() && postType !== 'Project') return;

    try {
      setIsSubmitting(true);
      const payload = {
        postType,
        content,
        title: postType !== 'Update' ? title : '',
        projectLink: postType === 'Project' ? projectLink : '',
        liveDemoLink: postType === 'Project' ? liveDemoLink : '',
      };
      const res = await api.post('/posts', payload);
      setPosts([res.data, ...posts]);
      
      // Reset
      setContent('');
      setTitle('');
      setProjectLink('');
      setLiveDemoLink('');
      setPostType('Update');
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const profileCompletion = currentUser ? 
    Math.round(
      ((currentUser.profilePicture !== 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png' ? 1 : 0) + 
      (currentUser.bio ? 1 : 0) + 
      (currentUser.skills?.length > 0 ? 1 : 0) + 
      (currentUser.githubUsername ? 1 : 0) + 
      (currentUser.experience?.length > 0 ? 1 : 0)) / 5 * 100
    ) : 0;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-12 pt-6 font-sans selection:bg-indigo-500/30">
      
      {/* Background glow effects */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/10 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/10 rounded-full blur-[120px]"></div>
      </div>

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* =========================================
            HERO SECTION & STATS
        ============================================= */}
        <div className="mb-8 space-y-6">
          <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800/60 rounded-3xl p-8 lg:p-12 text-center relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-indigo-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
            
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="relative z-10 max-w-3xl mx-auto">
              <h1 className="text-4xl md:text-5xl font-black mb-4 text-transparent bg-clip-text bg-gradient-to-r from-white via-indigo-200 to-slate-400">
                Discover what developers are building
              </h1>
              <p className="text-slate-400 text-lg md:text-xl mb-8">
                Explore cutting-edge projects, engage in technical discussions, and connect with top engineering talent worldwide.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <button 
                  onClick={() => { document.getElementById('create-post-section')?.scrollIntoView({ behavior: 'smooth' }) }}
                  className="px-8 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold transition-all shadow-[0_0_20px_rgba(79,70,229,0.3)] hover:shadow-[0_0_25px_rgba(79,70,229,0.5)] hover:-translate-y-0.5 flex items-center gap-2"
                >
                  <Briefcase size={18} /> Share Project
                </button>
                <Link to="/network" className="px-8 py-3.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-bold transition-all border border-slate-700 hover:border-slate-600 flex items-center gap-2">
                  <Users size={18} /> Explore Developers
                </Link>
              </div>
            </motion.div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Active Developers', value: stats.activeDevelopers, icon: Users, color: 'text-blue-400', bg: 'bg-blue-500/10' },
              { label: 'Projects Shared', value: stats.projectsShared, icon: Briefcase, color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
              { label: 'Discussions', value: stats.discussions, icon: MessageSquare, color: 'text-purple-400', bg: 'bg-purple-500/10' },
              { label: 'Trending Skills', value: stats.trendingSkills, icon: TrendingUp, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
            ].map((stat, idx) => (
              <motion.div 
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 * idx }}
                key={idx} className="bg-slate-900/50 backdrop-blur-md border border-slate-800/80 rounded-2xl p-5 flex items-center gap-4 hover:bg-slate-800/50 transition-colors"
              >
                <div className={`p-3 rounded-xl ${stat.bg} ${stat.color}`}>
                  <stat.icon size={24} />
                </div>
                <div>
                  <p className="text-2xl font-black text-slate-100">{stat.value}</p>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{stat.label}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6 justify-center">
          
          {/* =========================================
              LEFT SIDEBAR 
          ============================================= */}
          <div className="hidden lg:flex flex-col w-[280px] flex-shrink-0 space-y-6">
            
            {currentUser && (
              <motion.div 
                initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                className="bg-slate-900/60 backdrop-blur-xl border border-white/5 rounded-2xl shadow-2xl overflow-hidden group hover:border-white/10 transition-colors duration-300 relative"
              >
                <div className="h-24 bg-gradient-to-r from-indigo-600/80 to-purple-600/80 relative overflow-hidden">
                  <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20"></div>
                  {currentUser.backgroundPicture && (
                    <img src={currentUser.backgroundPicture} alt="Cover" className="w-full h-full object-cover mix-blend-overlay" />
                  )}
                </div>
                <div className="px-5 pb-5 relative flex flex-col items-center -mt-12">
                  <Link to="/profile">
                    <img 
                      src={currentUser.profilePicture} 
                      alt={currentUser.fullName} 
                      className="w-24 h-24 rounded-2xl border-4 border-slate-900 object-cover bg-slate-800 mb-3 group-hover:scale-105 transition-transform duration-500 shadow-xl shadow-indigo-950/50"
                    />
                  </Link>
                  <Link to="/profile" className="hover:text-indigo-400 transition text-center">
                    <h3 className="text-lg font-bold text-slate-100 leading-tight">{currentUser.fullName}</h3>
                  </Link>
                  <p className="text-sm text-slate-400 text-center mb-1 font-medium">{currentUser.headline || currentUser.role || 'Developer'}</p>
                  
                  <div className="w-full mt-4 bg-slate-950/50 rounded-xl p-4 border border-slate-800/80">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs font-bold text-slate-400">Profile Completion</span>
                      <span className="text-xs font-bold text-indigo-400">{profileCompletion}%</span>
                    </div>
                    <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full" style={{ width: `${profileCompletion}%` }}></div>
                    </div>
                  </div>
                  
                  <div className="w-full border-t border-slate-800/80 mt-5 pt-5 flex flex-col gap-3 text-sm">
                    <div className="flex justify-between items-center hover:bg-slate-800/50 p-2 -mx-2 rounded-lg transition cursor-pointer group/stat">
                      <span className="text-slate-400 font-medium group-hover/stat:text-slate-300">Connections</span>
                      <span className="text-indigo-400 font-bold group-hover/stat:text-indigo-300">{currentUser.following?.length || 0}</span>
                    </div>
                    <div className="flex justify-between items-center hover:bg-slate-800/50 p-2 -mx-2 rounded-lg transition cursor-pointer group/stat">
                      <span className="text-slate-400 font-medium group-hover/stat:text-slate-300">Profile Views</span>
                      <span className="text-indigo-400 font-bold group-hover/stat:text-indigo-300">{currentUser.profileViews || 0}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Suggested Actions */}
            <motion.div 
              initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}
              className="bg-slate-900/60 backdrop-blur-xl border border-white/5 rounded-2xl shadow-xl p-5 hover:border-white/10 transition-colors"
            >
              <h3 className="font-bold text-slate-100 text-sm mb-4">Suggested Actions</h3>
              <div className="space-y-3">
                {SUGGESTED_ACTIONS.map((action, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-2 hover:bg-slate-800/50 rounded-xl transition cursor-pointer group">
                    <div className={`p-2 rounded-lg ${action.complete ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-800 text-slate-400 group-hover:text-indigo-400 group-hover:bg-indigo-500/10'}`}>
                      {action.complete ? <Check size={16} /> : action.icon}
                    </div>
                    <span className={`text-sm font-medium ${action.complete ? 'text-slate-500 line-through' : 'text-slate-300 group-hover:text-white transition'}`}>
                      {action.text}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>

          </div>

          {/* =========================================
              MIDDLE COLUMN (Post Feed)
          ============================================= */}
          <div className="flex-1 max-w-[700px] w-full mx-auto space-y-6">
            
            {/* Create Post Box */}
            {currentUser && (
              <motion.div 
                id="create-post-section"
                initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
                className="bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden hover:border-white/20 transition-all duration-300 relative"
              >
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500"></div>
                
                <div className="p-4 border-b border-slate-800/80 bg-slate-950/30 flex gap-1 overflow-x-auto">
                  {['Update', 'Project', 'Question', 'Poll'].map(type => (
                    <button 
                      key={type}
                      onClick={() => setPostType(type)}
                      className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors whitespace-nowrap ${
                        postType === type 
                          ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30' 
                          : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                      }`}
                    >
                      {type === 'Update' && <MessageSquare size={16} />}
                      {type === 'Project' && <Briefcase size={16} />}
                      {type === 'Question' && <HelpCircle size={16} />}
                      {type === 'Poll' && <BarChart2 size={16} />}
                      {type}
                    </button>
                  ))}
                </div>

                <div className="p-5">
                  <div className="flex gap-4 mb-4">
                    <img 
                      src={currentUser.profilePicture} 
                      alt="Profile" 
                      className="w-12 h-12 rounded-xl border border-slate-800 object-cover shadow-md"
                    />
                    <form onSubmit={handleCreatePost} className="flex-1 flex flex-col gap-3">
                      
                      {postType !== 'Update' && (
                        <input 
                          type="text"
                          value={title}
                          onChange={(e) => setTitle(e.target.value)}
                          placeholder={postType === 'Project' ? "Project Title" : postType === 'Question' ? "What's your question?" : "Poll Title"}
                          className="w-full bg-slate-950/50 border border-slate-800 rounded-xl p-3 text-sm text-slate-100 focus:outline-none focus:border-indigo-500 transition-colors placeholder:text-slate-500 font-semibold"
                          required
                        />
                      )}

                      <textarea 
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder={postType === 'Project' ? "Describe your project, tech stack, and what you learned..." : "What's on your mind?"}
                        className="w-full bg-slate-950/50 border border-slate-800 rounded-xl p-4 text-sm text-slate-100 focus:outline-none focus:border-indigo-500 min-h-[100px] resize-none transition-colors placeholder:text-slate-500"
                        maxLength={2000}
                        required={postType === 'Update'}
                      />
                      
                      <AnimatePresence>
                        {postType === 'Project' && (
                          <motion.div 
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="flex flex-col sm:flex-row gap-3 overflow-hidden"
                          >
                            <div className="flex-1 relative">
                              <Github size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                              <input 
                                type="url"
                                value={projectLink}
                                onChange={(e) => setProjectLink(e.target.value)}
                                placeholder="GitHub Repository URL"
                                className="w-full bg-slate-950/50 border border-slate-800 rounded-xl py-2.5 pl-10 pr-3 text-sm text-slate-100 focus:outline-none focus:border-indigo-500 transition-colors placeholder:text-slate-500"
                              />
                            </div>
                            <div className="flex-1 relative">
                              <ExternalLink size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                              <input 
                                type="url"
                                value={liveDemoLink}
                                onChange={(e) => setLiveDemoLink(e.target.value)}
                                placeholder="Live Demo URL"
                                className="w-full bg-slate-950/50 border border-slate-800 rounded-xl py-2.5 pl-10 pr-3 text-sm text-slate-100 focus:outline-none focus:border-indigo-500 transition-colors placeholder:text-slate-500"
                              />
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      <div className="flex justify-between items-center pt-2 mt-1 border-t border-slate-800/50">
                        <div className="flex gap-1">
                          <button type="button" className="p-2.5 text-slate-400 hover:bg-indigo-500/10 hover:text-indigo-400 rounded-lg transition" title="Add Image">
                            <ImageIcon size={18} />
                          </button>
                          <button type="button" className="p-2.5 text-slate-400 hover:bg-purple-500/10 hover:text-purple-400 rounded-lg transition" title="Add Code Snippet">
                            <Code2 size={18} />
                          </button>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-xs text-slate-500 font-medium hidden sm:inline">
                            {content.length} / 2000
                          </span>
                          <button 
                            type="submit" 
                            disabled={(postType === 'Update' && !content.trim()) || isSubmitting}
                            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-bold transition disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-indigo-950/40"
                          >
                            {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <><Send size={16}/> Post</>}
                          </button>
                        </div>
                      </div>
                    </form>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Feed Posts */}
            <div className="min-h-[500px]">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-20 space-y-4">
                  <Loader2 size={40} className="text-indigo-500 animate-spin" />
                  <p className="text-slate-400 font-bold animate-pulse">Loading amazing projects...</p>
                </div>
              ) : posts.length > 0 ? (
                <div className="space-y-6">
                  {posts.map((post) => (
                    <PostCard 
                      key={post._id} 
                      post={post} 
                      currentUser={currentUser} 
                      onPostUpdate={handlePostUpdate} 
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-24 bg-slate-900/40 backdrop-blur-md border border-slate-800/80 rounded-3xl shadow-xl mt-4">
                  <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                    <Briefcase size={32} className="text-slate-500" />
                  </div>
                  <h3 className="text-2xl font-black text-slate-200 mb-2">No posts yet</h3>
                  <p className="text-slate-400 text-base mb-8 max-w-sm mx-auto">Share your first project, ask a question, or post an update to start engaging with the community!</p>
                  <button 
                    onClick={() => { document.getElementById('create-post-section')?.scrollIntoView({ behavior: 'smooth' }) }}
                    className="px-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold transition shadow-lg shadow-indigo-900/40"
                  >
                    Create Post
                  </button>
                </div>
              )}
            </div>
          </div>
          
          {/* =========================================
              RIGHT SIDEBAR (Trending, Projects, Activity)
          ============================================= */}
          <div className="hidden xl:flex flex-col w-[320px] flex-shrink-0 space-y-6">
            
            {/* 1. Trending Technologies */}
            <motion.div 
              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
              className="bg-slate-900/60 backdrop-blur-xl border border-white/5 rounded-2xl shadow-xl p-6 hover:border-white/10 transition-colors"
            >
              <h3 className="font-bold text-slate-100 flex items-center gap-2 mb-5 text-sm uppercase tracking-wider">
                <Flame size={16} className="text-orange-500" /> Trending Skills
              </h3>
              <div className="space-y-4">
                {TRENDING_TECH.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center group cursor-pointer">
                    <div>
                      <p className="text-sm font-bold text-slate-200 group-hover:text-indigo-400 transition">{item.name}</p>
                      <p className="text-[11px] text-slate-500 font-medium mt-0.5">{item.count} projects</p>
                    </div>
                    <div className="bg-emerald-500/10 text-emerald-400 px-2 py-1 rounded text-[10px] font-bold border border-emerald-500/20">
                      {item.trend}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
            
            {/* 2. Top Contributors */}
            <motion.div 
              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}
              className="bg-slate-900/60 backdrop-blur-xl border border-white/5 rounded-2xl shadow-xl p-6 hover:border-white/10 transition-colors"
            >
              <h3 className="font-bold text-slate-100 flex items-center gap-2 mb-5 text-sm uppercase tracking-wider">
                <Trophy size={16} className="text-yellow-500" /> Top Contributors
              </h3>
              <div className="space-y-5">
                {TOP_CONTRIBUTORS.map((user, idx) => (
                  <div key={idx} className="cursor-pointer group flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center shrink-0 border border-slate-700 shadow-sm text-sm font-bold text-slate-400">
                        {user.name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-200 group-hover:text-indigo-400 transition leading-tight truncate max-w-[120px]">{user.name}</p>
                        <p className="text-[11px] text-slate-500 mt-0.5">{user.role}</p>
                      </div>
                    </div>
                    <div className="text-xs font-black text-indigo-400 bg-indigo-500/10 px-2 py-1 rounded-md">
                      {user.score}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* 3. Recent Activity */}
            <motion.div 
              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}
              className="bg-slate-900/60 backdrop-blur-xl border border-white/5 rounded-2xl shadow-xl p-6 relative overflow-hidden hover:border-white/10 transition-colors"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-bl-full pointer-events-none"></div>
              <h3 className="font-bold text-slate-100 flex items-center gap-2 mb-5 text-sm uppercase tracking-wider relative z-10">
                <Activity size={16} className="text-indigo-400" /> Recent Activity
              </h3>
              <div className="space-y-5 relative z-10">
                {RECENT_ACTIVITY.map((act, idx) => (
                  <div key={idx} className="flex gap-3">
                    <div className="mt-1">
                      <div className="w-2.5 h-2.5 rounded-full bg-indigo-500/50 border border-indigo-400/50 relative shadow-[0_0_8px_rgba(99,102,241,0.5)]">
                        {idx !== RECENT_ACTIVITY.length -1 && (
                          <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-px h-[38px] bg-slate-800/80"></div>
                        )}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        <span className="font-bold text-slate-100">{act.user}</span> {act.action}
                      </p>
                      <p className="text-[10px] text-slate-500 font-medium mt-1">{act.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

          </div>

        </div>
      </div>
    </div>
  );
};

export default DeveloperFeed;
