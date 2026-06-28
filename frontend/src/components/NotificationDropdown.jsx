import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Bell, MessageSquare, UserCheck, Eye, Heart, MessageCircle, CheckSquare, Trash 
} from 'lucide-react';

const NotificationDropdown = ({ 
  notifications, 
  onClose, 
  onMarkRead, 
  onMarkAllRead, 
  onClearAll 
}) => {
  const navigate = useNavigate();

  const getIcon = (type) => {
    switch (type) {
      case 'connection_request': return <Bell className="text-blue-400" size={14} />;
      case 'connection_accepted': return <UserCheck className="text-green-400" size={14} />;
      case 'message_received': return <MessageSquare className="text-indigo-400" size={14} />;
      case 'profile_viewed': return <Eye className="text-purple-400" size={14} />;
      case 'post_liked': return <Heart className="text-red-500" size={14} fill="currentColor" />;
      case 'post_commented': return <MessageCircle className="text-yellow-400" size={14} />;
      default: return <Bell className="text-slate-400" size={14} />;
    }
  };

  const handleNotificationClick = async (notif) => {
    await onMarkRead(notif._id);
    onClose();
    if (notif.link) {
      navigate(notif.link);
    }
  };

  return (
    <div className="absolute right-0 mt-3 w-80 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-3 duration-200">
      
      {/* Header */}
      <div className="px-4 py-3 bg-slate-950/60 border-b border-slate-850 flex items-center justify-between">
        <span className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
          <Bell size={14} className="text-indigo-400" /> Notifications
        </span>
        {notifications.some(n => !n.isRead) && (
          <button 
            onClick={onMarkAllRead}
            className="text-[10px] text-indigo-400 hover:text-indigo-300 font-bold transition flex items-center gap-1 cursor-pointer"
          >
            <CheckSquare size={11} /> Mark read
          </button>
        )}
      </div>

      {/* List */}
      <div className="max-h-64 overflow-y-auto divide-y divide-slate-850/60">
        {notifications.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-xs italic">
            No notifications yet.
          </div>
        ) : (
          notifications.slice(0, 5).map((notif) => (
            <div 
              key={notif._id} 
              onClick={() => handleNotificationClick(notif)}
              className={`p-3.5 flex items-start gap-3 cursor-pointer transition relative group ${
                notif.isRead ? 'hover:bg-slate-950/20' : 'bg-indigo-600/5 hover:bg-indigo-650/10'
              }`}
            >
              {/* Unread marker dot */}
              {!notif.isRead && (
                <span className="absolute top-4 right-4 w-2 h-2 rounded-full bg-indigo-500"></span>
              )}
              
              {/* Sender Avatar */}
              <img 
                src={notif.sender?.profilePicture || 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png'} 
                alt="Sender avatar" 
                className="w-8 h-8 rounded-full object-cover mt-0.5 border border-slate-850"
              />
              
              {/* Details */}
              <div className="flex-1 min-w-0 pr-2">
                <div className="flex items-center gap-1.5">
                  <span className="p-0.5 bg-slate-950 rounded text-[9px] border border-slate-850">
                    {getIcon(notif.type)}
                  </span>
                  <h5 className="text-[11px] font-bold text-slate-200 truncate">{notif.title}</h5>
                </div>
                <p className="text-[10px] text-slate-400 mt-1 leading-snug line-clamp-2">{notif.message}</p>
                <span className="text-[8px] text-slate-500 mt-1 block">
                  {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-2 bg-slate-950/60 border-t border-slate-850 flex items-center justify-between text-[10px] font-bold">
        {notifications.length > 0 && (
          <button 
            onClick={onClearAll}
            className="text-slate-500 hover:text-red-400 transition flex items-center gap-1 cursor-pointer"
          >
            <Trash size={11} /> Clear all
          </button>
        )}
        <button 
          onClick={() => {
            navigate('/notifications');
            onClose();
          }}
          className="text-indigo-400 hover:text-indigo-300 transition ml-auto cursor-pointer"
        >
          View all
        </button>
      </div>

    </div>
  );
};

export default NotificationDropdown;
