import React, { useState, useContext } from 'react';
import { Heart, MessageSquare, Send, Trash2, Calendar, Sparkles, User, AlertCircle } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';

const PostCard = ({ post, onPostDeleted }) => {
  const { user } = useContext(AuthContext);
  const [likes, setLikes] = useState(post?.likes || []);
  const [comments, setComments] = useState(post?.comments || []);
  const [commentText, setCommentText] = useState('');
  const [showComments, setShowComments] = useState(false);
  const [isLiking, setIsLiking] = useState(false);
  const [isCommenting, setIsCommenting] = useState(false);

  const isLikedByMe = user && likes?.includes(user._id);
  const isMyPost = user && post?.author?._id === user._id;

  const handleLike = async () => {
    if (!user) return;
    if (isLiking) return;
    setIsLiking(true);

    try {
      const res = await api.post(`/posts/${post._id}/like`);
      setLikes(res.data);
    } catch (err) {
      console.error('Error liking post', err);
    } finally {
      setIsLiking(false);
    }
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!commentText.trim() || !user || isCommenting) return;
    setIsCommenting(true);

    try {
      const res = await api.post(`/posts/${post._id}/comment`, { text: commentText });
      setComments(res.data);
      setCommentText('');
    } catch (err) {
      console.error('Error adding comment', err);
    } finally {
      setIsCommenting(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this collaboration post?')) return;

    try {
      await api.delete(`/posts/${post._id}`);
      onPostDeleted(post._id);
    } catch (err) {
      alert('Error deleting post');
    }
  };

  // Badge styling helpers
  const getProjectTypeBadge = (type) => {
    switch (type) {
      case 'Startup': return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      case 'Hackathon': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'Open Source': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      default: return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20';
    }
  };

  return (
    <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-800 rounded-2xl overflow-hidden shadow-lg hover:border-slate-700 transition duration-300">
      <div className="p-6 space-y-4">
        
        {/* Header Block */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <img 
              src={post?.author?.profilePicture || 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png'} 
              alt="Author avatar" 
              className="w-10 h-10 rounded-full object-cover border border-slate-800"
            />
            <div>
              <h4 className="font-bold text-slate-100 text-sm">{post?.author?.fullName || 'Anonymous Developer'}</h4>
              <p className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                <Calendar size={11} />
                {new Date(post?.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className={`text-[10px] font-semibold border px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
              post.status === 'open' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-slate-800 text-slate-400 border-slate-700'
            }`}>
              {post.status}
            </span>
            {isMyPost && (
              <button 
                onClick={handleDelete}
                className="p-1.5 bg-slate-950/60 hover:bg-red-500/10 border border-slate-850 text-slate-500 hover:text-red-400 rounded-lg transition"
                title="Delete Post"
              >
                <Trash2 size={13} />
              </button>
            )}
          </div>
        </div>

        {/* Content Block */}
        <div className="space-y-2">
          <h3 className="text-base font-extrabold text-slate-100 tracking-tight leading-snug">{post.title}</h3>
          <p className="text-slate-400 text-xs leading-relaxed whitespace-pre-wrap">{post.description}</p>
        </div>

        {/* Requirements Badges Grid */}
        <div className="flex flex-wrap items-center gap-2 pt-1 text-[10px] font-bold">
          <span className={`px-2.5 py-0.5 border rounded-lg ${getProjectTypeBadge(post.projectType)}`}>
            {post.projectType}
          </span>
          <span className="px-2.5 py-0.5 bg-slate-950/60 border border-slate-850 text-slate-300 rounded-lg">
            Exp: {post.experienceLevel}
          </span>
        </div>

        {/* Required Skills list */}
        {post.requiredSkills.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {post.requiredSkills.map((skill, index) => (
              <span 
                key={index} 
                className="px-2 py-0.5 bg-slate-950/30 border border-slate-850/60 text-slate-400 text-[10px] rounded-lg font-medium"
              >
                {skill}
              </span>
            ))}
          </div>
        )}

        {/* Contact Method Box */}
        <div className="bg-slate-950/40 border border-slate-850/60 rounded-xl p-3 flex items-center gap-2 text-xs text-slate-400 mt-2">
          <AlertCircle size={14} className="text-indigo-400 flex-shrink-0" />
          <span className="truncate"><strong>Contact:</strong> {post.contactMethod}</span>
        </div>

        {/* Interaction Actions Footer */}
        <div className="flex items-center gap-4 pt-3 border-t border-slate-850/60 text-xs font-bold text-slate-400">
          <button 
            onClick={handleLike}
            disabled={!user}
            className={`flex items-center gap-1.5 transition ${
              isLikedByMe ? 'text-red-500 hover:text-red-400' : 'hover:text-red-400'
            }`}
          >
            <Heart size={16} fill={isLikedByMe ? 'currentColor' : 'none'} />
            <span>{likes.length} Likes</span>
          </button>
          
          <button 
            onClick={() => setShowComments(!showComments)}
            className="flex items-center gap-1.5 hover:text-indigo-400 transition"
          >
            <MessageSquare size={16} />
            <span>{comments.length} Comments</span>
          </button>
        </div>

      </div>

      {/* Expandable Comments Section Drawer */}
      {showComments && (
        <div className="bg-slate-950/40 border-t border-slate-850/80 p-5 space-y-4">
          
          {/* Comments List */}
          {comments.length > 0 ? (
            <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
              {comments.map((comment) => (
                <div key={comment._id} className="flex gap-2.5 items-start bg-slate-950/30 border border-slate-900/80 p-3 rounded-xl">
                  <img 
                    src={comment.user.profilePicture || 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png'} 
                    alt="Commenter" 
                    className="w-6 h-6 rounded-full object-cover mt-0.5 border border-slate-800"
                  />
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] font-bold text-slate-200">{comment.user.fullName}</span>
                      <span className="text-[9px] text-slate-500">
                        {new Date(comment.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed break-words">{comment.text}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[11px] text-slate-500 italic text-center py-2">No comments yet. Start the conversation!</p>
          )}

          {/* Add Comment input form */}
          {user ? (
            <form onSubmit={handleCommentSubmit} className="flex gap-2">
              <input 
                type="text" 
                placeholder="Write a comment..."
                className="flex-1 bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 outline-none focus:border-indigo-500 text-[11px] text-slate-100 transition placeholder-slate-600"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                required
              />
              <button 
                type="submit" 
                disabled={!commentText.trim() || isCommenting}
                className="p-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl flex items-center justify-center transition cursor-pointer"
              >
                <Send size={12} />
              </button>
            </form>
          ) : (
            <p className="text-[11px] text-slate-600 italic text-center">Please log in to comment.</p>
          )}

        </div>
      )}

    </div>
  );
};

export default PostCard;
