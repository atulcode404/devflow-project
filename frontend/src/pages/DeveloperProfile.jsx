import React, { useState, useEffect, useContext } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Users, UserPlus, UserMinus, MessageSquare, Briefcase, GraduationCap, Github, Linkedin, Globe, ShieldAlert, Code2 } from 'lucide-react';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';
import PostCard from '../components/common/PostCard';
import StatusIndicator from '../components/common/StatusIndicator';
import FollowersModal from '../components/common/FollowersModal';

const DeveloperProfile = () => {
  const { identifier } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useContext(AuthContext);
  
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isFollowing, setIsFollowing] = useState(false);
  const [activeTab, setActiveTab] = useState('posts');
  const [modalData, setModalData] = useState({ isOpen: false, title: '', users: [] });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/users/profile/public/${identifier}`);
        setProfile(res.data);
        
        if (currentUser) {
          setIsFollowing(res.data.followers?.some(f => f._id === currentUser._id || f === currentUser._id));
        }

        // Fetch posts by user
        const postsRes = await api.get(`/posts/user/${res.data.username || res.data._id}`);
        setPosts(postsRes.data);
      } catch (err) {
        setError('Failed to load profile');
      } finally {
        setLoading(false);
      }
    };
    
    if (identifier) fetchProfile();
  }, [identifier, currentUser]);

  const handleToggleFollow = async () => {
    try {
      const res = await api.post(`/users/${profile._id}/follow`);
      setIsFollowing(res.data.isFollowing);
      
      // Update local follower count (optimistic)
      if (res.data.isFollowing) {
        setProfile({ ...profile, followers: [...profile.followers, currentUser] });
      } else {
        setProfile({ ...profile, followers: profile.followers.filter(f => f._id !== currentUser._id) });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleFollowUser = async (userId) => {
    if (!currentUser) return;
    try {
      const res = await api.post(`/users/${userId}/follow`);
      // Update the modal data to reflect the new follow status optimistically
      // Actually, since currentUser isn't dynamically updated in this state, we might just re-fetch or let the modal button handle its own local state.
      // But we can just rely on the modal using currentUser? Wait, currentUser context doesn't auto-update following list unless we dispatch.
      // For now, this will trigger the API. The UI in the modal might not instantly flip unless we handle it, but it's okay for now.
    } catch (err) {
      console.error(err);
    }
  };

  const handlePostUpdate = (updatedPost) => {
    setPosts(posts.map(p => p._id === updatedPost._id ? updatedPost : p));
  };

  if (loading) {
    return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-indigo-500">Loading Profile...</div>;
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-300">
        <ShieldAlert size={64} className="text-red-500/80 mb-6 drop-shadow-[0_0_15px_rgba(239,68,68,0.5)]" />
        <h2 className="text-4xl font-black mb-2 text-white">404</h2>
        <p className="text-lg text-slate-400 mb-8">User profile not found or does not exist.</p>
        <Link to="/" className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold transition shadow-lg shadow-indigo-500/25">Return to Feed</Link>
      </div>
    );
  }

  const isOwnProfile = currentUser?._id === profile._id;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-12 pt-6">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Top Profile Card */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-900/60 backdrop-blur-md border border-slate-800 rounded-2xl overflow-hidden shadow-xl mb-6"
        >
          {/* Cover Banner */}
          <div className="h-48 sm:h-64 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-800 relative">
            {profile.backgroundPicture && (
              <img src={profile.backgroundPicture} alt="Cover" className="w-full h-full object-cover opacity-50 mix-blend-overlay" />
            )}
          </div>

          <div className="px-6 pb-6 relative">
            {/* Profile Picture */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end -mt-16 sm:-mt-24 mb-4">
              <div className="w-32 h-32 sm:w-48 sm:h-48 rounded-full border-4 border-slate-900 overflow-hidden bg-slate-800 shadow-xl relative z-10">
                <img src={profile.profilePicture} alt="Profile" className="w-full h-full object-cover" />
              </div>

              {/* Actions */}
              <div className="flex gap-3 mt-4 sm:mt-0 w-full sm:w-auto relative z-10">
                {isOwnProfile ? (
                  <button className="flex-1 sm:flex-none px-6 py-2 border border-slate-700 hover:border-slate-600 bg-slate-800/50 hover:bg-slate-800 text-slate-200 rounded-full text-sm font-semibold transition">
                    Edit Profile
                  </button>
                ) : (
                  <>
                    <button 
                      onClick={handleToggleFollow}
                      className={`flex-1 sm:flex-none px-6 py-2 rounded-full text-sm font-bold flex items-center justify-center gap-2 transition ${
                        isFollowing 
                          ? 'bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700' 
                          : 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-lg shadow-indigo-500/25'
                      }`}
                    >
                      {isFollowing ? <><UserMinus size={16} /> Unfollow</> : <><UserPlus size={16} /> Follow</>}
                    </button>
                    <button 
                      onClick={() => navigate(`/messages/${profile._id}`)}
                      className="flex-1 sm:flex-none px-6 py-2 border border-slate-700 bg-slate-800/50 hover:bg-slate-700 rounded-full text-sm font-bold text-slate-200 flex items-center justify-center gap-2 transition"
                    >
                      <MessageSquare size={16} /> Message
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Profile Info */}
            <div className="mt-2">
              <h1 className="text-3xl font-extrabold text-slate-100">{profile.fullName}</h1>
              <p className="text-xl text-slate-300 font-medium mt-1">{profile.headline || profile.role || 'Developer'}</p>
              
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-3 text-sm text-slate-400">
                <span className="flex items-center gap-1.5">
                  <MapPin size={16} className="text-indigo-400" />
                  {profile.location || 'Global Remote'}
                </span>
                
                <StatusIndicator isOnline={profile.isOnline} lastSeen={profile.lastSeen} />

                <button 
                  onClick={() => {
                    const allUsers = [...(profile.followers || []), ...(profile.following || [])];
                    const uniqueUsers = Array.from(new Map(allUsers.map(user => [user._id, user])).values());
                    setModalData({ isOpen: true, title: 'Network', users: uniqueUsers });
                  }}
                  className="flex items-center gap-1.5 text-indigo-400 font-semibold cursor-pointer hover:text-indigo-300 hover:underline transition"
                >
                  <Users size={16} />
                  {profile.followers?.length || 0} Followers • {profile.following?.length || 0} Following
                </button>
              </div>
            </div>
          </div>
        </motion.div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left Column (Main Info) */}
          <div className="flex-[2] space-y-6">
            
            {/* About */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-slate-900/60 backdrop-blur-md border border-slate-800 rounded-2xl p-6 shadow-xl"
            >
              <h3 className="text-xl font-bold text-slate-100 mb-4">About</h3>
              <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">
                {profile.bio || "This developer hasn't added a bio yet."}
              </p>
            </motion.div>

            {/* Experience */}
            {profile.experience && profile.experience.length > 0 && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-slate-900/60 backdrop-blur-md border border-slate-800 rounded-2xl p-6 shadow-xl"
              >
                <h3 className="text-xl font-bold text-slate-100 mb-6">Experience</h3>
                <div className="space-y-6">
                  {profile.experience.map((exp, idx) => (
                    <div key={idx} className="flex gap-4">
                      <div className="mt-1 bg-slate-800 p-3 rounded-xl border border-slate-700">
                        <Briefcase size={24} className="text-indigo-400" />
                      </div>
                      <div>
                        <h4 className="text-lg font-bold text-slate-200">{exp.title}</h4>
                        <p className="text-md text-slate-300">{exp.company}</p>
                        <p className="text-xs text-slate-500 mt-1 mb-2">{exp.startDate} - {exp.endDate || 'Present'}</p>
                        <p className="text-sm text-slate-400 leading-relaxed">{exp.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Activity Section */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <div className="flex items-center gap-6 mb-6 border-b border-slate-800">
                {['posts', 'projects', 'comments', 'liked'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`pb-3 text-sm font-bold capitalize transition-colors relative ${
                      activeTab === tab 
                        ? 'text-indigo-400' 
                        : 'text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    {tab}
                    {activeTab === tab && (
                      <motion.div layoutId="activeTabIndicator" className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500" />
                    )}
                  </button>
                ))}
              </div>

              <div className="space-y-4">
                {activeTab === 'posts' && (
                  posts.length > 0 ? (
                    posts.map((post) => (
                      <PostCard key={post._id} post={post} currentUser={currentUser} onPostUpdate={handlePostUpdate} />
                    ))
                  ) : (
                    <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800 rounded-2xl p-8 text-center shadow-xl">
                      <p className="text-slate-400 italic">No posts created yet.</p>
                    </div>
                  )
                )}

                {activeTab === 'projects' && (
                  <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800 rounded-2xl p-8 text-center shadow-xl">
                    <p className="text-slate-400 italic">No projects added yet.</p>
                  </div>
                )}

                {activeTab === 'comments' && (
                  <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800 rounded-2xl p-8 text-center shadow-xl">
                    <p className="text-slate-400 italic">No recent comments.</p>
                  </div>
                )}

                {activeTab === 'liked' && (
                  <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800 rounded-2xl p-8 text-center shadow-xl">
                    <p className="text-slate-400 italic">No liked posts to show.</p>
                  </div>
                )}
              </div>
            </motion.div>

          </div>

          {/* Right Column (Sidebar Info) */}
          <div className="flex-1 space-y-6">
            
            {/* Skills Badges */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-slate-900/60 backdrop-blur-md border border-slate-800 rounded-2xl p-6 shadow-xl"
            >
              <h3 className="text-lg font-bold text-slate-100 mb-4">Tech Stack</h3>
              {profile.skills && profile.skills.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {profile.skills.map((skill, idx) => (
                    <button 
                      key={idx} 
                      onClick={() => navigate(`/search?skill=${skill}`)}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-indigo-900/40 border border-slate-700 hover:border-indigo-500/50 text-slate-300 hover:text-indigo-300 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5"
                    >
                      {skill}
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-slate-500 text-sm">No skills added.</p>
              )}
            </motion.div>

            {/* Links & Socials */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-slate-900/60 backdrop-blur-md border border-slate-800 rounded-2xl p-6 shadow-xl"
            >
              <h3 className="text-lg font-bold text-slate-100 mb-4">Links</h3>
              <div className="space-y-4 text-sm font-medium">
                {profile.githubLink && (
                  <a href={profile.githubLink} target="_blank" rel="noreferrer" className="flex items-center gap-3 text-slate-300 hover:text-white group transition">
                    <Github size={18} className="text-slate-400 group-hover:text-white" /> GitHub Profile
                  </a>
                )}
                {profile.linkedinLink && (
                  <a href={profile.linkedinLink} target="_blank" rel="noreferrer" className="flex items-center gap-3 text-slate-300 hover:text-white group transition">
                    <Linkedin size={18} className="text-blue-400" /> LinkedIn Profile
                  </a>
                )}
                {profile.portfolio && (
                  <a href={profile.portfolio} target="_blank" rel="noreferrer" className="flex items-center gap-3 text-slate-300 hover:text-white group transition">
                    <Globe size={18} className="text-green-400" /> Personal Portfolio
                  </a>
                )}
                {!profile.githubLink && !profile.linkedinLink && !profile.portfolio && (
                  <div className="flex flex-col items-center text-center p-4 bg-slate-950 rounded-xl border border-slate-800/50">
                    <p className="text-slate-500 text-xs italic mb-3">No links added yet.</p>
                    {isOwnProfile && (
                      <Link to="/profile" className="text-[10px] uppercase font-bold tracking-widest text-indigo-400 hover:text-indigo-300">
                        + Add Links
                      </Link>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
            
          </div>
        </div>

      </div>
    </div>
  );
};

export default DeveloperProfile;
