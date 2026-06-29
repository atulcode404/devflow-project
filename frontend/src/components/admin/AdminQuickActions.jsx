import React from 'react';
import { motion } from 'framer-motion';
import { PlusCircle, Users, Briefcase, MessageSquare, BarChart2, Settings } from 'lucide-react';

const AdminQuickActions = ({ onActionClick, activeTab }) => {
  const actions = [
    { id: 'create', label: 'Create Post', icon: <PlusCircle size={20} />, color: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20 hover:bg-indigo-500/20' },
    { id: 'users', label: 'Manage Users', icon: <Users size={20} />, color: 'bg-blue-500/10 text-blue-400 border-blue-500/20 hover:bg-blue-500/20' },
    { id: 'projects', label: 'Manage Projects', icon: <Briefcase size={20} />, color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20' },
    { id: 'messages', label: 'Messages', icon: <MessageSquare size={20} />, color: 'bg-purple-500/10 text-purple-400 border-purple-500/20 hover:bg-purple-500/20' },
    { id: 'reports', label: 'Reports', icon: <BarChart2 size={20} />, color: 'bg-orange-500/10 text-orange-400 border-orange-500/20 hover:bg-orange-500/20' },
    { id: 'settings', label: 'Settings', icon: <Settings size={20} />, color: 'bg-slate-500/10 text-slate-400 border-slate-500/20 hover:bg-slate-500/20' },
  ];

  return (
    <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800 rounded-2xl p-6 shadow-xl mt-6">
      <h3 className="text-lg font-bold text-slate-100 mb-4">Quick Actions</h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {actions.map((action, idx) => {
          const isActive = activeTab === action.id;
          return (
            <motion.button
              key={action.id}
              onClick={() => onActionClick(action.id)}
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              className={`flex flex-col items-center justify-center gap-2 p-4 rounded-xl border transition-all ${
                isActive 
                  ? 'bg-slate-800 border-slate-600 shadow-md ring-2 ring-indigo-500/50' 
                  : action.color
              }`}
            >
              <div className="mb-1">{action.icon}</div>
              <span className="text-xs font-semibold whitespace-nowrap">{action.label}</span>
            </motion.button>
          )
        })}
      </div>
    </div>
  );
};

export default AdminQuickActions;
