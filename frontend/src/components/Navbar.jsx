import React, { useState, useEffect, useContext } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { LogOut, Users, User, Home, Sparkles, Bell, Search, ShieldAlert } from 'lucide-react';
import { io } from 'socket.io-client';
import api, { SOCKET_URL } from '../services/api';
import NotificationDropdown from './NotificationDropdown';
import NotificationToast from './NotificationToast';

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

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
    <nav className="bg-brand-bg border-b border-brand-border sticky top-0 z-50">
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
          
          <div className="flex items-center space-x-1 sm:space-x-2">
            {[
              { path: '/', icon: Home, label: 'Feed' },
              { path: '/network', icon: Users, label: 'Network' },
              { path: '/projects', icon: Sparkles, label: 'Projects' },
              { path: '/search', icon: Search, label: 'Search' },
              { path: '/connections', icon: Users, label: 'Connections' },
            ].map((navItem) => {
              const isActive = location.pathname === navItem.path;
              return (
                <Link 
                  key={navItem.path}
                  to={navItem.path} 
                  className={`flex flex-col items-center justify-center px-3 h-16 border-b-2 transition duration-200 ${
                    isActive 
                      ? 'border-brand-primary text-brand-primary' 
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <navItem.icon size={20} className={isActive ? 'fill-brand-primary/20' : ''} /> 
                  <span className="hidden sm:block text-[10px] mt-1 font-semibold">{navItem.label}</span>
                </Link>
              );
            })}

            {(user && (user.role === 'admin' || user.role === 'master_admin')) && (
              <Link 
                to="/admin" 
                className={`flex flex-col items-center justify-center px-3 h-16 border-b-2 transition duration-200 ${
                  location.pathname === '/admin' 
                    ? 'border-red-500 text-red-500' 
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <ShieldAlert size={20} /> 
                <span className="hidden sm:block text-[10px] mt-1 font-semibold">Admin</span>
              </Link>
            )}

            {/* Notification Bell Dropdown Button */}
            {user && (
              <div className="relative">
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className={`flex flex-col items-center justify-center px-3 h-16 border-b-2 transition duration-200 cursor-pointer relative ${isDropdownOpen ? 'border-brand-primary text-brand-primary' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
                  title="Notifications"
                >
                  <div className="relative">
                    <Bell size={20} className={isDropdownOpen ? 'fill-brand-primary/20' : ''} />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-500 border-2 border-brand-bg rounded-full flex items-center justify-center text-[8px] text-white font-bold shadow-sm">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </div>
                  <span className="hidden sm:block text-[10px] mt-1 font-semibold">Alerts</span>
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

            <div className="border-l border-brand-border h-8 mx-2 hidden sm:block self-center"></div>
            
            {/* User Profile Dropdown */}
            {user && (
              <div className="relative flex items-center ml-2">
                <button 
                  onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                  className="flex flex-col items-center justify-center h-16 cursor-pointer"
                >
                  <img src={user.profilePicture || 'https://via.placeholder.com/150'} alt="Profile" className="w-8 h-8 rounded-full border-2 border-brand-border object-cover" />
                  <span className="hidden sm:block text-[10px] mt-1 font-semibold text-slate-400 flex items-center">Me ▼</span>
                </button>

                {isProfileMenuOpen && (
                  <div className="absolute top-14 right-0 mt-2 w-56 bg-brand-card border border-brand-border rounded-xl shadow-2xl py-2 overflow-hidden z-50">
                    <div className="px-4 py-3 border-b border-brand-border">
                      <p className="text-sm font-bold text-slate-100">{user.fullName}</p>
                      <p className="text-xs text-slate-400 truncate">{user.headline || 'Developer'}</p>
                    </div>
                    <Link to={`/profile/${user._id}`} onClick={() => setIsProfileMenuOpen(false)} className="block px-4 py-2 text-sm text-slate-300 hover:bg-white/5 hover:text-white transition">
                      View Profile
                    </Link>
                    <Link to="/profile" onClick={() => setIsProfileMenuOpen(false)} className="block px-4 py-2 text-sm text-slate-300 hover:bg-white/5 hover:text-white transition">
                      Edit Profile
                    </Link>
                    <div className="border-t border-brand-border my-1"></div>
                    <button 
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-white/5 hover:text-red-300 transition"
                    >
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            )}
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
