import React from 'react';
import { motion } from 'framer-motion';
import { Briefcase, GraduationCap, ThumbsUp, MessageSquare, Share2 } from 'lucide-react';

const AdminFeed = () => {
  const dummyPosts = [
    {
      id: 1,
      author: 'Master Admin',
      role: 'Platform Administrator',
      time: '2 hours ago',
      content: 'We just rolled out the new v2.0 update for the platform! Check out the new analytics dashboard and improved collaboration tools. Let me know your thoughts below! 🚀 #Launch #DevFlow',
      likes: 124,
      comments: 32,
    },
    {
      id: 2,
      author: 'Master Admin',
      role: 'Platform Administrator',
      time: '1 day ago',
      content: 'Security reminder: We have noticed an increase in spam accounts. We are implementing new rate limits and captcha challenges for connection requests. Stay safe out there! 🛡️',
      likes: 89,
      comments: 14,
    }
  ];

  return (
    <div className="space-y-6 mt-6">
      {/* About Section */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-slate-900/60 backdrop-blur-md border border-slate-800 rounded-2xl p-6 shadow-xl"
      >
        <h3 className="text-lg font-bold text-slate-100 mb-3">About</h3>
        <p className="text-sm text-slate-300 leading-relaxed">
          I am the Master Administrator for the DevFlow platform. My primary responsibility is to ensure a safe, collaborative, and highly performant environment for developers to connect, share ideas, and build the future together. 
        </p>
      </motion.div>

      {/* Experience / Timeline */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-slate-900/60 backdrop-blur-md border border-slate-800 rounded-2xl p-6 shadow-xl"
      >
        <h3 className="text-lg font-bold text-slate-100 mb-6">Experience</h3>
        
        <div className="space-y-6">
          <div className="flex gap-4">
            <div className="mt-1 bg-slate-800 p-2 rounded-lg">
              <Briefcase size={20} className="text-indigo-400" />
            </div>
            <div>
              <h4 className="text-md font-bold text-slate-200">Platform Administrator</h4>
              <p className="text-sm text-slate-400">DevFlow • Full-time</p>
              <p className="text-xs text-slate-500 mt-1 mb-2">Jan 2024 - Present</p>
              <p className="text-sm text-slate-300">Managing a community of elite developers, overseeing moderation, and deploying new features to scale the platform.</p>
            </div>
          </div>
          
          <div className="flex gap-4">
            <div className="mt-1 bg-slate-800 p-2 rounded-lg">
              <GraduationCap size={20} className="text-emerald-400" />
            </div>
            <div>
              <h4 className="text-md font-bold text-slate-200">Lead Security Engineer</h4>
              <p className="text-sm text-slate-400">TechCorp Inc.</p>
              <p className="text-xs text-slate-500 mt-1 mb-2">2019 - 2024</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Activity Feed */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-slate-100 mb-2 mt-4">Activity Feed</h3>
        {dummyPosts.map((post, idx) => (
          <motion.div 
            key={post.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 * idx }}
            className="bg-slate-900/60 backdrop-blur-md border border-slate-800 rounded-2xl p-5 shadow-xl"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center font-bold text-indigo-400">
                {post.author.charAt(0)}
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-200">{post.author}</h4>
                <p className="text-xs text-slate-400">{post.role} • {post.time}</p>
              </div>
            </div>
            
            <p className="text-sm text-slate-300 mb-4 whitespace-pre-wrap">{post.content}</p>
            
            <div className="flex items-center gap-4 text-xs text-slate-400 border-t border-slate-800/60 pt-3 mt-4">
              <span className="flex items-center gap-1.5 hover:text-indigo-400 cursor-pointer transition">
                <ThumbsUp size={14} /> {post.likes} Likes
              </span>
              <span className="flex items-center gap-1.5 hover:text-indigo-400 cursor-pointer transition">
                <MessageSquare size={14} /> {post.comments} Comments
              </span>
              <span className="flex items-center gap-1.5 hover:text-indigo-400 cursor-pointer transition ml-auto">
                <Share2 size={14} /> Share
              </span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default AdminFeed;
