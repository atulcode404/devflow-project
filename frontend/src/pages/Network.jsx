import React, { useState, useEffect, useContext, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Search, Loader2, Filter, Activity, CheckCircle2, UserCheck, X } from 'lucide-react';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';
import DeveloperCard from '../components/common/DeveloperCard';

const Network = () => {
  const { user: currentUser } = useContext(AuthContext);
  const [developers, setDevelopers] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filter States
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [skillFilter, setSkillFilter] = useState('');
  const [onlineOnly, setOnlineOnly] = useState(false);
  const [availableOnly, setAvailableOnly] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // Local sync of current user's following list to manage follow states
  const [followingIds, setFollowingIds] = useState(new Set());

  useEffect(() => {
    const fetchNetwork = async () => {
      try {
        setLoading(true);
        const res = await api.get('/users/network');
        setDevelopers(res.data);

        // Fetch current user's profile to get following list
        if (currentUser) {
          const profileRes = await api.get(`/users/username/${currentUser.username || currentUser._id}`);
          const followingSet = new Set(profileRes.data.following.map(f => f._id));
          setFollowingIds(followingSet);
        }
      } catch (err) {
        console.error('Failed to load network', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchNetwork();
  }, [currentUser]);

  const handleToggleFollow = async (targetId) => {
    try {
      const res = await api.post(`/users/${targetId}/follow`);
      const isFollowing = res.data.isFollowing;
      
      setFollowingIds(prev => {
        const newSet = new Set(prev);
        if (isFollowing) {
          newSet.add(targetId);
        } else {
          newSet.delete(targetId);
        }
        return newSet;
      });
    } catch (err) {
      console.error(err);
    }
  };

  // Derive unique skills and roles from data for filter dropdowns
  const uniqueSkills = useMemo(() => {
    const skills = new Set();
    developers.forEach(dev => dev.skills?.forEach(s => skills.add(s)));
    return Array.from(skills).sort();
  }, [developers]);

  const uniqueRoles = useMemo(() => {
    const roles = new Set();
    developers.forEach(dev => {
      if (dev.headline) roles.add(dev.headline);
      else if (dev.role) roles.add(dev.role);
    });
    return Array.from(roles).sort();
  }, [developers]);

  const filteredDevelopers = developers.filter(dev => {
    const matchesSearch = dev.fullName.toLowerCase().includes(search.toLowerCase()) ||
                          (dev.skills && dev.skills.some(skill => skill.toLowerCase().includes(search.toLowerCase())));
    const matchesRole = roleFilter ? (dev.headline === roleFilter || dev.role === roleFilter) : true;
    const matchesSkill = skillFilter ? dev.skills?.includes(skillFilter) : true;
    const matchesOnline = onlineOnly ? dev.isOnline : true;
    const matchesAvailable = availableOnly ? (dev.availability && dev.availability !== 'Not Available') : true;

    return matchesSearch && matchesRole && matchesSkill && matchesOnline && matchesAvailable;
  });

  // Stats
  const totalDevs = developers.length;
  const onlineDevs = developers.filter(d => d.isOnline).length;
  const availableDevs = developers.filter(d => d.availability && d.availability !== 'Not Available').length;
  const myConnections = followingIds.size;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-12 pt-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-slate-100 flex items-center gap-3">
            <Users size={32} className="text-indigo-400" /> Developer Network
          </h1>
          <p className="text-slate-400 mt-2">Connect with elite developers, discover new tech stacks, and expand your community.</p>
        </div>

        {/* Stats Cards */}
        {!loading && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex flex-col items-center justify-center text-center">
              <Users size={24} className="text-blue-400 mb-2" />
              <span className="text-2xl font-bold text-slate-100">{totalDevs}</span>
              <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Total Developers</span>
            </div>
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex flex-col items-center justify-center text-center">
              <Activity size={24} className="text-emerald-400 mb-2" />
              <span className="text-2xl font-bold text-slate-100">{onlineDevs}</span>
              <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Online Now</span>
            </div>
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex flex-col items-center justify-center text-center">
              <CheckCircle2 size={24} className="text-indigo-400 mb-2" />
              <span className="text-2xl font-bold text-slate-100">{availableDevs}</span>
              <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Available for Work</span>
            </div>
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex flex-col items-center justify-center text-center">
              <UserCheck size={24} className="text-purple-400 mb-2" />
              <span className="text-2xl font-bold text-slate-100">{myConnections}</span>
              <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">My Connections</span>
            </div>
          </div>
        )}

        {/* Search and Filter Bar */}
        <div className="mb-8 bg-slate-900/60 border border-slate-800 p-4 rounded-2xl shadow-lg">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="relative flex-1 w-full">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Search size={18} className="text-slate-500" />
              </div>
              <input 
                type="text" 
                placeholder="Search developers by name or skills (e.g. React)..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="block w-full pl-11 pr-4 py-3 bg-slate-950/50 border border-slate-700/50 rounded-xl leading-5 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all duration-200"
              />
            </div>
            <button 
              onClick={() => setShowFilters(!showFilters)}
              className={`px-4 py-3 rounded-xl border flex items-center gap-2 font-semibold transition-all duration-200 ${
                showFilters || roleFilter || skillFilter || onlineOnly || availableOnly
                  ? 'bg-indigo-600 border-indigo-500 text-white' 
                  : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <Filter size={18} /> Filters
              {(roleFilter || skillFilter || onlineOnly || availableOnly) && (
                <span className="bg-white/20 px-2 py-0.5 rounded-full text-[10px]">Active</span>
              )}
            </button>
          </div>
          
          {/* Expanded Filters */}
          <AnimatePresence>
            {showFilters && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="pt-4 mt-4 border-t border-slate-800 grid grid-cols-1 md:grid-cols-4 gap-4">
                  
                  {/* Skill Filter */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Skill</label>
                    <select 
                      value={skillFilter} 
                      onChange={(e) => setSkillFilter(e.target.value)}
                      className="w-full bg-slate-950/50 border border-slate-700/50 rounded-lg p-2.5 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                    >
                      <option value="">All Skills</option>
                      {uniqueSkills.map(skill => (
                        <option key={skill} value={skill}>{skill}</option>
                      ))}
                    </select>
                  </div>
                  
                  {/* Role Filter */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Role</label>
                    <select 
                      value={roleFilter} 
                      onChange={(e) => setRoleFilter(e.target.value)}
                      className="w-full bg-slate-950/50 border border-slate-700/50 rounded-lg p-2.5 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                    >
                      <option value="">All Roles</option>
                      {uniqueRoles.map(role => (
                        <option key={role} value={role}>{role}</option>
                      ))}
                    </select>
                  </div>

                  {/* Toggles */}
                  <div className="md:col-span-2 flex flex-col sm:flex-row gap-4 items-start sm:items-end pb-1">
                    <label className="flex items-center gap-2 cursor-pointer group">
                      <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${onlineOnly ? 'bg-emerald-500 border-emerald-500' : 'bg-slate-950/50 border-slate-700 group-hover:border-emerald-500/50'}`}>
                        {onlineOnly && <CheckCircle2 size={14} className="text-white" />}
                      </div>
                      <span className="text-sm font-medium text-slate-300 group-hover:text-slate-100">Online Only</span>
                      <input type="checkbox" className="hidden" checked={onlineOnly} onChange={() => setOnlineOnly(!onlineOnly)} />
                    </label>
                    
                    <label className="flex items-center gap-2 cursor-pointer group">
                      <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${availableOnly ? 'bg-indigo-500 border-indigo-500' : 'bg-slate-950/50 border-slate-700 group-hover:border-indigo-500/50'}`}>
                        {availableOnly && <CheckCircle2 size={14} className="text-white" />}
                      </div>
                      <span className="text-sm font-medium text-slate-300 group-hover:text-slate-100">Available for Work</span>
                      <input type="checkbox" className="hidden" checked={availableOnly} onChange={() => setAvailableOnly(!availableOnly)} />
                    </label>

                    <button 
                      onClick={() => {
                        setSkillFilter('');
                        setRoleFilter('');
                        setOnlineOnly(false);
                        setAvailableOnly(false);
                      }}
                      className="ml-auto text-xs font-semibold text-slate-500 hover:text-slate-300 flex items-center gap-1"
                    >
                      <X size={14} /> Clear All
                    </button>
                  </div>

                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Developer Grid */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <Loader2 size={40} className="text-indigo-500 animate-spin" />
            <p className="text-slate-400 font-medium animate-pulse">Loading network...</p>
          </div>
        ) : filteredDevelopers.length > 0 ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
          >
            {filteredDevelopers.map((dev) => (
              <DeveloperCard 
                key={dev._id} 
                developer={dev} 
                isFollowing={followingIds.has(dev._id)}
                onToggleFollow={handleToggleFollow}
              />
            ))}
          </motion.div>
        ) : (
          <div className="text-center py-20 bg-slate-900/40 border border-slate-800 rounded-2xl flex flex-col items-center justify-center">
            <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mb-4">
              <Search size={32} className="text-slate-500" />
            </div>
            <h3 className="text-xl font-bold text-slate-300">No developers found</h3>
            <p className="text-slate-500 mt-2 max-w-md mx-auto">We couldn't find anyone matching your current filters. Try adjusting your search criteria or clearing some filters.</p>
            {(search || roleFilter || skillFilter || onlineOnly || availableOnly) && (
              <button 
                onClick={() => {
                  setSearch('');
                  setSkillFilter('');
                  setRoleFilter('');
                  setOnlineOnly(false);
                  setAvailableOnly(false);
                }}
                className="mt-6 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm font-semibold transition-colors"
              >
                Clear Filters
              </button>
            )}
          </div>
        )}

      </div>
    </div>
  );
};

export default Network;
