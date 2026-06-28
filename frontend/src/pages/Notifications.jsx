import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Bell, MessageSquare, UserCheck, Eye, Heart, MessageCircle, 
  Trash2, CheckSquare, Loader2, RefreshCw, X 
} from 'lucide-react';
import api from '../services/api';

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Filters state
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' or 'unread'
  const [typeFilter, setTypeFilter] = useState('all'); // 'all', 'connections', 'projects', 'messages'

  const navigate = useNavigate();

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.get('/notifications');
      setNotifications(res.data);
    } catch (err) {
      setError('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications(notifications.map(n => n._id === id ? { ...n, isRead: true } : n));
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setNotifications(notifications.map(n => ({ ...n, isRead: true })));
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation(); // Avoid triggering navigation
    try {
      await api.delete(`/notifications/${id}`);
      setNotifications(notifications.filter(n => n._id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const handleClearAll = async () => {
    if (!window.confirm('Are you sure you want to clear all your notifications?')) return;
    try {
      await api.delete('/notifications/clear-all');
      setNotifications([]);
    } catch (err) {
      console.error(err);
    }
  };

  const handleNotificationClick = async (notif) => {
    if (!notif.isRead) {
      await handleMarkRead(notif._id);
    }
    if (notif.link) {
      navigate(notif.link);
    }
  };

  // Helper icons mapper
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

  // Filter logic
  const filteredNotifications = notifications.filter(notif => {
    // 1. Status Filter
    if (statusFilter === 'unread' && notif.isRead) return false;

    // 2. Type Filter
    if (typeFilter === 'connections') {
      return ['connection_request', 'connection_accepted'].includes(notif.type);
    }
    if (typeFilter === 'projects') {
      return ['post_liked', 'post_commented'].includes(notif.type);
    }
    if (typeFilter === 'messages') {
      return notif.type === 'message_received';
    }
    return true;
  });

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-950 text-slate-100 py-10 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Glow shapes */}
      <div className="absolute top-10 left-10 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl"></div>
      <div className="absolute bottom-20 right-20 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl"></div>

      <div className="max-w-4xl mx-auto relative z-10 space-y-6">
        
        {/* Header Block */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-900 pb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-100 flex items-center gap-2">
              <Bell size={28} className="text-indigo-400" /> Notifications Manager
            </h1>
            <p className="text-slate-400 text-xs sm:text-sm mt-1.5">
              Manage notifications and respond to developer requests or feedback.
            </p>
          </div>

          <div className="flex items-center gap-2 mt-2 sm:mt-0">
            {notifications.some(n => !n.isRead) && (
              <button 
                onClick={handleMarkAllRead}
                className="px-4 py-2 bg-indigo-600/10 border border-indigo-500/25 hover:bg-indigo-650/20 text-indigo-400 text-xs font-bold rounded-xl flex items-center gap-1.5 transition cursor-pointer"
              >
                <CheckSquare size={14} /> Mark all read
              </button>
            )}
            {notifications.length > 0 && (
              <button 
                onClick={handleClearAll}
                className="px-4 py-2 bg-slate-900 border border-slate-800 hover:bg-red-500/10 hover:border-red-500/20 hover:text-red-400 text-slate-400 text-xs font-bold rounded-xl flex items-center gap-1.5 transition cursor-pointer"
              >
                <Trash2 size={14} /> Clear all
              </button>
            )}
            <button 
              onClick={fetchNotifications}
              className="p-2 bg-slate-900 border border-slate-805 hover:bg-slate-800 rounded-xl transition text-slate-400"
              title="Refresh"
            >
              <RefreshCw size={14} />
            </button>
          </div>
        </div>

        {/* Filters Selectors Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/30 border border-slate-850 p-4 rounded-2xl">
          {/* Status Tabs */}
          <div className="flex gap-2">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold border transition ${
                statusFilter === 'all' 
                  ? 'bg-indigo-600 border-indigo-500 text-white shadow-md shadow-indigo-950/20' 
                  : 'bg-slate-950 border-slate-850 text-slate-400 hover:text-slate-200'
              }`}
            >
              All ({notifications.length})
            </button>
            <button
              onClick={() => setStatusFilter('unread')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold border transition ${
                statusFilter === 'unread' 
                  ? 'bg-indigo-600 border-indigo-500 text-white shadow-md shadow-indigo-950/20' 
                  : 'bg-slate-950 border-slate-850 text-slate-400 hover:text-slate-200'
              }`}
            >
              Unread ({notifications.filter(n => !n.isRead).length})
            </button>
          </div>

          {/* Type Select Filter */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Type Filter:</span>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
            >
              <option value="all">All Categories</option>
              <option value="connections">Connections & Requests</option>
              <option value="projects">Project Likes/Comments</option>
              <option value="messages">Direct Messages</option>
            </select>
          </div>
        </div>

        {/* Notifications Listing */}
        {loading ? (
          <div className="flex flex-col justify-center items-center h-64 space-y-3 bg-slate-900/10 border border-slate-900 rounded-2xl">
            <Loader2 className="animate-spin h-10 w-10 text-indigo-500" />
            <p className="text-slate-500 text-xs animate-pulse">Loading notifications...</p>
          </div>
        ) : error ? (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-2xl text-center text-sm font-semibold">
            {error}
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="bg-slate-900/40 border border-slate-850 rounded-2xl p-16 text-center max-w-md mx-auto space-y-4">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-slate-950 border border-slate-855 rounded-xl text-slate-500">
              <Bell size={24} />
            </div>
            <h3 className="text-lg font-bold text-slate-200">No Notifications</h3>
            <p className="text-slate-400 text-xs max-w-xs mx-auto">
              There are no notifications matching your active filters. Enjoy your clean inbox!
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredNotifications.map((notif) => (
              <div
                key={notif._id}
                onClick={() => handleNotificationClick(notif)}
                className={`p-4 rounded-xl border flex items-center justify-between cursor-pointer transition relative group ${
                  notif.isRead 
                    ? 'bg-slate-900/20 border-slate-850/60 hover:bg-slate-900/40 hover:border-slate-800' 
                    : 'bg-indigo-650/5 border-indigo-500/20 hover:bg-indigo-650/10 hover:border-indigo-500/40 shadow-inner shadow-indigo-950/5'
                }`}
              >
                {/* Visual Unread Bar */}
                {!notif.isRead && (
                  <span className="absolute top-0 bottom-0 left-0 w-1 rounded-l-xl bg-indigo-500"></span>
                )}

                <div className="flex items-start gap-4 pr-6 min-w-0">
                  {/* Sender Avatar */}
                  <img
                    src={notif.sender?.profilePicture || 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png'}
                    alt="Sender"
                    className="w-12 h-12 rounded-full object-cover border border-slate-800 flex-shrink-0"
                  />
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                      <span className="text-xs font-bold text-slate-200">{notif.sender?.fullName}</span>
                      <span className="inline-flex items-center gap-1 text-[9px] bg-slate-950 border border-slate-850 px-1.5 py-0.5 rounded font-semibold text-slate-400">
                        {getIcon(notif.type)}
                        <span className="uppercase tracking-wider text-[8px]">{notif.type.replace('_', ' ')}</span>
                      </span>
                    </div>
                    <h4 className="font-extrabold text-sm text-slate-100 mt-1 leading-snug">{notif.title}</h4>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">{notif.message}</p>
                    <span className="text-[10px] text-slate-500 mt-2 block">
                      {new Date(notif.createdAt).toLocaleDateString(undefined, { 
                        month: 'short', day: 'numeric', year: 'numeric', 
                        hour: '2-digit', minute: '2-digit' 
                      })}
                    </span>
                  </div>
                </div>

                {/* Right actions */}
                <div className="flex items-center gap-2">
                  {!notif.isRead && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMarkRead(notif._id);
                      }}
                      className="p-1.5 bg-slate-950/60 border border-slate-850 rounded-lg text-slate-500 hover:text-indigo-400 transition"
                      title="Mark as read"
                    >
                      <CheckSquare size={13} />
                    </button>
                  )}
                  <button
                    onClick={(e) => handleDelete(notif._id, e)}
                    className="p-1.5 bg-slate-950/60 border border-slate-850 rounded-lg text-slate-500 hover:text-red-400 opacity-60 group-hover:opacity-100 transition"
                    title="Delete notification"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
};

export default Notifications;
