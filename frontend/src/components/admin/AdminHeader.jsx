import React from 'react';
import { MapPin, Edit3, PenSquare } from 'lucide-react';
import { motion } from 'framer-motion';

const AdminHeader = ({ user }) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-slate-900/60 backdrop-blur-md border border-slate-800 rounded-2xl overflow-hidden shadow-xl"
    >
      {/* Cover Banner */}
      <div className="h-32 sm:h-48 w-full bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-800 relative overflow-hidden">
        {/* Decorative elements in banner */}
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-transparent to-slate-900/60"></div>
      </div>

      {/* Profile Section */}
      <div className="px-6 pb-6 relative">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end -mt-12 sm:-mt-16 mb-4">
          <div className="relative group cursor-pointer">
            <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full border-4 border-slate-900 overflow-hidden bg-slate-800 shadow-xl relative">
              {user?.profilePic ? (
                <img src={user.profilePic} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-4xl font-bold text-indigo-400 bg-slate-800">
                  {user?.fullName?.charAt(0) || 'A'}
                </div>
              )}
            </div>
            <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <Edit3 size={24} className="text-white" />
            </div>
          </div>

          <div className="flex gap-3 mt-4 sm:mt-0 w-full sm:w-auto">
            <button className="flex-1 sm:flex-none px-4 py-2 border border-slate-700 hover:border-slate-600 bg-slate-800/50 hover:bg-slate-800 text-slate-200 rounded-full text-sm font-semibold transition flex items-center justify-center gap-2">
              <Edit3 size={16} /> Edit Profile
            </button>
            <button className="flex-1 sm:flex-none px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full text-sm font-semibold transition shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2">
              <PenSquare size={16} /> Create Post
            </button>
          </div>
        </div>

        {/* User Info */}
        <div className="mt-2">
          <h1 className="text-2xl font-bold text-slate-100">{user?.fullName || 'Master Admin'}</h1>
          <p className="text-lg text-slate-300 font-medium">{user?.headline || 'Platform Administrator'}</p>
          <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-slate-400">
            <span className="flex items-center gap-1.5">
              <MapPin size={16} className="text-indigo-400" />
              {user?.location || 'San Francisco, CA'}
            </span>
            <span className="text-indigo-400 font-medium hover:underline cursor-pointer">
              500+ connections
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default AdminHeader;
