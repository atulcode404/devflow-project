import React from 'react';
import { CheckCircle2, TrendingUp, Activity, Hash } from 'lucide-react';
import { motion } from 'framer-motion';

const AdminSidebarRight = () => {
  const trendingTags = [
    { name: '#ReactJS', count: '1.2k' },
    { name: '#TailwindCSS', count: '856' },
    { name: '#WebDev', count: '643' },
    { name: '#NodeJS', count: '592' },
    { name: '#OpenSource', count: '421' },
  ];

  const recentActivity = [
    { text: 'New user registered: Jane Doe', time: '5m ago' },
    { text: 'Server load warning (85%)', time: '12m ago', isAlert: true },
    { text: 'Project "DevFlow UI" marked complete', time: '1h ago' },
    { text: 'System backup successful', time: '3h ago' },
  ];

  return (
    <div className="space-y-6 hidden lg:block sticky top-24">
      {/* Profile Completion */}
      <motion.div 
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="bg-slate-900/60 backdrop-blur-md border border-slate-800 rounded-2xl p-5 shadow-xl"
      >
        <h3 className="text-sm font-bold text-slate-100 mb-4 flex items-center gap-2">
          Profile Completion <CheckCircle2 size={16} className="text-indigo-400" />
        </h3>
        
        <div className="w-full bg-slate-800 rounded-full h-2 mb-2 overflow-hidden">
          <div className="bg-gradient-to-r from-indigo-500 to-purple-500 h-2 rounded-full w-full"></div>
        </div>
        <p className="text-xs text-slate-400 text-right font-semibold">100% Complete</p>
        
        <p className="text-xs text-slate-400 mt-4 leading-relaxed">
          Your admin profile is fully optimized. You can now access all dashboard features and platform analytics.
        </p>
      </motion.div>

      {/* Recent Activities */}
      <motion.div 
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-slate-900/60 backdrop-blur-md border border-slate-800 rounded-2xl p-5 shadow-xl"
      >
        <h3 className="text-sm font-bold text-slate-100 mb-4 flex items-center gap-2">
          Recent Activity <Activity size={16} className="text-emerald-400" />
        </h3>
        
        <div className="space-y-4">
          {recentActivity.map((act, idx) => (
            <div key={idx} className="flex gap-3">
              <div className="flex flex-col items-center">
                <div className={`w-2 h-2 rounded-full mt-1.5 ${act.isAlert ? 'bg-red-400' : 'bg-slate-500'}`}></div>
                {idx !== recentActivity.length - 1 && (
                  <div className="w-px h-full bg-slate-800 mt-2"></div>
                )}
              </div>
              <div>
                <p className={`text-sm ${act.isAlert ? 'text-red-400 font-medium' : 'text-slate-300'}`}>{act.text}</p>
                <p className="text-xs text-slate-500 mt-0.5">{act.time}</p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Trending Tags */}
      <motion.div 
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-slate-900/60 backdrop-blur-md border border-slate-800 rounded-2xl p-5 shadow-xl"
      >
        <h3 className="text-sm font-bold text-slate-100 mb-4 flex items-center gap-2">
          Trending Tags <TrendingUp size={16} className="text-blue-400" />
        </h3>
        
        <ul className="space-y-3">
          {trendingTags.map((tag, idx) => (
            <li key={idx} className="flex justify-between items-center group cursor-pointer">
              <div className="flex items-center gap-2 text-sm font-medium text-slate-300 group-hover:text-indigo-400 transition">
                <Hash size={14} className="text-slate-500 group-hover:text-indigo-400" />
                {tag.name.replace('#', '')}
              </div>
              <span className="text-xs bg-slate-800 text-slate-400 px-2 py-0.5 rounded-md group-hover:bg-indigo-500/10 group-hover:text-indigo-400 transition">
                {tag.count} posts
              </span>
            </li>
          ))}
        </ul>
      </motion.div>
    </div>
  );
};

export default AdminSidebarRight;
