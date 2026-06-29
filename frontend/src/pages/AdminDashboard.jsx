import React, { useState, useEffect } from 'react';
import { 
  Users, UserX, MessageSquare, Link2, FileText, Award, BarChart3, 
  Trash2, ShieldAlert, CheckCircle, Search, ChevronLeft, ChevronRight, 
  Loader2, RefreshCw, Github, AlertTriangle, UserCheck, Phone, Video, PhoneOff
} from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';

// New Components
import AdminHeader from '../components/admin/AdminHeader';
import AdminStatsWidgets from '../components/admin/AdminStatsWidgets';
import AdminQuickActions from '../components/admin/AdminQuickActions';
import AdminCharts from '../components/admin/AdminCharts';
import AdminFeed from '../components/admin/AdminFeed';
import AdminSidebarRight from '../components/admin/AdminSidebarRight';

const AdminDashboard = () => {
  const { user: currentUser } = React.useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('overview');

  // Stats State
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);

  // User Management State
  const [users, setUsers] = useState([]);
  const [userPage, setUserPage] = useState(1);
  const [userTotalPages, setUserTotalPages] = useState(1);
  const [userLimit] = useState(10);
  const [userSearch, setUserSearch] = useState('');
  const [usersLoading, setUsersLoading] = useState(true);

  // Reports State
  const [reports, setReports] = useState([]);
  const [reportsLoading, setReportsLoading] = useState(true);

  // Skills Analytics State
  const [skillsData, setSkillsData] = useState(null);
  const [skillsLoading, setSkillsLoading] = useState(true);

  // Generic errors tracker
  const [error, setError] = useState('');
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [announcementTitle, setAnnouncementTitle] = useState('');
  const [announcementMsg, setAnnouncementMsg] = useState('');
  const [sendingAnnouncement, setSendingAnnouncement] = useState(false);

  const fetchStats = async () => {
    try {
      setStatsLoading(true);
      const res = await api.get('/admin/stats');
      setStats(res.data);
    } catch (err) {
      setError('Failed to fetch stats');
    } finally {
      setStatsLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      setUsersLoading(true);
      const params = {
        page: userPage,
        limit: userLimit,
        keyword: userSearch
      };
      const res = await api.get('/admin/users', { params });
      setUsers(res.data.data);
      setUserTotalPages(res.data.pages);
    } catch (err) {
      console.error(err);
    } finally {
      setUsersLoading(false);
    }
  };

  const fetchReports = async () => {
    try {
      setReportsLoading(true);
      const res = await api.get('/admin/reports');
      setReports(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setReportsLoading(false);
    }
  };

  const fetchSkillsAnalytics = async () => {
    try {
      setSkillsLoading(true);
      const res = await api.get('/admin/skills');
      setSkillsData(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setSkillsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    if (activeTab === 'users') {
      fetchUsers();
    } else if (activeTab === 'reports') {
      fetchReports();
    } else if (activeTab === 'skills') {
      fetchSkillsAnalytics();
    }
  }, [activeTab, userPage, userSearch]);

  const handleBlockUser = async (userId) => {
    try {
      setActionLoadingId(userId);
      await api.put(`/admin/users/${userId}/block`);
      
      // Update local state arrays
      setUsers(users.map(u => u._id === userId ? { ...u, isActive: false } : u));
      setReports(reports.map(r => r._id === userId ? { ...r, isActive: false } : r));
      
      // Refresh stats
      fetchStats();
    } catch (err) {
      alert('Failed to block user');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleUnblockUser = async (userId) => {
    try {
      setActionLoadingId(userId);
      await api.put(`/admin/users/${userId}/unblock`);
      
      // Update local state arrays
      setUsers(users.map(u => u._id === userId ? { ...u, isActive: true, isReported: false, reportCount: 0 } : u));
      setReports(reports.filter(r => r._id !== userId));
      
      // Refresh stats
      fetchStats();
    } catch (err) {
      alert('Failed to unblock user');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('WARNING: Deleting this user will permanently remove their profile, posts, messages, and connections. Proceed?')) return;
    try {
      setActionLoadingId(userId);
      await api.delete(`/admin/users/${userId}`);
      
      // Update local state
      setUsers(users.filter(u => u._id !== userId));
      setReports(reports.filter(r => r._id !== userId));
      
      // Refresh stats
      fetchStats();
    } catch (err) {
      alert('Failed to delete user');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleChangeRole = async (userId) => {
    try {
      setActionLoadingId(userId);
      await api.put(`/admin/users/${userId}/role`);
      
      // Update local state arrays
      setUsers(users.map(u => u._id === userId ? { ...u, role: u.role === 'admin' ? 'user' : 'admin' } : u));
    } catch (err) {
      alert('Failed to change user role');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleSendAnnouncement = async (e) => {
    e.preventDefault();
    if (!announcementTitle || !announcementMsg) return;
    
    try {
      setSendingAnnouncement(true);
      const res = await api.post('/admin/announcements', {
        title: announcementTitle,
        message: announcementMsg
      });
      alert(res.data.message);
      setAnnouncementTitle('');
      setAnnouncementMsg('');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to send announcement');
    } finally {
      setSendingAnnouncement(false);
    }
  };

  const renderOverview = () => {
    if (statsLoading) {
      return (
        <div className="flex flex-col justify-center items-center h-80 space-y-3">
          <Loader2 className="animate-spin h-10 w-10 text-indigo-500" />
          <p className="text-slate-500 text-xs animate-pulse">Aggregating platform statistics...</p>
        </div>
      );
    }

    if (!stats) return <div className="text-slate-400 text-center italic">Failed to load statistics.</div>;

    const cards = [
      { label: 'Total Users', value: stats.totalUsers, icon: <Users size={18} className="text-indigo-400" />, desc: 'Registered accounts' },
      { label: 'Active Users', value: stats.activeUsers, icon: <UserCheck size={18} className="text-green-400" />, desc: 'Unblocked accounts' },
      { label: 'Reported Users', value: stats.reportedUsers, icon: <ShieldAlert size={18} className="text-red-400" />, desc: 'Flagged by developers' },
      { label: 'New This Month', value: stats.newUsersThisMonth, icon: <Users size={18} className="text-blue-400" />, desc: 'Registered this month' },
      { label: 'Collaboration Posts', value: stats.totalPosts, icon: <FileText size={18} className="text-purple-400" />, desc: 'Open and closed listings' },
      { label: 'Total Connections', value: stats.totalConnections, icon: <Link2 size={18} className="text-emerald-400" />, desc: 'Successful pairings' },
      { label: 'Messages Sent', value: stats.totalMessages, icon: <MessageSquare size={18} className="text-indigo-400" />, desc: 'Direct messages' },
      { label: 'Active Calls', value: stats.callStats?.activeCallsCount || 0, icon: <Phone size={18} className="text-emerald-400" />, desc: 'Currently occurring' },
      { label: 'Total Video Calls', value: stats.callStats?.totalVideoCalls || 0, icon: <Video size={18} className="text-blue-400" />, desc: 'Successful video calls' },
      { label: 'Total Voice Calls', value: stats.callStats?.totalVoiceCalls || 0, icon: <Phone size={18} className="text-purple-400" />, desc: 'Successful voice calls' },
      { label: 'Failed Calls', value: stats.callStats?.failedCalls || 0, icon: <PhoneOff size={18} className="text-red-400" />, desc: 'Busy, rejected, or offline' },
    ];

    return (
      <div className="space-y-6">
        {currentUser?.role === 'master_admin' && (
          <div className="bg-gradient-to-r from-indigo-900/40 to-purple-900/40 border border-indigo-500/30 rounded-2xl p-6 shadow-lg">
            <h3 className="text-lg font-bold text-slate-100 mb-2 flex items-center gap-2">
              <MessageSquare size={18} className="text-indigo-400" /> System Announcement
            </h3>
            <p className="text-xs text-slate-400 mb-4">Send a platform-wide notification to all users.</p>
            <form onSubmit={handleSendAnnouncement} className="space-y-3">
              <input 
                type="text" 
                placeholder="Announcement Title" 
                value={announcementTitle}
                onChange={(e) => setAnnouncementTitle(e.target.value)}
                className="w-full bg-slate-950/50 border border-slate-800 rounded-lg px-4 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
                required
              />
              <textarea 
                placeholder="Message body..." 
                value={announcementMsg}
                onChange={(e) => setAnnouncementMsg(e.target.value)}
                className="w-full bg-slate-950/50 border border-slate-800 rounded-lg px-4 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500 min-h-[80px]"
                required
              />
              <button 
                type="submit" 
                disabled={sendingAnnouncement}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-bold transition disabled:opacity-50 flex items-center gap-2"
              >
                {sendingAnnouncement ? <Loader2 size={16} className="animate-spin" /> : 'Broadcast to All Users'}
              </button>
            </form>
          </div>
        )}

        {/* Metric Cards Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {cards.map((card, i) => (
            <div key={i} className="bg-slate-900/40 backdrop-blur-xl border border-slate-800 rounded-2xl p-5 space-y-3 shadow-lg">
              <div className="flex justify-between items-center">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{card.label}</span>
                <div className="p-1.5 bg-slate-950/60 border border-slate-850 rounded-lg">
                  {card.icon}
                </div>
              </div>
              <div>
                <h3 className="text-2xl font-extrabold text-slate-100 tracking-tight">{card.value}</h3>
                <p className="text-[10px] text-slate-500 mt-1 font-semibold">{card.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Dynamic Skill List Board */}
        <div className="grid gap-6 md:grid-cols-2">
          
          <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 space-y-4">
            <h4 className="text-xs font-bold text-slate-100 uppercase tracking-wider flex items-center gap-2 pb-2 border-b border-slate-850">
              <Award size={14} className="text-indigo-400" /> Platform Top Skills
            </h4>
            {stats.topSkills && stats.topSkills.length > 0 ? (
              <div className="space-y-3.5 pt-2">
                {stats.topSkills.slice(0, 5).map((skill, index) => {
                  const maxCount = stats.topSkills[0]?.count || 1;
                  const percent = Math.round((skill.count / maxCount) * 100);
                  return (
                    <div key={index} className="space-y-1.5">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-slate-350 capitalize">{skill.skill}</span>
                        <span className="text-slate-500 font-bold">{skill.count} developers</span>
                      </div>
                      <div className="h-1.5 bg-slate-950 border border-slate-900 rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${percent}%` }}></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-slate-500 text-xs italic py-4 text-center">No skills logged in system profiles.</p>
            )}
          </div>

          <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 space-y-4 flex flex-col justify-center items-center text-center">
            <div className="w-12 h-12 bg-slate-950 border border-slate-850 rounded-2xl flex items-center justify-center text-indigo-400 mb-2">
              <BarChart3 size={24} />
            </div>
            <h4 className="text-sm font-bold text-slate-200">Skills & GitHub Language Distribution</h4>
            <p className="text-slate-400 text-xs max-w-xs mx-auto mt-2 leading-relaxed">
              Explore user tech stacks, GitHub languages count, and global skills aggregates on the analytics panel.
            </p>
            <button 
              onClick={() => setActiveTab('skills')}
              className="mt-4 px-4 py-2 bg-indigo-650 hover:bg-indigo-550 border border-indigo-500/20 text-white text-[10px] font-bold rounded-xl transition cursor-pointer"
            >
              Analyze Tech Stacks
            </button>
          </div>

        </div>
      </div>
    );
  };

  const renderUsers = () => {
    return (
      <div className="space-y-4">
        {/* User Search Panel */}
        <div className="flex flex-col sm:flex-row gap-3 items-center bg-slate-900/30 border border-slate-850 p-4 rounded-2xl">
          <div className="relative w-full sm:flex-1">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
              <Search size={14} />
            </span>
            <input 
              type="text" 
              placeholder="Search users by name, email, or username..."
              className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-850 rounded-xl focus:border-indigo-500 text-xs text-slate-350 outline-none transition"
              value={userSearch}
              onChange={(e) => {
                setUserSearch(e.target.value);
                setUserPage(1);
              }}
            />
          </div>
          {userSearch && (
            <button 
              onClick={() => setUserSearch('')}
              className="text-[10px] font-bold text-slate-500 hover:text-slate-200 transition cursor-pointer"
            >
              Reset Search
            </button>
          )}
        </div>

        {/* Users Table */}
        {usersLoading ? (
          <div className="flex flex-col justify-center items-center h-64 space-y-3 bg-slate-900/10 border border-slate-900 rounded-2xl">
            <Loader2 className="animate-spin h-8 w-8 text-indigo-500" />
            <p className="text-slate-550 text-xs animate-pulse">Fetching member index...</p>
          </div>
        ) : users.length === 0 ? (
          <div className="bg-slate-900/20 border border-slate-850 rounded-2xl p-16 text-center max-w-md mx-auto space-y-4">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-slate-950 border border-slate-850 rounded-xl text-slate-550">
              <Users size={24} />
            </div>
            <h3 className="text-base font-bold text-slate-300">No Users Found</h3>
            <p className="text-slate-400 text-xs max-w-xs mx-auto">
              No registered user accounts match your active query.
            </p>
          </div>
        ) : (
          <div className="bg-slate-900/30 border border-slate-850 rounded-2xl overflow-hidden shadow-lg">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-950/60 border-b border-slate-850 text-slate-400 font-bold uppercase tracking-wider text-[9px]">
                    <th className="p-4">Developer</th>
                    <th className="p-4">Email</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Role</th>
                    <th className="p-4">Registered</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850/60">
                  {users.map((item) => (
                    <tr key={item._id} className="hover:bg-slate-900/20 transition-colors duration-150">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <img 
                            src={item.profilePicture} 
                            alt={item.fullName} 
                            className="w-8 h-8 rounded-full object-cover border border-slate-850"
                          />
                          <div>
                            <div className="font-bold text-slate-100">{item.fullName}</div>
                            {item.githubUsername && (
                              <div className="text-[10px] text-slate-500 mt-0.5 flex items-center gap-1">
                                <Github size={10} /> @{item.githubUsername}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-slate-350">{item.email}</td>
                      <td className="p-4">
                        <span className={`inline-flex px-2 py-0.5 rounded text-[9px] border font-bold uppercase ${
                          item.isActive 
                            ? 'bg-green-500/10 border-green-500/20 text-green-400' 
                            : 'bg-red-500/10 border-red-500/20 text-red-400'
                        }`}>
                          {item.isActive ? 'Active' : 'Blocked'}
                        </span>
                        {item.reportCount > 0 && (
                          <span className="ml-1.5 inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-[8px] font-bold rounded">
                            <AlertTriangle size={8} /> {item.reportCount} flags
                          </span>
                        )}
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex px-1.5 py-0.5 rounded text-[8px] border font-bold uppercase ${
                          item.role === 'admin' 
                            ? 'bg-purple-500/10 border-purple-500/20 text-purple-400' 
                            : 'bg-slate-950 border-slate-850 text-slate-450'
                        }`}>
                          {item.role}
                        </span>
                      </td>
                      <td className="p-4 text-slate-500">
                        {new Date(item.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex justify-end gap-1.5">
                          {item.role !== 'master_admin' ? (
                            <>
                              {item.isActive ? (
                                <button
                                  onClick={() => handleBlockUser(item._id)}
                                  disabled={actionLoadingId === item._id}
                                  className="px-2.5 py-1 bg-red-650/10 hover:bg-red-650/20 border border-red-500/10 hover:border-red-500/30 text-red-400 rounded-lg font-bold transition duration-150 cursor-pointer disabled:opacity-50"
                                >
                                  Block
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleUnblockUser(item._id)}
                                  disabled={actionLoadingId === item._id}
                                  className="px-2.5 py-1 bg-green-550/10 hover:bg-green-550/20 border border-green-500/10 hover:border-green-500/30 text-green-400 rounded-lg font-bold transition duration-150 cursor-pointer disabled:opacity-50"
                                >
                                  Unblock
                                </button>
                              )}
                              <button
                                onClick={() => handleChangeRole(item._id)}
                                disabled={actionLoadingId === item._id}
                                className="p-1.5 bg-slate-950/60 hover:bg-purple-500/10 border border-slate-850 hover:border-purple-500/20 text-slate-500 hover:text-purple-400 rounded-lg transition cursor-pointer disabled:opacity-50"
                                title={item.role === 'admin' ? 'Demote to user' : 'Promote to admin'}
                              >
                                <ShieldAlert size={13} />
                              </button>
                              <button
                                onClick={() => handleDeleteUser(item._id)}
                                disabled={actionLoadingId === item._id}
                                className="p-1.5 bg-slate-950/60 hover:bg-red-500/10 border border-slate-850 hover:border-red-500/20 text-slate-500 hover:text-red-400 rounded-lg transition cursor-pointer disabled:opacity-50"
                                title="Delete user profile"
                              >
                                <Trash2 size={13} />
                              </button>
                            </>
                          ) : (
                            <span className="text-xs text-slate-500 italic px-2">Protected</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {userTotalPages > 1 && (
              <div className="px-6 py-4 bg-slate-950/40 border-t border-slate-850 flex justify-between items-center text-xs font-semibold text-slate-400">
                <button
                  disabled={userPage === 1}
                  onClick={() => setUserPage(userPage - 1)}
                  className="px-3.5 py-1.5 bg-slate-900 border border-slate-805 hover:bg-slate-800 disabled:opacity-50 text-slate-300 rounded-xl flex items-center gap-1.5 transition cursor-pointer"
                >
                  <ChevronLeft size={14} /> Previous
                </button>
                <span>Page {userPage} of {userTotalPages}</span>
                <button
                  disabled={userPage === userTotalPages}
                  onClick={() => setUserPage(userPage + 1)}
                  className="px-3.5 py-1.5 bg-slate-900 border border-slate-805 hover:bg-slate-800 disabled:opacity-50 text-slate-300 rounded-xl flex items-center gap-1.5 transition cursor-pointer"
                >
                  Next <ChevronRight size={14} />
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const renderReports = () => {
    if (reportsLoading) {
      return (
        <div className="flex flex-col justify-center items-center h-64 space-y-3 bg-slate-900/10 border border-slate-900 rounded-2xl">
          <Loader2 className="animate-spin h-8 w-8 text-indigo-500" />
          <p className="text-slate-550 text-xs animate-pulse">Fetching reported flagged profiles...</p>
        </div>
      );
    }

    if (reports.length === 0) {
      return (
        <div className="bg-slate-900/20 border border-slate-850 rounded-3xl p-16 text-center max-w-md mx-auto space-y-4">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-slate-950 border border-slate-850 rounded-xl text-green-400">
            <CheckCircle size={24} />
          </div>
          <h3 className="text-base font-bold text-slate-200">Inbox Clean</h3>
          <p className="text-slate-400 text-xs max-w-xs mx-auto">
            No user profiles are flagged or reported currently. Great job!
          </p>
        </div>
      );
    }

    return (
      <div className="bg-slate-900/30 border border-slate-850 rounded-2xl overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-950/60 border-b border-slate-850 text-slate-400 font-bold uppercase tracking-wider text-[9px]">
                <th className="p-4">Flagged Profile</th>
                <th className="p-4">Report Count</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850/60">
              {reports.map((item) => (
                <tr key={item._id} className="hover:bg-slate-900/20 transition duration-150">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <img 
                        src={item.profilePicture} 
                        alt={item.fullName} 
                        className="w-10 h-10 rounded-full object-cover border border-slate-800"
                      />
                      <div>
                        <div className="font-extrabold text-slate-100 text-sm">{item.fullName}</div>
                        <div className="text-[10px] text-slate-500 mt-0.5">{item.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-500/10 border border-red-500/20 text-red-400 font-bold rounded-lg text-[10px]">
                      <AlertTriangle size={12} /> {item.reportCount} reports
                    </span>
                  </td>
                  <td className="p-4">
                    <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[9px] border font-bold uppercase ${
                      item.isActive 
                        ? 'bg-green-500/10 border-green-500/20 text-green-400' 
                        : 'bg-red-500/10 border-red-500/20 text-red-400'
                    }`}>
                      {item.isActive ? 'Active' : 'Blocked'}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-1.5">
                      {item.isActive ? (
                        <button
                          onClick={() => handleBlockUser(item._id)}
                          disabled={actionLoadingId === item._id}
                          className="px-3 py-1.5 bg-red-650/10 hover:bg-red-650/20 border border-red-500/10 hover:border-red-500/30 text-red-400 rounded-xl font-bold transition duration-150 cursor-pointer"
                        >
                          Block Profile
                        </button>
                      ) : (
                        <button
                          onClick={() => handleUnblockUser(item._id)}
                          disabled={actionLoadingId === item._id}
                          className="px-3 py-1.5 bg-green-550/10 hover:bg-green-550/20 border border-green-500/10 hover:border-green-500/30 text-green-400 rounded-xl font-bold transition duration-150 cursor-pointer"
                        >
                          Clear Flag & Unblock
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteUser(item._id)}
                        disabled={actionLoadingId === item._id}
                        className="p-2 bg-slate-950/60 hover:bg-red-500/10 border border-slate-850 hover:border-red-500/20 text-slate-500 hover:text-red-400 rounded-xl transition cursor-pointer"
                        title="Delete profile"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderSkills = () => {
    if (skillsLoading) {
      return (
        <div className="flex flex-col justify-center items-center h-64 space-y-3 bg-slate-900/10 border border-slate-900 rounded-2xl">
          <Loader2 className="animate-spin h-8 w-8 text-indigo-500" />
          <p className="text-slate-550 text-xs animate-pulse">Running skills database aggregations...</p>
        </div>
      );
    }

    if (!skillsData) return <div className="text-slate-400 text-center italic">Failed to fetch skills analytics.</div>;

    const maxSkillCount = skillsData.skillsCount?.[0]?.count || 1;
    const maxLangCount = skillsData.githubLanguages?.[0]?.count || 1;

    return (
      <div className="grid gap-6 md:grid-cols-2">
        
        {/* User profile skills stats */}
        <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 space-y-5 shadow-lg">
          <h4 className="text-xs font-bold text-slate-100 uppercase tracking-wider flex items-center gap-2 pb-2 border-b border-slate-850">
            <Award size={14} className="text-indigo-400" /> Profile Declared Skills
          </h4>
          {skillsData.skillsCount?.length > 0 ? (
            <div className="space-y-4 pt-2">
              {skillsData.skillsCount.slice(0, 10).map((skill, index) => {
                const percent = Math.round((skill.count / maxSkillCount) * 100);
                return (
                  <div key={index} className="space-y-1.5">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-slate-350 capitalize">{skill.name}</span>
                      <span className="text-slate-500 font-bold">{skill.count} developers</span>
                    </div>
                    <div className="h-2 bg-slate-950 border border-slate-900 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full" style={{ width: `${percent}%` }}></div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-slate-550 text-xs italic text-center py-8">No skills declared in system profiles.</p>
          )}
        </div>

        {/* GitHub synced languages stats */}
        <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 space-y-5 shadow-lg">
          <h4 className="text-xs font-bold text-slate-100 uppercase tracking-wider flex items-center gap-2 pb-2 border-b border-slate-850">
            <Github size={14} className="text-indigo-400" /> Synced GitHub Languages
          </h4>
          {skillsData.githubLanguages?.length > 0 ? (
            <div className="space-y-4 pt-2">
              {skillsData.githubLanguages.slice(0, 10).map((lang, index) => {
                const percent = Math.round((lang.count / maxLangCount) * 100);
                return (
                  <div key={index} className="space-y-1.5">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-slate-350 capitalize">{lang.name}</span>
                      <span className="text-slate-500 font-bold">{lang.count} repositories</span>
                    </div>
                    <div className="h-2 bg-slate-950 border border-slate-900 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full" style={{ width: `${percent}%` }}></div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-slate-550 text-xs italic text-center py-8">No GitHub languages loaded in active database profiles.</p>
          )}
        </div>

      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-10">
      {/* Container for the LinkedIn style layout */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <div className="flex flex-col lg:flex-row gap-6">
          
          {/* Main Content Column */}
          <div className="flex-1 min-w-0">
            <AdminHeader user={currentUser} />
            
            {/* We render QuickActions to allow tab switching */}
            <AdminQuickActions activeTab={activeTab} onActionClick={setActiveTab} />
            
            {currentUser?.role === 'master_admin' && (
              <div className="bg-gradient-to-r from-indigo-900/40 to-purple-900/40 border border-indigo-500/30 rounded-2xl p-6 shadow-lg mt-6">
                <h3 className="text-lg font-bold text-slate-100 mb-2 flex items-center gap-2">
                  <MessageSquare size={18} className="text-indigo-400" /> System Announcement
                </h3>
                <p className="text-xs text-slate-400 mb-4">Send a platform-wide notification to all users.</p>
                <form onSubmit={handleSendAnnouncement} className="space-y-3">
                  <input 
                    type="text" 
                    placeholder="Announcement Title" 
                    value={announcementTitle}
                    onChange={(e) => setAnnouncementTitle(e.target.value)}
                    className="w-full bg-slate-950/50 border border-slate-800 rounded-lg px-4 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
                    required
                  />
                  <textarea 
                    placeholder="Message body..." 
                    value={announcementMsg}
                    onChange={(e) => setAnnouncementMsg(e.target.value)}
                    className="w-full bg-slate-950/50 border border-slate-800 rounded-lg px-4 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500 min-h-[80px]"
                    required
                  />
                  <button 
                    type="submit" 
                    disabled={sendingAnnouncement}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-bold transition disabled:opacity-50 flex items-center gap-2"
                  >
                    {sendingAnnouncement ? <Loader2 size={16} className="animate-spin" /> : 'Broadcast to All Users'}
                  </button>
                </form>
              </div>
            )}

            <div className="mt-6">
              {activeTab === 'overview' || activeTab === 'create' ? (
                <>
                  <AdminStatsWidgets stats={stats} />
                  <AdminCharts stats={stats} />
                  <AdminFeed />
                </>
              ) : activeTab === 'users' ? (
                <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800 rounded-2xl p-6 shadow-xl">
                  <h3 className="text-xl font-bold text-slate-100 mb-4">Manage Users</h3>
                  {renderUsers()}
                </div>
              ) : activeTab === 'reports' ? (
                <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800 rounded-2xl p-6 shadow-xl">
                  <h3 className="text-xl font-bold text-slate-100 mb-4">Reports</h3>
                  {renderReports()}
                </div>
              ) : activeTab === 'settings' ? (
                <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800 rounded-2xl p-6 shadow-xl">
                  <h3 className="text-xl font-bold text-slate-100 mb-4">Settings</h3>
                  <p className="text-slate-400">Settings panel coming soon.</p>
                </div>
              ) : activeTab === 'projects' ? (
                <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800 rounded-2xl p-6 shadow-xl">
                  <h3 className="text-xl font-bold text-slate-100 mb-4">Manage Projects</h3>
                  <p className="text-slate-400">Projects management coming soon.</p>
                </div>
              ) : activeTab === 'messages' ? (
                <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800 rounded-2xl p-6 shadow-xl">
                  <h3 className="text-xl font-bold text-slate-100 mb-4">Messages</h3>
                  <p className="text-slate-400">Message center coming soon.</p>
                </div>
              ) : null}
            </div>
          </div>
          
          {/* Right Sidebar Column */}
          <div className="w-full lg:w-80 shrink-0">
            <AdminSidebarRight />
          </div>

        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
