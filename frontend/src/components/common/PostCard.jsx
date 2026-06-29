import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ThumbsUp, MessageSquare, Share2, Bookmark, BadgeCheck, Eye, Github, ExternalLink, UserPlus, UserMinus } from 'lucide-react';
import api from '../../services/api';

const PostCard = ({ post, currentUser, onPostUpdate }) => {
  const [isLiking, setIsLiking] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isFollowing, setIsFollowing] = useState(
    currentUser && post.author?.followers?.includes(currentUser._id)
  ); // Optimistic state for post author follow
  
  const isLiked = post.likes?.includes(currentUser?._id);
  const isSaved = post.saves?.includes(currentUser?._id);
  const isOwnPost = currentUser?._id === post.author?._id;

  const handleLike = async () => {
    if (!currentUser) return;
    try {
      setIsLiking(true);
      const res = await api.post(`/posts/${post._id}/like`);
      onPostUpdate({ ...post, likes: res.data });
    } catch (err) {
      console.error(err);
    } finally {
      setIsLiking(false);
    }
  };

  const handleSave = async () => {
    if (!currentUser) return;
    try {
      setIsSaving(true);
      const res = await api.post(`/posts/${post._id}/save`);
      onPostUpdate({ ...post, saves: res.data });
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleShare = async () => {
    if (!currentUser) return;
    try {
      const res = await api.post(`/posts/${post._id}/share`);
      onPostUpdate({ ...post, shares: res.data });
      alert('Post shared!');
    } catch (err) {
      console.error(err);
    }
  };

  const handleFollowAuthor = async () => {
    if (!currentUser || !post.author) return;
    try {
      const res = await api.post(`/users/${post.author._id}/follow`);
      setIsFollowing(res.data.isFollowing);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-slate-900/60 backdrop-blur-xl border border-white/5 hover:border-white/10 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden mb-6 group"
    >
      {/* Post Header */}
      <div className="p-5 flex items-start justify-between border-b border-slate-800/50 bg-slate-950/30">
        <div className="flex gap-4 items-center">
          {post.author ? (
            <Link to={`/developer/${post.author.username || post.author._id}`}>
              <img 
                src={post.author.profilePicture || 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png'} 
                alt={post.author.fullName} 
                className="w-14 h-14 rounded-xl border border-slate-700 object-cover cursor-pointer hover:opacity-80 transition shadow-md"
              />
            </Link>
          ) : (
            <div className="w-14 h-14 rounded-xl border border-slate-700 bg-slate-800 flex items-center justify-center text-slate-500 shadow-md">
              <Eye size={24} />
            </div>
          )}
          
          <div className="flex flex-col justify-center">
            <div className="flex items-center gap-2">
              {post.author ? (
                <Link to={`/developer/${post.author.username || post.author._id}`} className="hover:underline flex items-center gap-1.5">
                  <h4 className="font-bold text-slate-100 text-base">{post.author.fullName}</h4>
                  {(post.author.role === 'admin' || post.author.role === 'master_admin') && (
                    <BadgeCheck size={16} className="text-indigo-400" />
                  )}
                </Link>
              ) : (
                <h4 className="font-bold text-slate-400 text-base flex items-center gap-1.5">Unknown User</h4>
              )}
              
              {!isOwnPost && post.author && (
                <>
                  <span className="text-slate-600">•</span>
                  <button 
                    onClick={handleFollowAuthor}
                    className={`text-xs font-bold flex items-center gap-1 transition ${
                      isFollowing ? 'text-slate-400 hover:text-slate-300' : 'text-indigo-400 hover:text-indigo-300'
                    }`}
                  >
                    {isFollowing ? 'Following' : <><UserPlus size={14}/> Follow</>}
                  </button>
                </>
              )}
            </div>
            
            <p className="text-xs text-slate-400 font-medium">{post.author?.headline || post.author?.role || 'Developer'}</p>
            <p className="text-[10px] text-slate-500 mt-1 flex items-center gap-2">
              {new Date(post.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
              {post.postType && (
                <>
                  <span className="w-1 h-1 rounded-full bg-slate-600"></span>
                  <span className="text-slate-400 font-bold uppercase tracking-wider text-[9px]">
                    {post.postType}
                  </span>
                </>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Post Content */}
      <div className="p-5">
        {post.title && <h3 className="text-xl font-black text-slate-100 mb-3 leading-tight">{post.title}</h3>}
        {post.description && <p className="text-sm text-slate-300 mb-3 leading-relaxed">{post.description}</p>}
        {post.content && <p className="text-sm text-slate-300 mb-4 whitespace-pre-wrap leading-relaxed">{post.content}</p>}
        
        {/* Project Specific Info / Links */}
        {(post.projectLink || post.liveDemoLink || post.projectType || post.experienceLevel || (post.requiredSkills && post.requiredSkills.length > 0)) && (
          <div className="bg-slate-950/50 rounded-xl p-4 border border-slate-800/80 mb-2 mt-4 shadow-inner">
            
            <div className="flex flex-wrap gap-2 mb-4">
              {post.projectType && (
                <span className="px-3 py-1 bg-indigo-500/10 text-indigo-400 rounded-lg text-xs font-bold border border-indigo-500/20">
                  {post.projectType}
                </span>
              )}
              {post.experienceLevel && (
                <span className="px-3 py-1 bg-slate-800 text-slate-300 rounded-lg text-xs font-bold border border-slate-700">
                  {post.experienceLevel}
                </span>
              )}
              {post.requiredSkills && post.requiredSkills.map((skill, idx) => (
                <span key={idx} className="px-3 py-1 bg-slate-800 text-slate-400 rounded-lg text-xs font-bold border border-slate-700">
                  {skill}
                </span>
              ))}
            </div>
            
            {(post.projectLink || post.liveDemoLink) && (
              <div className="flex flex-wrap gap-3">
                {post.projectLink && (
                  <a href={post.projectLink} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center flex-1 gap-2 text-sm font-bold text-slate-200 hover:text-white bg-slate-800 hover:bg-slate-700 px-4 py-2.5 rounded-xl transition-all shadow-sm border border-slate-700 hover:border-slate-600">
                    <Github size={16} /> GitHub Repo
                  </a>
                )}
                {post.liveDemoLink && (
                  <a href={post.liveDemoLink} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center flex-1 gap-2 text-sm font-bold text-indigo-100 hover:text-white bg-indigo-600 hover:bg-indigo-500 px-4 py-2.5 rounded-xl transition-all shadow-lg shadow-indigo-900/40">
                    <ExternalLink size={16} /> Live Demo
                  </a>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Post Images */}
      {post.images && post.images.length > 0 && (
        <div className="w-full max-h-[500px] overflow-hidden bg-slate-950 flex justify-center border-y border-slate-800">
          <img src={post.images[0]} alt="Post content" className="object-cover w-full h-full max-h-[500px]" />
        </div>
      )}

      {/* Post Metrics Summary */}
      <div className="px-5 py-3 border-b border-slate-800/50 flex justify-between items-center text-xs text-slate-400 font-medium bg-slate-950/20">
        <div className="flex gap-3">
          {post.likes?.length > 0 && (
            <span className="flex items-center gap-1.5 text-slate-300">
              <span className="bg-indigo-500/20 p-1 rounded-full"><ThumbsUp size={12} className="text-indigo-400" /></span> 
              {post.likes.length}
            </span>
          )}
          {post.views !== undefined && (
            <span className="flex items-center gap-1.5 text-slate-400">
              <Eye size={12} /> {post.views}
            </span>
          )}
        </div>
        <div className="flex gap-4">
          {post.comments?.length > 0 && <span className="hover:text-indigo-400 transition cursor-pointer">{post.comments.length} comments</span>}
          {post.shares?.length > 0 && <span className="hover:text-indigo-400 transition cursor-pointer">{post.shares.length} shares</span>}
        </div>
      </div>

      {/* Action Bar */}
      <div className="px-3 py-2 flex justify-between bg-slate-950/20">
        <button 
          onClick={handleLike}
          disabled={isLiking}
          className={`flex-1 flex justify-center items-center gap-2 py-3 rounded-xl text-sm font-bold transition-all ${isLiked ? 'text-indigo-400 bg-indigo-500/10' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}
        >
          <ThumbsUp size={18} className={isLiked ? "fill-indigo-400" : ""} /> 
          <span className="hidden sm:inline">Like</span>
        </button>
        <button 
          className="flex-1 flex justify-center items-center gap-2 py-3 rounded-xl text-sm font-bold text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-all"
        >
          <MessageSquare size={18} /> 
          <span className="hidden sm:inline">Comment</span>
        </button>
        <button 
          onClick={handleShare}
          className="flex-1 flex justify-center items-center gap-2 py-3 rounded-xl text-sm font-bold text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-all"
        >
          <Share2 size={18} /> 
          <span className="hidden sm:inline">Share</span>
        </button>
        <button 
          onClick={handleSave}
          disabled={isSaving}
          className={`flex-1 flex justify-center items-center gap-2 py-3 rounded-xl text-sm font-bold transition-all ${isSaved ? 'text-indigo-400 bg-indigo-500/10' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}
        >
          <Bookmark size={18} className={isSaved ? "fill-indigo-400" : ""} /> 
          <span className="hidden sm:inline">Save</span>
        </button>
      </div>
    </motion.div>
  );
};

export default PostCard;
