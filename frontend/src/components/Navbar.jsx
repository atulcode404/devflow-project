import React, { useState, useEffect, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { LogOut, Users, User, Home, Sparkles, Bell, Search, ShieldAlert } from 'lucide-react';
import { io } from 'socket.io-client';
import api, { SOCKET_URL } from '../services/api';
import NotificationDropdown from './NotificationDropdown';
import NotificationToast from './NotificationToast';

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  // Notification States
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [activeToast, setActiveToast] = useState(null);

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications');
      setNotifications(res.data);

      const countRes = await api.get('/notifications/unread-count');
      setUnreadCount(countRes.data.count);
    } catch (error) {
      console.error('Error fetching navbar notifications:', error);
    }
  };

  useEffect(() => {
    if (!user) return;

    fetchNotifications();

    const socket = io(SOCKET_URL, {
      withCredentials: true,
    });

    socket.emit('join', user._id);

    socket.on('newNotification', (newNotif) => {
      setNotifications((prev) => [newNotif, ...prev]);
      setUnreadCount((prev) => prev + 1);
      setActiveToast(newNotif);
    });

    return () => {
      socket.disconnect();
    };
  }, [user]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleMarkRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications((prev) => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error(error);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setNotifications((prev) => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error(error);
    }
  };

  const handleClearAll = async () => {
    try {
      await api.delete('/notifications/clear-all');
      setNotifications([]);
      setUnreadCount(0);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <nav className="bg-slate-900 border-b border-slate-800 sticky top-0 z-50 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex-shrink-0 flex items-center gap-2 group">
              <div className="w-8 h-8 rounded-lg bg-indigo-650 flex items-center justify-center text-white font-bold text-lg shadow shadow-indigo-500/50 group-hover:scale-105 transition-transform duration-200">
                D
              </div>
              <span className="text-xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400 tracking-tight group-hover:text-indigo-400 transition-colors duration-200">
                DevFlow
              </span>
            </Link>
          </div>
          
          <div className="flex items-center space-x-2 sm:space-x-4">
            <Link 
              to="/" 
              className="text-slate-300 hover:text-indigo-400 px-3 py-2 rounded-lg text-sm font-semibold flex items-center gap-1.5 transition duration-200 hover:bg-slate-800/50"
            >
              <Home size={16} /> 
              <span className="hidden sm:inline">Feed</span>
            </Link>
            <Link 
              to="/search" 
              className="text-slate-300 hover:text-indigo-400 px-3 py-2 rounded-lg text-sm font-semibold flex items-center gap-1.5 transition duration-200 hover:bg-slate-800/50"
            >
              <Search size={16} /> 
              <span className="hidden sm:inline">Search</span>
            </Link>
            <Link 
              to="/connections" 
              className="text-slate-300 hover:text-indigo-400 px-3 py-2 rounded-lg text-sm font-semibold flex items-center gap-1.5 transition duration-200 hover:bg-slate-800/50"
            >
              <Users size={16} /> 
              <span className="hidden sm:inline">Connections</span>
            </Link>
            <Link 
              to="/profile" 
              className="text-slate-300 hover:text-indigo-400 px-3 py-2 rounded-lg text-sm font-semibold flex items-center gap-1.5 transition duration-200 hover:bg-slate-800/50"
            >
              <User size={16} /> 
              <span className="hidden sm:inline">Profile</span>
            </Link>

            {user && user.role === 'admin' && (
              <Link 
                to="/admin" 
                className="text-slate-300 hover:text-indigo-400 px-3 py-2 rounded-lg text-sm font-semibold flex items-center gap-1.5 transition duration-200 hover:bg-slate-800/50"
              >
                <ShieldAlert size={16} /> 
                <span className="hidden sm:inline">Admin</span>
              </Link>
            )}

            {/* Notification Bell Dropdown Button */}
            {user && (
              <div className="relative">
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="text-slate-300 hover:text-indigo-400 p-2 rounded-lg text-sm font-semibold flex items-center transition duration-200 hover:bg-slate-800/50 cursor-pointer relative"
                  title="Notifications"
                >
                  <Bell size={16} />
                  {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-3.5 h-3.5 bg-red-500 border-2 border-slate-900 rounded-full flex items-center justify-center text-[7px] text-white font-extrabold shadow animate-pulse">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {isDropdownOpen && (
                  <NotificationDropdown
                    notifications={notifications}
                    onClose={() => setIsDropdownOpen(false)}
                    onMarkRead={handleMarkRead}
                    onMarkAllRead={handleMarkAllRead}
                    onClearAll={handleClearAll}
                  />
                )}
              </div>
            )}

            <div className="border-l border-slate-850 h-5 mx-1 hidden sm:block"></div>
            <button 
              onClick={handleLogout}
              className="text-slate-400 hover:text-red-400 px-3 py-2 rounded-lg text-sm font-semibold flex items-center gap-1.5 transition duration-200 hover:bg-red-500/10 cursor-pointer"
            >
              <LogOut size={16} /> 
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </div>

      {/* Real-time Popup Alert Toast */}
      {activeToast && (
        <NotificationToast
          notification={activeToast}
          onClose={() => setActiveToast(null)}
        />
      )}
    </nav>
  );
};

export default Navbar;
