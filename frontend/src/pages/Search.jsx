import React, { useState, useEffect, useCallback } from 'react';
import { 
  Search as SearchIcon, Sliders, X, Loader2, Sparkles, Navigation, 
  Briefcase, MapPin, CheckCircle, ChevronLeft, ChevronRight, Award, 
  Trash2, TrendingUp, History, FolderGit2, RefreshCw, UserPlus, Check, Github
} from 'lucide-react';
import api from '../services/api';
import PostCard from '../components/PostCard';

const Search = () => {
  // Tabs
  const [activeTab, setActiveTab] = useState('developers');

  // Search Input State
  const [keyword, setKeyword] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Filters State
  const [skillsFilter, setSkillsFilter] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [experienceFilter, setExperienceFilter] = useState('');
  const [availabilityFilter, setAvailabilityFilter] = useState('');
  const [minCompletion, setMinCompletion] = useState(0);
  
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
        if (experienceFilter) params.experience = experienceFilter;
        if (availabilityFilter) params.availability = availabilityFilter;
        if (minCompletion > 0) params.minCompletion = minCompletion;
      } else {
        if (projectTypeFilter) params.projectType = projectTypeFilter;
        if (projectStatusFilter) params.status = projectStatusFilter;
        if (experienceFilter) params.experience = experienceFilter;
      }

      const res = await api.get(endpoint, { params });
      setResults(res.data.data);
      setTotalPages(res.data.pages);
      
      // Update history tags
      fetchMetadata();
    } catch (err) {
      console.error('Error during search execution:', err);
    } finally {
      setLoading(false);
    }
  }, [activeTab, keyword, skillsFilter, locationFilter, experienceFilter, availabilityFilter, minCompletion, projectTypeFilter, projectStatusFilter, sortBy, page, limit]);

  useEffect(() => {
    executeSearch();
  }, [activeTab, page, sortBy, skillsFilter, locationFilter, experienceFilter, availabilityFilter, minCompletion, projectTypeFilter, projectStatusFilter]);

  useEffect(() => {
    fetchMetadata();
  }, []);

  // Handle keypress
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      setShowSuggestions(false);
      executeSearch();
    }
  };

  // Clear all filters
  const handleClearFilters = () => {
    setSkillsFilter('');
    setLocationFilter('');
    setExperienceFilter('');
    setAvailabilityFilter('');
    setMinCompletion(0);
    setProjectTypeFilter('');
    setProjectStatusFilter('');
    setSortBy('newest');
    setPage(1);
  };

  // Re-run from history tag click
  const handleHistoryClick = (item) => {
    setKeyword(item.keyword || '');
    if (item.filters?.skills?.length > 0) {
      setSkillsFilter(item.filters.skills.join(', '));
    }
    if (item.filters?.location) {
      setLocationFilter(item.filters.location);
    }
    if (item.filters?.experienceLevel) {
      setExperienceFilter(item.filters.experienceLevel);
    }
    if (item.filters?.projectType) {
      setProjectTypeFilter(item.filters.projectType);
    }
    if (item.filters?.status) {
      setProjectStatusFilter(item.filters.status);
    }
    setActiveTab(item.searchType === 'developer' ? 'developers' : 'posts');
    executeSearch(item.keyword);
  };

  // Connection CTA helper
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

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-950 text-slate-100 py-10 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-10 left-10 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl"></div>
      <div className="absolute bottom-20 right-20 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl"></div>

      <div className="max-w-7xl mx-auto relative z-10 space-y-6">
        
        {/* Main Header Search Bar */}
        <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 md:p-8 space-y-6">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            
            {/* Input Wrapper */}
            <div className="relative w-full flex-1">
              <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-500">
                <SearchIcon size={18} />
              </span>
              <input
                type="text"
                placeholder={activeTab === 'developers' ? "Search developers by name, bio, username..." : "Search project collaboration titles, ideas..."}
                className="w-full pl-12 pr-4 py-3.5 bg-slate-950 border border-slate-850 rounded-2xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-slate-100 text-sm transition placeholder-slate-600"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                onKeyDown={handleKeyDown}
              />
            </div>

            {/* Actions button */}
            <div className="flex gap-3 w-full md:w-auto">
              <button 
                onClick={() => executeSearch()}
                className="flex-1 md:flex-none px-6 py-3.5 bg-indigo-650 hover:bg-indigo-550 text-white text-xs font-bold rounded-2xl transition cursor-pointer shadow-lg shadow-indigo-950/20"
              >
                Search
              </button>
              <button 
                onClick={() => setIsFilterDrawerOpen(true)}
                className="md:hidden p-3.5 bg-slate-950 border border-slate-850 hover:bg-slate-800 text-slate-300 rounded-2xl transition"
              >
                <Sliders size={18} />
              </button>
            </div>

          </div>

          {/* Recent Searches / History Tags */}
          {history.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-850/60 text-xs">
              <span className="text-slate-500 font-bold flex items-center gap-1.5 uppercase tracking-wider text-[10px]">
                <History size={12} /> Recent:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {history.map((item) => (
                  <button
                    key={item._id}
                    onClick={() => handleHistoryClick(item)}
                    className="px-2.5 py-1 bg-slate-950/80 hover:bg-slate-800 border border-slate-850 text-slate-300 rounded-lg transition text-[10px] font-semibold cursor-pointer"
                  >
                    {item.keyword || 'Filtered Query'} ({item.searchType})
                  </button>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Dynamic Dual Tab Toggles */}
        <div className="flex items-center justify-between border-b border-slate-900 pb-1">
          <div className="flex gap-4">
            <button
              onClick={() => {
                setActiveTab('developers');
                setResults([]);
                setPage(1);
              }}
              className={`pb-3 font-extrabold text-sm relative transition duration-200 cursor-pointer ${
                activeTab === 'developers' 
                  ? 'text-indigo-400 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-indigo-500' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Developers Feed
            </button>
            <button
              onClick={() => {
                setActiveTab('posts');
                setResults([]);
                setPage(1);
              }}
              className={`pb-3 font-extrabold text-sm relative transition duration-200 cursor-pointer ${
                activeTab === 'posts' 
                  ? 'text-indigo-400 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-indigo-500' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Collaboration Posts
            </button>
          </div>

          {/* Sorter Selector */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider hidden sm:inline">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none"
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
            <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 space-y-5">
              <div className="flex justify-between items-center pb-3 border-b border-slate-850">
                <span className="font-extrabold text-xs text-slate-100 flex items-center gap-1.5 uppercase tracking-wider">
                  <Sliders size={14} className="text-indigo-400" /> Advanced Filters
                </span>
                <button 
                  onClick={handleClearFilters}
                  className="text-[10px] text-slate-500 hover:text-red-400 font-bold transition flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 size={11} /> Clear All
                </button>
              </div>

              {/* Skills text filter */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Required Skills</label>
                <input 
                  type="text" 
                  placeholder="React, Node, Mongo (CSV)..."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-850 rounded-xl focus:border-indigo-500 text-xs text-slate-350 outline-none transition"
                  value={skillsFilter}
                  onChange={(e) => setSkillsFilter(e.target.value)}
                />
              </div>

              {/* Location filter */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Location</label>
                <input 
                  type="text" 
                  placeholder="e.g. San Francisco, India..."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-850 rounded-xl focus:border-indigo-500 text-xs text-slate-350 outline-none transition"
                  value={locationFilter}
                  onChange={(e) => setLocationFilter(e.target.value)}
                />
              </div>

              {/* Experience dropdown filter */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Experience Level</label>
                <select
                  value={experienceFilter}
                  onChange={(e) => setExperienceFilter(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-850 rounded-xl focus:border-indigo-500 text-xs text-slate-350 outline-none transition"
                >
                  <option value="">All Experience Levels</option>
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced">Advanced</option>
                </select>
              </div>

              {/* Developers specific filters */}
              {activeTab === 'developers' && (
                <>
                  {/* Availability */}
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Availability</label>
                    <select
                      value={availabilityFilter}
                      onChange={(e) => setAvailabilityFilter(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-850 rounded-xl focus:border-indigo-500 text-xs text-slate-350 outline-none transition"
                    >
                      <option value="">All Availabilities</option>
                      <option value="Full-time">Full-time</option>
                      <option value="Part-time">Part-time</option>
                      <option value="Freelance">Freelance</option>
                      <option value="Not Available">Not Available</option>
                    </select>
                  </div>

                  {/* Profile Completion Slider */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      <span>Min Profile Completion</span>
                      <span className="text-indigo-400">{minCompletion}%</span>
                    </div>
                    <input 
                      type="range" 
                      min="0" 
                      max="100" 
                      step="10"
                      className="w-full accent-indigo-500"
                      value={minCompletion}
                      onChange={(e) => setMinCompletion(Number(e.target.value))}
                    />
                  </div>
                </>
              )}

              {/* Projects specific filters */}
              {activeTab === 'posts' && (
                <>
                  {/* Project Type */}
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Project Type</label>
                    <select
                      value={projectTypeFilter}
                      onChange={(e) => setProjectTypeFilter(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-850 rounded-xl focus:border-indigo-500 text-xs text-slate-350 outline-none transition"
                    >
                      <option value="">All Types</option>
                      <option value="Startup">Startup Idea</option>
                      <option value="Hackathon">Hackathon</option>
                      <option value="Open Source">Open Source</option>
                      <option value="Side Project">Side Project</option>
                    </select>
                  </div>

                  {/* Project Status */}
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Status</label>
                    <select
                      value={projectStatusFilter}
                      onChange={(e) => setProjectStatusFilter(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-850 rounded-xl focus:border-indigo-500 text-xs text-slate-350 outline-none transition"
                    >
                      <option value="">All Statuses</option>
                      <option value="open">Open</option>
                      <option value="closed">Closed</option>
                    </select>
                  </div>
                </>
              )}

            </div>

            {/* Trending / Analytics Widget Panel */}
            {analytics && (
              <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 space-y-4">
                <h4 className="text-xs font-bold text-slate-100 flex items-center gap-1.5 uppercase tracking-wider pb-2 border-b border-slate-850">
                  <TrendingUp size={14} className="text-indigo-400" /> Trending Tech Stacks
                </h4>
                
                {analytics.trendingSkills?.length > 0 ? (
                  <div className="space-y-2.5">
                    {analytics.trendingSkills.map((skill, index) => (
                      <div key={index} className="flex justify-between items-center text-xs">
                        <span className="px-2 py-0.5 bg-indigo-950/20 text-indigo-400 border border-indigo-900/20 rounded font-semibold text-[10px] capitalize">
                          {skill.name}
                        </span>
                        <span className="text-[10px] text-slate-500 font-bold">{skill.count} searches</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[10px] text-slate-600 italic">No search metrics aggregated yet.</p>
                )}
              </div>
            )}
          </aside>

          {/* Results Grid List */}
          <main className="lg:col-span-3 space-y-6">
            
            {loading ? (
              /* Loading Skeletons */
              <div className="grid gap-6 sm:grid-cols-2">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="bg-slate-900/20 border border-slate-850 rounded-2xl p-6 h-56 space-y-4 animate-pulse">
                    <div className="flex gap-4">
                      <div className="w-14 h-14 bg-slate-800 rounded-full"></div>
                      <div className="space-y-2 flex-1 pt-1">
                        <div className="h-4 bg-slate-800 rounded w-1/2"></div>
                        <div className="h-3 bg-slate-800 rounded w-1/4"></div>
                      </div>
                    </div>
                    <div className="h-3 bg-slate-800 rounded w-full"></div>
                    <div className="h-3 bg-slate-800 rounded w-3/4"></div>
                  </div>
                ))}
              </div>
            ) : results.length === 0 ? (
              /* Empty state UI */
              <div className="bg-slate-900/20 border border-slate-850 rounded-3xl p-16 text-center max-w-md mx-auto space-y-4">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-slate-950 border border-slate-850 rounded-xl text-slate-500">
                  {activeTab === 'developers' ? <Navigation size={24} /> : <FolderGit2 size={24} />}
                </div>
                <h3 className="text-lg font-bold text-slate-200">No Match Found</h3>
                <p className="text-slate-400 text-xs max-w-xs mx-auto">
                  Try adjusting filters or entering another keyword search.
                </p>
              </div>
            ) : (
              /* Grid Layout depending on active tab */
              <div className="space-y-6">
                <div className={activeTab === 'developers' ? "grid gap-6 sm:grid-cols-2" : "grid gap-6 sm:grid-cols-1 md:grid-cols-2"}>
                  
                  {activeTab === 'developers' ? (
                    results.map((dev) => (
                      <div 
                        key={dev._id} 
                        className="bg-slate-900/30 border border-slate-850 hover:border-slate-700/80 rounded-2xl p-6 flex flex-col justify-between transition duration-300 hover:shadow-xl relative group"
                      >
                        {/* Header Details */}
                        <div>
                          <div className="flex items-start gap-4">
                            <img 
                              src={dev.profilePicture} 
                              alt={dev.fullName} 
                              className="w-12 h-12 rounded-full object-cover border border-slate-800" 
                            />
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5">
                                <h3 className="text-sm font-bold text-slate-100 truncate">{dev.fullName}</h3>
                                {dev.githubProfile && (
                                  <a 
                                    href={dev.githubProfile.githubUrl} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-slate-500 hover:text-indigo-400 transition"
                                  >
                                    <Github size={12} />
                                  </a>
                                )}
                              </div>
                              
                              {/* Location tag */}
                              {dev.location && (
                                <p className="text-[10px] text-slate-400 flex items-center gap-1 mt-1 font-semibold">
                                  <MapPin size={10} className="text-indigo-400" /> {dev.location}
                                </p>
                              )}

                              {/* Experience & Level */}
                              <div className="flex gap-1.5 mt-2">
                                <span className="px-1.5 py-0.5 bg-indigo-950/20 text-indigo-300 text-[8px] rounded border border-indigo-900/30 font-semibold uppercase">
                                  {dev.experienceLevel}
                                </span>
                                <span className="px-1.5 py-0.5 bg-slate-950 text-slate-400 text-[8px] rounded border border-slate-850 font-semibold uppercase">
                                  {dev.availability}
                                </span>
                              </div>
                            </div>

                            {/* Profile Completion percentage radial ring */}
                            <div className="relative flex items-center justify-center w-10 h-10">
                              <svg className="w-10 h-10">
                                <circle 
                                  className="text-slate-950" 
                                  strokeWidth="2" 
                                  stroke="currentColor" 
                                  fill="transparent" 
                                  r="16" 
                                  cx="20" 
                                  cy="20" 
                                />
                                <circle 
                                  className="text-indigo-500" 
                                  strokeWidth="2.5" 
                                  strokeDasharray={100}
                                  strokeDashoffset={100 - (dev.profileCompletion || 0)}
                                  strokeLinecap="round" 
                                  stroke="currentColor" 
                                  fill="transparent" 
                                  r="16" 
                                  cx="20" 
                                  cy="20" 
                                />
                              </svg>
                              <span className="absolute text-[8px] font-extrabold text-slate-300">{dev.profileCompletion}%</span>
                            </div>

                          </div>

                          <p className="mt-4 text-slate-400 text-xs leading-relaxed line-clamp-3 min-h-[54px] whitespace-pre-wrap">
                            {dev.bio || 'No bio written yet.'}
                          </p>

                          {/* Skills Grid */}
                          <div className="mt-4 flex flex-wrap gap-1.5">
                            {dev.skills.slice(0, 3).map((skill, index) => (
                              <span 
                                key={index} 
                                className="px-2 py-0.5 bg-slate-950 border border-slate-850/60 text-slate-400 text-[9px] rounded-lg font-semibold"
                              >
                                {skill}
                              </span>
                            ))}
                            {dev.skills.length > 3 && (
                              <span className="px-2 py-0.5 bg-slate-950 border border-slate-850 text-slate-500 text-[9px] rounded-lg font-semibold">
                                +{dev.skills.length - 3} more
                              </span>
                            )}
                          </div>

                        </div>

                        {/* Action CTA Button */}
                        <div className="mt-6 pt-4 border-t border-slate-850/60">
                          {sentRequests.has(dev._id) ? (
                            <button 
                              disabled 
                              className="w-full py-2 bg-green-500/10 border border-green-500/25 text-green-400 rounded-xl flex items-center justify-center gap-1.5 text-xs font-bold"
                            >
                              <Check size={13} /> Connected
                            </button>
                          ) : (
                            <button 
                              onClick={() => handleConnect(dev._id)}
                              disabled={connectingId === dev._id}
                              className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl flex items-center justify-center gap-1.5 transition text-xs font-bold shadow-md disabled:opacity-50 cursor-pointer"
                            >
                              {connectingId === dev._id ? (
                                <Loader2 className="animate-spin h-3.5 w-3.5" />
                              ) : (
                                <>
                                  <UserPlus size={13} /> Connect
                                </>
                              )}
                            </button>
                          )}
                        </div>

                      </div>
                    ))
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
                  <div className="pt-6 border-t border-slate-900 flex justify-between items-center text-xs">
                    <button
                      disabled={page === 1}
                      onClick={() => setPage(page - 1)}
                      className="px-3.5 py-2 bg-slate-900 border border-slate-805 hover:bg-slate-800 disabled:opacity-50 text-slate-300 rounded-xl flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <ChevronLeft size={14} /> Previous
                    </button>
                    <span className="text-slate-500 font-semibold">Page {page} of {totalPages}</span>
                    <button
                      disabled={page === totalPages}
                      onClick={() => setPage(page + 1)}
                      className="px-3.5 py-2 bg-slate-900 border border-slate-805 hover:bg-slate-800 disabled:opacity-50 text-slate-300 rounded-xl flex items-center gap-1.5 transition cursor-pointer"
                    >
                      Next <ChevronRight size={14} />
                    </button>
                  </div>
                )}

              </div>
            )}

          </main>

        </div>

      </div>

      {/* Mobile Filters Drawer Overlay */}
      {isFilterDrawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
            onClick={() => setIsFilterDrawerOpen(false)}
          ></div>
          
          {/* Drawer content wrapper */}
          <div className="w-80 bg-slate-900 border-l border-slate-850 h-full p-6 space-y-6 overflow-y-auto relative z-10 animate-in slide-in-from-right duration-250">
            <div className="flex justify-between items-center pb-3 border-b border-slate-850">
              <span className="font-extrabold text-xs text-slate-100 flex items-center gap-1.5 uppercase tracking-wider">
                <Sliders size={14} className="text-indigo-400" /> Filters
              </span>
              <button 
                onClick={() => setIsFilterDrawerOpen(false)}
                className="text-slate-500 hover:text-slate-200"
              >
                <X size={18} />
              </button>
            </div>

            {/* Filter controls duplicated inside mobile view */}
            <div className="space-y-5">
              
              {/* Skills */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Required Skills</label>
                <input 
                  type="text" 
                  placeholder="React, Node, Mongo (CSV)..."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-850 rounded-xl focus:border-indigo-500 text-xs text-slate-350 outline-none transition"
                  value={skillsFilter}
                  onChange={(e) => setSkillsFilter(e.target.value)}
                />
              </div>

              {/* Location */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Location</label>
                <input 
                  type="text" 
                  placeholder="e.g. San Francisco..."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-850 rounded-xl focus:border-indigo-500 text-xs text-slate-350 outline-none transition"
                  value={locationFilter}
                  onChange={(e) => setLocationFilter(e.target.value)}
                />
              </div>

              {/* Experience */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Experience Level</label>
                <select
                  value={experienceFilter}
                  onChange={(e) => setExperienceFilter(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-850 rounded-xl focus:border-indigo-500 text-xs text-slate-350 outline-none transition"
                >
                  <option value="">All Experience Levels</option>
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced">Advanced</option>
                </select>
              </div>

              {/* Developer specific filters */}
              {activeTab === 'developers' && (
                <>
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Availability</label>
                    <select
                      value={availabilityFilter}
                      onChange={(e) => setAvailabilityFilter(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-850 rounded-xl focus:border-indigo-500 text-xs text-slate-350 outline-none transition"
                    >
                      <option value="">All Availabilities</option>
                      <option value="Full-time">Full-time</option>
                      <option value="Part-time">Part-time</option>
                      <option value="Freelance">Freelance</option>
                      <option value="Not Available">Not Available</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      <span>Min Profile Completion</span>
                      <span className="text-indigo-400">{minCompletion}%</span>
                    </div>
                    <input 
                      type="range" 
                      min="0" 
                      max="100" 
                      step="10"
                      className="w-full accent-indigo-500"
                      value={minCompletion}
                      onChange={(e) => setMinCompletion(Number(e.target.value))}
                    />
                  </div>
                </>
              )}

              {/* Post specific filters */}
              {activeTab === 'posts' && (
                <>
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Project Type</label>
                    <select
                      value={projectTypeFilter}
                      onChange={(e) => setProjectTypeFilter(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-850 rounded-xl focus:border-indigo-500 text-xs text-slate-350 outline-none transition"
                    >
                      <option value="">All Types</option>
                      <option value="Startup">Startup Idea</option>
                      <option value="Hackathon">Hackathon</option>
                      <option value="Open Source">Open Source</option>
                      <option value="Side Project">Side Project</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Status</label>
                    <select
                      value={projectStatusFilter}
                      onChange={(e) => setProjectStatusFilter(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-850 rounded-xl focus:border-indigo-500 text-xs text-slate-350 outline-none transition"
                    >
                      <option value="">All Statuses</option>
                      <option value="open">Open</option>
                      <option value="closed">Closed</option>
                    </select>
                  </div>
                </>
              )}

              {/* Footer CTA */}
              <div className="pt-4 flex gap-3 border-t border-slate-850">
                <button 
                  onClick={handleClearFilters}
                  className="flex-1 py-2 bg-slate-850 hover:bg-slate-800 text-slate-300 rounded-xl text-xs font-bold transition"
                >
                  Clear All
                </button>
                <button 
                  onClick={() => setIsFilterDrawerOpen(false)}
                  className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-550 text-white rounded-xl text-xs font-bold transition shadow-lg cursor-pointer"
                >
                  Apply Filters
                </button>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Search;
