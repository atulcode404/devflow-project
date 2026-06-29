import React from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { UserPlus, UserMinus, MessageSquare, MapPin, Briefcase, FolderGit2, CheckCircle2 } from 'lucide-react';
import StatusIndicator from './StatusIndicator';

const DeveloperCard = ({ developer, isFollowing, onToggleFollow }) => {
  const navigate = useNavigate();
  
  const isDefaultAvatar = !developer.profilePicture || developer.profilePicture.includes('blank-profile-picture');
  const avatarUrl = isDefaultAvatar 
    ? `https://ui-avatars.com/api/?name=${encodeURIComponent(developer.fullName)}&background=random&color=fff&rounded=true&bold=true` 
    : developer.profilePicture;

  const handleMessage = () => {
    navigate('/connections', { state: { openChatWith: developer } });
  };

  return (
    <motion.div 
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className="bg-slate-900/80 backdrop-blur-md border border-slate-700/50 rounded-2xl overflow-hidden shadow-lg hover:shadow-indigo-500/10 hover:border-indigo-500/30 transition-all duration-300 flex flex-col h-full"
    >
      {/* Cover Image & Profile Pic */}
      <div className="h-24 bg-gradient-to-r from-indigo-900/60 to-purple-900/60 relative border-b border-slate-700/50">
        {developer.backgroundPicture && (
          <img src={developer.backgroundPicture} alt="Cover" className="w-full h-full object-cover opacity-50 mix-blend-overlay" />
        )}
        <div className="absolute -bottom-10 left-1/2 -translate-x-1/2">
          <Link to={`/developer/${developer.username || developer._id}`}>
            <img 
              src={avatarUrl} 
              alt={developer.fullName} 
              className="w-20 h-20 rounded-full border-4 border-slate-900 object-cover cursor-pointer hover:scale-105 transition-transform duration-300 shadow-xl"
            />
          </Link>
        </div>
      </div>

      <div className="pt-12 pb-6 px-5 flex flex-col items-center flex-1 text-center">
        <Link to={`/developer/${developer.username || developer._id}`} className="hover:text-indigo-400 transition-colors">
          <h3 className="text-xl font-bold text-slate-100">{developer.fullName}</h3>
        </Link>
        <p className="text-sm font-medium text-indigo-400/90 mb-1 line-clamp-1">{developer.headline || developer.role || 'Developer'}</p>
        
        <div className="flex items-center gap-3 text-xs text-slate-400 mb-3">
          {developer.location && (
            <span className="flex items-center gap-1">
              <MapPin size={12} /> {developer.location}
            </span>
          )}
          <StatusIndicator isOnline={developer.isOnline} lastSeen={developer.lastSeen} />
        </div>

        {/* Stats & Info */}
        <div className="w-full grid grid-cols-2 gap-2 mb-4 text-xs">
          <div className="bg-slate-950/50 rounded-lg p-2 flex flex-col items-center justify-center border border-slate-800/50">
            <span className="text-slate-500 flex items-center gap-1 mb-1"><Briefcase size={12}/> Experience</span>
            <span className="font-semibold text-slate-300">{developer.experienceLevel || 'Intermediate'}</span>
          </div>
          <div className="bg-slate-950/50 rounded-lg p-2 flex flex-col items-center justify-center border border-slate-800/50">
            <span className="text-slate-500 flex items-center gap-1 mb-1"><FolderGit2 size={12}/> Projects</span>
            <span className="font-semibold text-slate-300">{developer.projects?.length || 0}</span>
          </div>
        </div>

        {/* Skills Preview */}
        <div className="flex-1 w-full flex flex-col justify-center">
          {developer.skills && developer.skills.length > 0 ? (
            <div className="flex flex-wrap justify-center gap-1.5 mb-4">
              {developer.skills.slice(0, 3).map((skill, idx) => (
                <span key={idx} className="px-2.5 py-1 bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 rounded-full text-[11px] font-medium tracking-wide">
                  {skill}
                </span>
              ))}
              {developer.skills.length > 3 && (
                <span className="px-2.5 py-1 bg-slate-800 text-slate-400 rounded-full text-[11px] font-medium tracking-wide border border-slate-700">
                  +{developer.skills.length - 3}
                </span>
              )}
            </div>
          ) : (
             <div className="h-8 mb-4"></div>
          )}
        </div>

        {/* Availability Badge */}
        {developer.availability && developer.availability !== 'Not Available' && (
          <div className="mb-5 flex items-center gap-1.5 text-xs font-medium text-emerald-400 bg-emerald-400/10 px-3 py-1 rounded-full border border-emerald-400/20">
            <CheckCircle2 size={12} />
            Available for {developer.availability}
          </div>
        )}
        
        {/* Actions */}
        <div className="mt-auto pt-2 w-full grid grid-cols-2 gap-2">
          <button 
            onClick={() => onToggleFollow(developer._id)}
            className={`py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all duration-300 ${
              isFollowing 
                ? 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700' 
                : 'bg-indigo-600 text-white hover:bg-indigo-500 hover:shadow-lg hover:shadow-indigo-500/25 border border-indigo-500'
            }`}
          >
            {isFollowing ? <><UserMinus size={14} /> Unfollow</> : <><UserPlus size={14} /> Follow</>}
          </button>
          
          <button 
            onClick={handleMessage}
            className="py-2 border border-slate-700 bg-slate-800 hover:bg-slate-700 hover:border-slate-600 rounded-xl text-xs font-bold text-slate-200 flex items-center justify-center gap-1.5 transition-all duration-300 shadow-sm"
          >
            <MessageSquare size={14} /> Message
          </button>

          <Link 
            to={`/developer/${developer.username || developer._id}`}
            className="col-span-2 py-2 mt-1 bg-transparent hover:bg-slate-800/50 text-slate-400 hover:text-slate-200 rounded-xl text-xs font-bold flex items-center justify-center transition-colors border border-transparent hover:border-slate-700/50"
          >
            View Full Profile
          </Link>
        </div>
      </div>
    </motion.div>
  );
};

export default DeveloperCard;
