import React from 'react';
import { motion } from 'framer-motion';
import { Users, FileText, Briefcase, DollarSign, Eye, UserPlus, Heart } from 'lucide-react';

const AdminStatsWidgets = ({ stats }) => {
  // LinkedIn profile style stats
  const profileStats = [
    { label: 'Total Posts', value: '142', icon: <FileText size={16} /> },
    { label: 'Followers', value: '12.4k', icon: <UserPlus size={16} /> },
    { label: 'Following', value: '842', icon: <Users size={16} /> },
    { label: 'Profile Views', value: '3,842', icon: <Eye size={16} /> },
  ];

  // Dashboard widgets (mixing real stats with dummy for UI)
  const dashboardWidgets = [
    { label: 'Total Users', value: stats?.totalUsers || '0', icon: <Users size={24} />, color: 'from-blue-500 to-indigo-600', trend: '+12% this week' },
    { label: 'Total Posts', value: stats?.totalPosts || '0', icon: <FileText size={24} />, color: 'from-purple-500 to-pink-600', trend: '+5% this week' },
    { label: 'Active Projects', value: '1,204', icon: <Briefcase size={24} />, color: 'from-emerald-500 to-teal-600', trend: '+18% this month' },
    { label: 'Revenue', value: '$42,500', icon: <DollarSign size={24} />, color: 'from-orange-500 to-red-600', trend: '+8% this month' },
  ];

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="space-y-6">
      {/* Profile Stats Row */}
      <motion.div 
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-2 sm:grid-cols-4 gap-4"
      >
        {profileStats.map((stat, idx) => (
          <motion.div 
            key={idx}
            variants={item}
            whileHover={{ scale: 1.05 }}
            className="bg-slate-900/60 backdrop-blur-md border border-slate-800 rounded-xl p-4 flex flex-col items-center justify-center gap-2 cursor-pointer shadow-lg hover:shadow-indigo-500/10 transition-shadow"
          >
            <div className="text-slate-400">{stat.icon}</div>
            <h3 className="text-2xl font-bold text-slate-100">{stat.value}</h3>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">{stat.label}</p>
          </motion.div>
        ))}
      </motion.div>

      {/* Main Dashboard Widgets */}
      <h2 className="text-xl font-bold text-slate-200 mt-8 mb-4 flex items-center gap-2">
        Platform Overview
      </h2>
      <motion.div 
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {dashboardWidgets.map((widget, idx) => (
          <motion.div 
            key={idx}
            variants={item}
            whileHover={{ y: -5 }}
            className="bg-slate-900/60 backdrop-blur-md border border-slate-800 rounded-2xl p-5 relative overflow-hidden shadow-xl group cursor-pointer"
          >
            <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${widget.color} rounded-bl-full opacity-10 group-hover:opacity-20 transition-opacity`}></div>
            
            <div className="flex justify-between items-start mb-4">
              <div className={`p-3 rounded-xl bg-gradient-to-br ${widget.color} bg-opacity-10 text-white shadow-lg`}>
                {widget.icon}
              </div>
            </div>
            
            <h3 className="text-3xl font-black text-slate-100 mb-1">{widget.value}</h3>
            <p className="text-sm font-medium text-slate-400">{widget.label}</p>
            
            <div className="mt-4 pt-4 border-t border-slate-800/50 flex items-center text-xs">
              <span className="text-emerald-400 font-semibold">{widget.trend}</span>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
};

export default AdminStatsWidgets;
