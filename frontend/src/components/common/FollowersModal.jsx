import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, BadgeCheck } from 'lucide-react';
import { Link } from 'react-router-dom';

const FollowersModal = ({ isOpen, onClose, title, users, currentUser, onToggleFollow }) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[80vh]"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-900/50">
            <h2 className="text-lg font-bold text-slate-100">{title}</h2>
            <button 
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
            >
              <X size={20} />
            </button>
          </div>

          {/* User List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {users && users.length > 0 ? (
              users.map(user => {
                const isFollowing = currentUser?.following?.includes(user._id) || currentUser?.following?.some(f => f._id === user._id) || user.followers?.includes(currentUser?._id);
                const isSelf = currentUser?._id === user._id;

                return (
                  <div key={user._id} className="flex items-center justify-between p-3 bg-slate-950/50 border border-slate-800/50 rounded-xl hover:border-slate-700 transition">
                    <div className="flex items-center gap-3">
                      <Link to={`/developer/${user.username || user._id}`} onClick={onClose}>
                        <img 
                          src={user.profilePicture || 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png'} 
                          alt={user.fullName} 
                          className="w-10 h-10 rounded-full object-cover border border-slate-700"
                        />
                      </Link>
                      <div>
                        <Link to={`/developer/${user.username || user._id}`} onClick={onClose} className="hover:underline flex items-center gap-1.5">
                          <h4 className="font-bold text-slate-200 text-sm">{user.fullName}</h4>
                          {(user.role === 'admin' || user.role === 'master_admin') && (
                            <BadgeCheck size={14} className="text-brand-primary" />
                          )}
                        </Link>
                        <p className="text-xs text-slate-400 truncate max-w-[150px]">{user.headline || user.role || 'Developer'}</p>
                      </div>
                    </div>
                    
                    {!isSelf && currentUser && (
                      <button
                        onClick={() => onToggleFollow(user._id)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition ${
                          isFollowing 
                            ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' 
                            : 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-md'
                        }`}
                      >
                        {isFollowing ? 'Unfollow' : 'Follow'}
                      </button>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8 text-slate-500">
                <p>No users found.</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default FollowersModal;
