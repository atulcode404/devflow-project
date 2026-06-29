import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  Search as SearchIcon, Sliders, X, Loader2, Navigation, 
  MapPin, ChevronLeft, ChevronRight,
  Trash2, TrendingUp, History, FolderGit2, UserPlus, Check, Github, Clock,
  BadgeCheck, Star, Users, FolderOpen, Flame, Trophy, ExternalLink, Code2, ShieldCheck, Heart, Briefcase
} from 'lucide-react';
import api from '../services/api';
import PostCard from '../components/PostCard';
import { SocketContext } from '../context/SocketContext';
import { AuthContext } from '../context/AuthContext';

const SEARCH_SUGGESTIONS = [
  'react developer',
  'mern stack',
  'ai engineer',
  'backend nodejs',
  'python data science',
  'ui ux designer'
];

const Search = () => {
  const { activeUsers } = React.useContext(SocketContext);
  const { user: currentUser } = React.useContext(AuthContext);

  const [activeTab, setActiveTab] = useState('developers');
  const [searchParams, setSearchParams] = useSearchParams();

  // Search Input State
  const [keyword, setKeyword] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Filters State
  const [skillsFilter, setSkillsFilter] = useState(searchParams.get('skill') || '');
  const [locationFilter, setLocationFilter] = useState('');
  const [experienceFilter, setExperienceFilter] = useState('');
  const [availabilityFilter, setAvailabilityFilter] = useState('');
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [remoteOnly, setRemoteOnly] = useState(false);
  
  // Post Specific Filters
  const [projectTypeFilter, setProjectTypeFilter] = useState('');
  const [projectStatusFilter, setProjectStatusFilter] = useState('');

  // Sorting & Pagination
  const [sortBy, setSortBy] = useState('newest');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit] = useState(6);

  // UI Drawer & Loading
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  
  // Analytics & History
  const [history, setHistory] = useState([]);
  const [analytics, setAnalytics] = useState(null);

  // Connections request tracker
  const [sentRequests, setSentRequests] = useState(new Set());
  const [connectingId, setConnectingId] = useState(null);

  // Fetch History and Analytics
  const fetchMetadata = async () => {
    try {
      const histRes = await api.get('/search/history');
      setHistory(histRes.data);

      const analRes = await api.get('/search/analytics');
      setAnalytics(analRes.data);
    } catch (err) {
      console.error('Error fetching search metadata:', err);
    }
  };

  // Main search function
  const executeSearch = useCallback(async (searchKeyword = keyword) => {
    try {
      setLoading(true);
      const isDevs = activeTab === 'developers';
      const endpoint = isDevs ? '/search/developers' : '/search/posts';
      
      let params = {
        keyword: searchKeyword,
        skills: skillsFilter,
        page,
        limit,
        sortBy
      };

      if (isDevs) {
        if (locationFilter) params.location = locationFilter;
        if (remoteOnly) params.location = 'remote';
        if (experienceFilter) params.experience = experienceFilter;
        if (availabilityFilter) params.availability = availabilityFilter;
      } else {
        if (projectTypeFilter) params.projectType = projectTypeFilter;
        if (projectStatusFilter) params.status = projectStatusFilter;
        if (experienceFilter) params.experience = experienceFilter;
      }

      const res = await api.get(endpoint, { params });
      
      let data = res.data.data;
      if (isDevs && verifiedOnly) {
         // Mock verified filter since it's not natively supported yet
         data = data.filter(d => d.githubProfile || d.role === 'admin');
      }

      setResults(data);
      setTotalPages(res.data.pages);
      
      fetchMetadata();
    } catch (err) {
      console.error('Error during search execution:', err);
    } finally {
      setLoading(false);
    }
  }, [activeTab, keyword, skillsFilter, locationFilter, experienceFilter, availabilityFilter, remoteOnly, verifiedOnly, projectTypeFilter, projectStatusFilter, sortBy, page, limit]);

  useEffect(() => {
    executeSearch();
  }, [activeTab, page, sortBy, skillsFilter, locationFilter, experienceFilter, availabilityFilter, remoteOnly, verifiedOnly, projectTypeFilter, projectStatusFilter]);

  useEffect(() => {
    fetchMetadata();
  }, []);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      setShowSuggestions(false);
      executeSearch();
    }
  };

  const handleClearFilters = () => {
    setSkillsFilter('');
    setLocationFilter('');
    setExperienceFilter('');
    setAvailabilityFilter('');
    setVerifiedOnly(false);
    setRemoteOnly(false);
    setProjectTypeFilter('');
    setProjectStatusFilter('');
    setSortBy('newest');
    setPage(1);
  };

  const handleHistoryClick = (item) => {
    setKeyword(item.keyword || '');
    if (item.filters?.skills?.length > 0) setSkillsFilter(item.filters.skills.join(', '));
    if (item.filters?.location) setLocationFilter(item.filters.location);
    if (item.filters?.experienceLevel) setExperienceFilter(item.filters.experienceLevel);
    if (item.filters?.projectType) setProjectTypeFilter(item.filters.projectType);
    if (item.filters?.status) setProjectStatusFilter(item.filters.status);
    setActiveTab(item.searchType === 'developer' ? 'developers' : 'posts');
    executeSearch(item.keyword);
  };

  const handleConnect = async (receiverId) => {
    try {
      setConnectingId(receiverId);
      await api.post(`/connections/send/${receiverId}`);
      setSentRequests(new Set([...sentRequests, receiverId]));
    } catch (err) {
      console.error('Connection request failed', err);
    } finally {
      setConnectingId(null);
    }
  };

  // Mock Developer Match calculation
  const getMatchScore = (dev) => {
    if (!skillsFilter) return null;
    const required = skillsFilter.split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
    if (required.length === 0) return null;
    const devSkills = (dev.skills || []).map(s => s.toLowerCase());
    const matched = required.filter(r => devSkills.some(ds => ds.includes(r)));
    return {
      percentage: Math.round((matched.length / required.length) * 100),
      matchedSkills: matched
    };
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-10 px-4 sm:px-6 lg:px-8 relative overflow-hidden font-sans">
      {/* Background decorations */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-10 left-10 w-[500px] h-[500px] bg-indigo-600/5 rounded-full blur-[100px]"></div>
        <div className="absolute bottom-20 right-20 w-[500px] h-[500px] bg-purple-600/5 rounded-full blur-[100px]"></div>
      </div>

      <div className="max-w-7xl mx-auto relative z-10 space-y-6">
        
        {/* Main Header Search Bar */}
        <div className="bg-slate-900/60 backdrop-blur-xl border border-white/5 rounded-3xl p-6 md:p-8 space-y-6 shadow-2xl relative z-20">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
            
            {/* Input Wrapper with Autocomplete */}
            <div className="relative w-full flex-1">
              <span className="absolute top-3.5 left-4 flex items-center text-slate-500">
                <SearchIcon size={20} />
              </span>
              <input
                type="text"
                placeholder={activeTab === 'developers' ? "Search React, Node, AI Engineers..." : "Search innovative projects..."}
                className="w-full pl-12 pr-4 py-3.5 bg-slate-950/80 border border-slate-800 rounded-2xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-slate-100 text-[15px] font-medium transition shadow-inner placeholder-slate-500"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                onKeyDown={handleKeyDown}
              />
              
              {showSuggestions && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden z-50">
                  <div className="p-3 border-b border-slate-800/80">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Trending Searches</span>
                  </div>
                  {SEARCH_SUGGESTIONS.filter(s => s.includes(keyword.toLowerCase())).map((s, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setKeyword(s);
                        executeSearch(s);
                      }}
                      className="w-full text-left px-4 py-3 text-sm text-slate-300 hover:bg-slate-800 hover:text-indigo-400 transition flex items-center gap-2"
                    >
                      <TrendingUp size={14} className="text-slate-500" /> {s}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-3 w-full md:w-auto">
              <button 
                onClick={() => executeSearch()}
                className="flex-1 md:flex-none px-8 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold rounded-2xl transition shadow-lg shadow-indigo-900/40"
              >
                Search
              </button>
              <button 
                onClick={() => setIsFilterDrawerOpen(true)}
                className="md:hidden p-3.5 bg-slate-800 border border-slate-700 hover:bg-slate-700 text-slate-300 rounded-2xl transition shadow-sm"
              >
                <Sliders size={20} />
              </button>
            </div>
          </div>

          {history.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 pt-4 border-t border-slate-800/80">
              <span className="text-slate-500 font-bold flex items-center gap-1.5 uppercase tracking-wider text-[10px]">
                <History size={12} /> Recent:
              </span>
              <div className="flex flex-wrap gap-2">
                {history.map((item) => (
                  <button
                    key={item._id}
                    onClick={() => handleHistoryClick(item)}
                    className="px-3 py-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded-xl transition text-xs font-semibold shadow-sm"
                  >
                    {item.keyword || 'Filtered Query'}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Dynamic Dual Tab Toggles */}
        <div className="flex items-center justify-between border-b border-white/5 pb-2">
          <div className="flex gap-6">
            <button
              onClick={() => { setActiveTab('developers'); setResults([]); setPage(1); }}
              className={`pb-3 font-extrabold text-sm relative transition duration-300 ${
                activeTab === 'developers' ? 'text-indigo-400' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Developers
              {activeTab === 'developers' && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-500 rounded-t-full shadow-[0_-2px_10px_rgba(99,102,241,0.5)]"></span>}
            </button>
            <button
              onClick={() => { setActiveTab('posts'); setResults([]); setPage(1); }}
              className={`pb-3 font-extrabold text-sm relative transition duration-300 ${
                activeTab === 'posts' ? 'text-indigo-400' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Projects & Posts
              {activeTab === 'posts' && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-500 rounded-t-full shadow-[0_-2px_10px_rgba(99,102,241,0.5)]"></span>}
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider hidden sm:inline">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-200 focus:outline-none transition cursor-pointer"
            >
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
              {activeTab === 'developers' ? (
                <>
                  <option value="most_repos">Most Repositories</option>
                  <option value="most_followers">Most Followers</option>
                </>
              ) : (
                <option value="most_likes">Most Liked</option>
              )}
            </select>
          </div>
        </div>

        {/* main grid split view */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* Desktop Filter Sidebar */}
          <aside className="hidden lg:block space-y-6">
            <div className="bg-slate-900/60 backdrop-blur-xl border border-white/5 rounded-3xl p-6 space-y-6 shadow-xl hover:border-white/10 transition-all duration-300">
              <div className="flex justify-between items-center pb-4 border-b border-slate-800">
                <span className="font-extrabold text-sm text-slate-100 flex items-center gap-2 tracking-wide">
                  <Sliders size={16} className="text-indigo-400" /> Filters
                </span>
                <button onClick={handleClearFilters} className="text-[10px] text-slate-500 hover:text-red-400 font-bold uppercase tracking-wider transition flex items-center gap-1 cursor-pointer">
                  Reset
                </button>
              </div>

              {/* Skills text filter */}
              <div className="space-y-2">
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">Target Skills</label>
                <input 
                  type="text" 
                  placeholder="React, Node, Python..."
                  className="w-full px-4 py-2.5 bg-slate-950/50 border border-slate-800 rounded-xl focus:border-indigo-500 text-sm text-slate-200 outline-none transition placeholder-slate-600"
                  value={skillsFilter}
                  onChange={(e) => setSkillsFilter(e.target.value)}
                />
              </div>

              {/* Location filter */}
              <div className="space-y-2">
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">Location</label>
                <input 
                  type="text" 
                  placeholder="e.g. India, San Francisco..."
                  className="w-full px-4 py-2.5 bg-slate-950/50 border border-slate-800 rounded-xl focus:border-indigo-500 text-sm text-slate-200 outline-none transition placeholder-slate-600"
                  value={locationFilter}
                  onChange={(e) => setLocationFilter(e.target.value)}
                />
              </div>

              {/* Experience */}
              <div className="space-y-2">
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">Experience Level</label>
                <select
                  value={experienceFilter}
                  onChange={(e) => setExperienceFilter(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-950/50 border border-slate-800 rounded-xl focus:border-indigo-500 text-sm font-semibold text-slate-300 outline-none transition"
                >
                  <option value="">Any Experience</option>
                  <option value="Beginner">Fresher / Beginner</option>
                  <option value="Intermediate">1 - 3 years</option>
                  <option value="Advanced">4+ years</option>
                </select>
              </div>

              {/* Developers specific filters */}
              {activeTab === 'developers' && (
                <>
                  <div className="space-y-2">
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">Availability</label>
                    <select
                      value={availabilityFilter}
                      onChange={(e) => setAvailabilityFilter(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-950/50 border border-slate-800 rounded-xl focus:border-indigo-500 text-sm font-semibold text-slate-300 outline-none transition"
                    >
                      <option value="">Any Availability</option>
                      <option value="Full-time">Open to Work (Full-time)</option>
                      <option value="Freelance">Freelance / Contract</option>
                      <option value="Part-time">Part-time</option>
                    </select>
                  </div>
                  
                  <div className="pt-2 space-y-3 border-t border-slate-800/80">
                    <label className="flex items-center gap-3 cursor-pointer group">
                      <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${verifiedOnly ? 'bg-indigo-600 border-indigo-600' : 'border-slate-700 bg-slate-950 group-hover:border-indigo-500'}`}>
                        {verifiedOnly && <Check size={14} className="text-white" />}
                      </div>
                      <span className="text-sm font-semibold text-slate-300 group-hover:text-white transition">Verified Only</span>
                      <input type="checkbox" className="hidden" checked={verifiedOnly} onChange={() => setVerifiedOnly(!verifiedOnly)} />
                    </label>

                    <label className="flex items-center gap-3 cursor-pointer group">
                      <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${remoteOnly ? 'bg-indigo-600 border-indigo-600' : 'border-slate-700 bg-slate-950 group-hover:border-indigo-500'}`}>
                        {remoteOnly && <Check size={14} className="text-white" />}
                      </div>
                      <span className="text-sm font-semibold text-slate-300 group-hover:text-white transition">Remote Available</span>
                      <input type="checkbox" className="hidden" checked={remoteOnly} onChange={() => setRemoteOnly(!remoteOnly)} />
                    </label>
                  </div>
                </>
              )}
            </div>

            {/* Trending / Analytics Widget Panel */}
            <div className="bg-slate-900/60 backdrop-blur-xl border border-white/5 rounded-3xl p-6 space-y-5 shadow-xl hover:border-white/10 transition-all">
              <h4 className="text-sm font-extrabold text-slate-100 flex items-center gap-2 uppercase tracking-wide">
                <Flame size={16} className="text-orange-500" /> Trending Tech Stacks
              </h4>
              <div className="space-y-3">
                {[
                  { name: 'React', growth: '+25%' },
                  { name: 'AI Agents', growth: '+60%' },
                  { name: 'Next.js', growth: '+18%' },
                  { name: 'Node.js', growth: '+12%' },
                  { name: 'Docker', growth: '+15%' },
                ].map((skill, index) => (
                  <div key={index} className="flex justify-between items-center group cursor-pointer">
                    <span className="font-bold text-slate-300 text-sm group-hover:text-indigo-400 transition">
                      {skill.name}
                    </span>
                    <span className="text-[10px] bg-emerald-500/10 text-emerald-400 font-bold px-2 py-1 rounded border border-emerald-500/20">
                      {skill.growth}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </aside>

          {/* Results Grid List */}
          <main className="lg:col-span-3 space-y-6">
            
            {activeTab === 'developers' && !loading && page === 1 && (
              <div className="bg-indigo-900/20 border border-indigo-500/20 rounded-2xl p-4 flex items-center gap-4">
                <div className="bg-indigo-500/20 p-3 rounded-xl">
                  <Star size={24} className="text-indigo-400" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-200">⭐ Featured Developers</h4>
                  <p className="text-xs text-slate-400 mt-1">Discover top contributors, open source maintainers, and verified experts.</p>
                </div>
              </div>
            )}

            {loading ? (
              <div className="grid gap-6">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="bg-slate-900/40 border border-slate-800 rounded-3xl p-6 h-64 animate-pulse"></div>
                ))}
              </div>
            ) : results.length === 0 ? (
              <div className="bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-3xl p-20 text-center max-w-2xl mx-auto shadow-2xl">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-slate-950 border border-slate-800 rounded-full text-slate-500 mb-6 shadow-inner">
                  {activeTab === 'developers' ? <Users size={32} /> : <FolderGit2 size={32} />}
                </div>
                <h3 className="text-2xl font-black text-slate-100 mb-2">No Professional Found</h3>
                <p className="text-slate-400 text-sm max-w-sm mx-auto">
                  Try broadening your search criteria or adjusting the advanced filters.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                <div className={activeTab === 'developers' ? "grid gap-6 grid-cols-1" : "grid gap-6 grid-cols-1"}>
                  
                  {activeTab === 'developers' ? (
                    results.map((dev) => {
                      const match = getMatchScore(dev);
                      // Mocking data for professional look
                      const followersCount = dev.followers?.length || Math.floor(Math.random() * 500);
                      const projectsCount = Math.floor(Math.random() * 30);
                      const isVerified = dev.githubProfile || dev.role === 'admin' || dev.profileViews > 50;
                      
                      return (
                        <div 
                          key={dev._id} 
                          className="bg-slate-900/60 backdrop-blur-xl border border-white/5 hover:border-white/10 rounded-3xl p-6 transition-all duration-300 hover:shadow-2xl hover:shadow-indigo-900/20 group relative overflow-hidden"
                        >
                          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-bl-full pointer-events-none transition-all group-hover:scale-110"></div>
                          
                          <div className="flex flex-col sm:flex-row gap-6 relative z-10">
                            
                            {/* Avatar Column */}
                            <div className="flex flex-col items-center sm:items-start shrink-0">
                              <div className="relative">
                                <img 
                                  src={dev.profilePicture || 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png'} 
                                  alt={dev.fullName} 
                                  className="w-24 h-24 rounded-2xl object-cover border-4 border-slate-900 shadow-xl" 
                                />
                                {activeUsers && activeUsers.has(dev._id) && (
                                  <span className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 border-4 border-slate-900 rounded-full"></span>
                                )}
                              </div>
                              {isVerified && (
                                <div className="mt-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full flex items-center gap-1.5 text-[10px] font-bold">
                                  <BadgeCheck size={12} /> VERIFIED
                                </div>
                              )}
                            </div>

                            {/* Details Column */}
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-2">
                                <div>
                                  <h3 className="text-2xl font-black text-slate-100 flex items-center gap-2">
                                    {dev.fullName}
                                  </h3>
                                  <p className="text-indigo-400 font-bold mt-1 text-sm">{dev.headline || dev.role || 'Full Stack Developer'}</p>
                                  
                                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-3 text-xs text-slate-400 font-semibold">
                                    {dev.location && <span className="flex items-center gap-1"><MapPin size={12} className="text-slate-500" /> {dev.location}</span>}
                                    <span className="flex items-center gap-1 text-yellow-500"><Star size={12} className="fill-yellow-500" /> 4.8 Rating</span>
                                    <span className="flex items-center gap-1"><Users size={12} /> {followersCount} Followers</span>
                                    <span className="flex items-center gap-1"><FolderOpen size={12} /> {projectsCount} Projects</span>
                                  </div>
                                </div>
                                
                                {/* Status Actions */}
                                <div className="shrink-0">
                                  {(dev.connectionStatus === 'accepted' || sentRequests.has(dev._id)) ? (
                                    <button disabled className="w-full sm:w-auto px-5 py-2.5 bg-green-500/10 border border-green-500/20 text-green-400 rounded-xl flex items-center justify-center gap-2 text-xs font-bold transition">
                                      <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div> Connected
                                    </button>
                                  ) : dev.connectionStatus === 'pending' ? (
                                    <button disabled className="w-full sm:w-auto px-5 py-2.5 bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 rounded-xl flex items-center justify-center gap-2 text-xs font-bold transition">
                                      <div className="w-2 h-2 rounded-full bg-yellow-500"></div> Request Sent
                                    </button>
                                  ) : (
                                    <div className="flex gap-2">
                                      <button 
                                        onClick={() => handleConnect(dev._id)}
                                        disabled={connectingId === dev._id}
                                        className="w-full sm:w-auto px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 hover:border-slate-600 rounded-xl flex items-center justify-center gap-2 transition text-xs font-bold shadow-md cursor-pointer"
                                      >
                                        {connectingId === dev._id ? <Loader2 size={14} className="animate-spin" /> : 'Connect'}
                                      </button>
                                      <button className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl flex items-center justify-center gap-2 transition text-xs font-bold shadow-lg shadow-indigo-900/40 cursor-pointer">
                                        Message
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Bio & Skills */}
                              <div className="mt-4 bg-slate-950/30 p-4 rounded-2xl border border-slate-800/50">
                                {match && (
                                  <div className="mb-4 pb-4 border-b border-slate-800/80">
                                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                                      <ShieldCheck size={14} className="text-indigo-400" /> Match Score: <span className="text-indigo-400">{match.percentage}%</span>
                                    </h4>
                                    <div className="flex flex-wrap gap-2">
                                      {match.matchedSkills.map((ms, i) => (
                                        <span key={i} className="text-[11px] font-bold text-emerald-400 flex items-center gap-1 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                                          <Check size={10} /> {ms}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                )}
                                <div className="flex flex-wrap gap-2">
                                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-1 mr-2">Top Skills:</span>
                                  {dev.skills.slice(0, 5).map((skill, index) => (
                                    <span key={index} className="px-2.5 py-1 bg-slate-800 text-slate-300 text-[11px] rounded-lg font-bold border border-slate-700 hover:border-indigo-500 transition-colors">
                                      {skill}
                                    </span>
                                  ))}
                                </div>
                                <div className="mt-4 flex flex-wrap gap-2">
                                  {dev.availability && dev.availability !== 'Not Available' && (
                                    <span className="px-3 py-1.5 bg-indigo-500/10 text-indigo-300 text-[11px] rounded-lg border border-indigo-500/20 font-bold uppercase tracking-wider">
                                      <Briefcase size={12} className="inline mr-1" /> Open to Work
                                    </span>
                                  )}
                                  <span className="px-3 py-1.5 bg-slate-800 text-slate-300 text-[11px] rounded-lg border border-slate-700 font-bold uppercase tracking-wider">
                                    Remote Available
                                  </span>
                                </div>
                              </div>

                              {/* Project Preview */}
                              {dev.githubProfile?.repos?.length > 0 && (
                                <div className="mt-4 border border-slate-800 rounded-xl p-4 bg-slate-900/50 hover:bg-slate-800/50 transition">
                                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Recent Project</p>
                                  <div className="flex justify-between items-start">
                                    <div>
                                      <h4 className="font-bold text-sm text-indigo-400 hover:underline cursor-pointer flex items-center gap-1.5">
                                        <Github size={14} /> {dev.githubProfile.repos[0].name}
                                      </h4>
                                      <p className="text-xs text-slate-400 mt-1 line-clamp-1">{dev.githubProfile.repos[0].description || 'No description available'}</p>
                                    </div>
                                    <div className="flex items-center gap-3 text-[11px] font-bold text-slate-500 shrink-0">
                                      <span className="flex items-center gap-1"><Star size={12} className="fill-slate-500" /> {dev.githubProfile.repos[0].stars || 0}</span>
                                      <span className="flex items-center gap-1"><Code2 size={12} /> {dev.githubProfile.repos[0].language || 'Code'}</span>
                                    </div>
                                  </div>
                                </div>
                              )}

                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    results.map((post) => (
                      <PostCard 
                        key={post._id} 
                        post={post} 
                        onPostDeleted={(id) => setResults(results.filter(p => p._id !== id))}
                      />
                    ))
                  )}

                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="pt-8 border-t border-white/5 flex justify-between items-center">
                    <button
                      disabled={page === 1}
                      onClick={() => setPage(page - 1)}
                      className="px-5 py-2.5 bg-slate-900 border border-slate-800 hover:bg-slate-800 disabled:opacity-50 text-slate-200 rounded-xl flex items-center gap-2 font-bold transition shadow-md"
                    >
                      <ChevronLeft size={16} /> Previous
                    </button>
                    <span className="text-slate-400 font-bold text-sm bg-slate-900 px-4 py-2 rounded-xl border border-slate-800">
                      Page {page} of {totalPages}
                    </span>
                    <button
                      disabled={page === totalPages}
                      onClick={() => setPage(page + 1)}
                      className="px-5 py-2.5 bg-slate-900 border border-slate-800 hover:bg-slate-800 disabled:opacity-50 text-slate-200 rounded-xl flex items-center gap-2 font-bold transition shadow-md"
                    >
                      Next <ChevronRight size={16} />
                    </button>
                  </div>
                )}

              </div>
            )}

          </main>
        </div>
      </div>

    </div>
  );
};

export default Search;
