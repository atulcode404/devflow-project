import React, { useEffect } from 'react';
import { X, Bell, MessageSquare, UserCheck, Eye, Heart, MessageCircle } from 'lucide-react';

const NotificationToast = ({ notification, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 4000);

    return () => clearTimeout(timer);
  }, [onClose]);

  const getIcon = (type) => {
    switch (type) {
      case 'connection_request': return <Bell className="text-blue-400" size={16} />;
      case 'connection_accepted': return <UserCheck className="text-green-400" size={16} />;
      case 'message_received': return <MessageSquare className="text-indigo-400" size={16} />;
      case 'profile_viewed': return <Eye className="text-purple-400" size={16} />;
      case 'post_liked': return <Heart className="text-red-500" size={16} fill="currentColor" />;
      case 'post_commented': return <MessageCircle className="text-yellow-400" size={16} />;
      default: return <Bell className="text-slate-400" size={16} />;
    }
  };

  return (
    <div className="fixed top-20 right-4 z-50 max-w-sm w-full bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden animate-in slide-in-from-right duration-350">
      <div className="p-4 flex items-start gap-3">
        {/* Icon wrapper */}
        <div className="p-2 bg-slate-950 rounded-lg flex-shrink-0 border border-slate-850">
          {getIcon(notification.type)}
        </div>
        
        {/* Text Details */}
        <div className="flex-1 min-w-0">
          <h4 className="text-xs font-bold text-slate-100">{notification.title}</h4>
          <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">{notification.message}</p>
        </div>

        {/* Close Button */}
        <button 
          onClick={onClose}
          className="text-slate-500 hover:text-slate-350 p-0.5 rounded transition"
        >
          <X size={14} />
        </button>
      </div>
      {/* Animated bottom progress bar */}
      <div className="h-0.5 bg-indigo-500 w-full animate-out fade-out duration-4000 origin-left scale-x-0"></div>
    </div>
  );
};

export default NotificationToast;
