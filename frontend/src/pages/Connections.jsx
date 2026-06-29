import React, { useState, useEffect, useContext, useRef } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import api, { SOCKET_URL } from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { SocketContext } from '../context/SocketContext';
import { 
  Check, X, MessageSquare, Send, ArrowLeft, Loader2, 
  Video, Code2, Phone, Smile, Paperclip, Mic, 
  MoreVertical, Search, Github, Linkedin, ExternalLink,
  CheckCheck
} from 'lucide-react';

const Connections = () => {
  const [connections, setConnections] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const { userId } = useParams();

  // ── Chat & Layout State ──────────────────────────────────────────────
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessageText, setNewMessageText] = useState('');
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [showRightPanel, setShowRightPanel] = useState(true);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (location.state?.openChatWith) {
      setActiveChat(location.state.openChatWith);
      navigate(location.pathname, { replace: true, state: {} });
    } else if (userId) {
      // Fetch user to set as active chat
      const fetchUserForChat = async () => {
        try {
          const res = await api.get(`/users/${userId}`);
          setActiveChat(res.data);
        } catch (err) {
          console.error("Failed to load user for chat", err);
        }
      };
      fetchUserForChat();
    }
  }, [location.state, navigate, location.pathname, userId]);

  // Consume global Socket and Call functions
  const { socket, startCall } = useContext(SocketContext);

  // ── Fetch connections ───────────────────────────────────────────────
  const fetchConnections = async () => {
    try {
      const res = await api.get('/connections');
      setConnections(res.data);
    } catch (error) {
      console.error('Error fetching connections', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchConnections();
  }, [user]);

  // ── Socket event listeners ──────────────────────────────────────────
  useEffect(() => {
    if (!socket) return;

    socket.on('newConnectionRequest', fetchConnections);
    socket.on('connectionAccepted', fetchConnections);

    return () => {
      socket.off('newConnectionRequest', fetchConnections);
      socket.off('connectionAccepted', fetchConnections);
    };
  }, [socket]);

  // ── Chat messages listener ──────────────────────────────────────────
  useEffect(() => {
    if (!socket || !activeChat || !user) return;

    const handleNewMessage = (message) => {
      const senderId = message.sender._id || message.sender;
      const receiverId = message.receiver._id || message.receiver;
      if (
        (senderId === activeChat._id && receiverId === user._id) ||
        (senderId === user._id && receiverId === activeChat._id)
      ) {
        setMessages(prev => [...prev, message]);
      }
    };

    socket.on('newMessage', handleNewMessage);
    return () => socket.off('newMessage', handleNewMessage);
  }, [socket, activeChat, user]);

  // ── Fetch message history ───────────────────────────────────────────
  useEffect(() => {
    if (!activeChat) return;
    const fetchMessages = async () => {
      try {
        setMessagesLoading(true);
        const res = await api.get(`/messages/${activeChat._id}`);
        setMessages(res.data);
      } catch (err) {
        console.error('Error fetching messages', err);
      } finally {
        setMessagesLoading(false);
      }
    };
    fetchMessages();
  }, [activeChat]);

  // ── Auto-scroll ─────────────────────────────────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ── Handlers ────────────────────────────────────────────────────────
  const handleRespond = async (id, status) => {
    try {
      await api.post(`/connections/respond/${id}`, { status });
      setConnections(connections.map(c => c._id === id ? { ...c, status } : c));
    } catch (err) {
      alert(err.response?.data?.message || 'Error responding to request');
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessageText.trim() || !activeChat) return;
    const text = newMessageText;
    setNewMessageText('');
    try {
      const res = await api.post('/messages', { receiverId: activeChat._id, content: text });
      setMessages(prev => [...prev, res.data]);
    } catch (err) {
      setNewMessageText(text);
      alert(err.response?.data?.message || 'Failed to send message');
    }
  };

  const handleStartVideoCall = () => { if (activeChat && socket) startCall(activeChat, false); };
  const handleStartVoiceCall = () => { if (activeChat && socket) startCall(activeChat, true); };
  const handleStartCodeRoom = async () => {
    if (!activeChat) return;
    try {
      const res = await api.post('/rooms/create', { language: 'javascript' });
      navigate(`/room/${res.data.roomId}`);
    } catch (err) {
      alert('Failed to create code room. Make sure backend is running.');
    }
  };

  // ── Derived data ────────────────────────────────────────────────────
  const pendingRequests = connections.filter(
    c => c && c.status === 'pending' && c.receiver && c.receiver._id === user?._id && c.sender
  );
  const activeConnections = connections.filter(
    c => c && c.status === 'accepted' && c.sender && c.receiver
  );

  // ── Loading screen ──────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-[calc(100vh-4rem)] bg-slate-950">
        <Loader2 className="animate-spin h-10 w-10 text-indigo-500 mb-4" />
        <p className="text-slate-400 text-sm animate-pulse">Connecting to network...</p>
      </div>
    );
  }

  // ── Main render ─────────────────────────────────────────────────────
  return (
    <div className="h-[calc(100vh-4rem)] bg-slate-950 text-slate-100 flex overflow-hidden font-sans selection:bg-indigo-500/30">
      
      {/* ── LEFT PANE: Network List ────────────────────────────────────── */}
      <div className={`w-full md:w-[320px] lg:w-[350px] bg-slate-900 border-r border-slate-800 flex-col transition-all ${activeChat ? 'hidden md:flex' : 'flex'}`}>
        
        {/* Header & Search */}
        <div className="p-4 border-b border-slate-800 bg-slate-900/50 backdrop-blur-md">
          <h2 className="text-xl font-black text-slate-100 mb-4 tracking-tight">Messages</h2>
          <div className="relative group">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition" size={16} />
            <input 
              type="text" 
              placeholder="Search conversations..." 
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition shadow-inner"
            />
          </div>
        </div>

        {/* Scrollable Connection List */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-2 space-y-1 custom-scrollbar">
          
          {/* Pending Requests */}
          {pendingRequests.length > 0 && (
            <div className="mb-4">
              <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2 mb-2 mt-2">Connection Requests</h3>
              <div className="space-y-1.5">
                {pendingRequests.map(req => (
                  <div key={req._id} className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-3 flex flex-col gap-3">
                    <div className="flex items-center gap-3">
                      <img src={req.sender.profilePicture} alt="Avatar" className="w-10 h-10 rounded-full border border-slate-700 object-cover" />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-sm text-slate-200 truncate">{req.sender.fullName}</h4>
                        <p className="text-xs text-slate-400 truncate">{req.sender.headline || 'Developer'}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => handleRespond(req._id, 'accepted')} className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg py-2 text-xs font-bold transition shadow-lg shadow-indigo-900/20">Accept</button>
                      <button onClick={() => handleRespond(req._id, 'rejected')} className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg py-2 text-xs font-bold transition border border-slate-700">Ignore</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Active Network */}
          <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2 mb-2 mt-4">Direct Messages</h3>
          {activeConnections.length === 0 ? (
            <div className="text-center py-10 px-4 opacity-60">
              <p className="text-sm text-slate-400 mb-2">No active connections yet.</p>
              <a href="/network" className="text-xs text-indigo-400 font-semibold hover:underline">Find developers to connect with</a>
            </div>
          ) : (
            activeConnections.map(conn => {
              const connectedUser = conn.sender._id === user._id ? conn.receiver : conn.sender;
              const isCurrentChat = activeChat?._id === connectedUser._id;
              
              // MOCK DATA: since backend doesn't provide these fields yet
              const mockLastMessage = "Let me check the code repository...";
              const mockTime = "1h ago";
              const isOnline = connectedUser.isOnline; // use real if available

              return (
                <div 
                  key={conn._id}
                  onClick={() => setActiveChat(connectedUser)}
                  className={`group flex items-center gap-3 p-2.5 rounded-xl cursor-pointer transition select-none ${
                    isCurrentChat ? 'bg-indigo-600/15 border-indigo-500/20 border' : 'hover:bg-slate-800/60 border border-transparent'
                  }`}
                >
                  {/* Avatar & Online Indicator */}
                  <div className="relative shrink-0">
                    <img src={connectedUser.profilePicture} alt="" className="w-12 h-12 rounded-full object-cover border border-slate-700 bg-slate-800" />
                    <div className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-[2.5px] border-slate-900 ${isOnline ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-slate-500'}`}></div>
                  </div>
                  
                  {/* Message Info */}
                  <div className="flex-1 min-w-0 flex flex-col justify-center">
                    <div className="flex justify-between items-baseline mb-0.5">
                      <h4 className={`font-bold text-sm truncate ${isCurrentChat ? 'text-indigo-300' : 'text-slate-200 group-hover:text-white'}`}>{connectedUser.fullName}</h4>
                      <span className={`text-[10px] flex-shrink-0 font-medium ${isCurrentChat ? 'text-indigo-400/80' : 'text-slate-500'}`}>{mockTime}</span>
                    </div>
                    <p className={`text-xs truncate pr-4 ${isCurrentChat ? 'text-slate-300' : 'text-slate-400'}`}>{mockLastMessage}</p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ── CENTER PANE: Chat Area ────────────────────────────────────── */}
      <div className={`flex-1 bg-slate-950 flex-col min-w-0 relative ${!activeChat ? 'hidden md:flex' : 'flex'}`}>
        {!activeChat ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]">
            <div className="w-20 h-20 bg-slate-900 border border-slate-800 rounded-full flex items-center justify-center text-indigo-500 mb-6 shadow-2xl">
              <MessageSquare size={36} />
            </div>
            <h2 className="text-2xl font-black text-white mb-2">Welcome to DevFlow Chat</h2>
            <p className="text-slate-400 max-w-md">Start a conversation, share code snippets, or initiate a live video and coding session with your network.</p>
          </div>
        ) : (
          <>
            {/* Chat Header */}
            <div className="h-[72px] px-4 md:px-6 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 flex items-center justify-between z-10">
              <div className="flex items-center gap-3 md:gap-4 min-w-0">
                <button onClick={() => setActiveChat(null)} className="md:hidden p-2 -ml-2 text-slate-400 hover:text-white transition">
                  <ArrowLeft size={20}/>
                </button>
                
                <div className="relative shrink-0 cursor-pointer" onClick={() => setShowRightPanel(true)}>
                  <img src={activeChat.profilePicture} className="w-11 h-11 rounded-full object-cover border border-slate-700" />
                  <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-slate-900 ${activeChat.isOnline ? 'bg-emerald-500' : 'bg-slate-500'}`}></div>
                </div>
                
                <div className="flex flex-col truncate cursor-pointer" onClick={() => setShowRightPanel(true)}>
                  <h3 className="font-bold text-slate-100 text-base leading-tight hover:underline decoration-slate-500 underline-offset-2">{activeChat.fullName}</h3>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-[11px] text-slate-400 font-medium truncate">{activeChat.headline || 'Developer'}</span>
                    <span className="w-1 h-1 rounded-full bg-slate-700"></span>
                    <span className="text-[11px] font-semibold text-indigo-400">2 Mutual Connections</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-1 sm:gap-2 shrink-0">
                <button onClick={handleStartVoiceCall} className="p-2.5 text-slate-400 hover:text-purple-400 hover:bg-purple-500/10 rounded-xl transition" title="Voice Call"><Phone size={18}/></button>
                <button onClick={handleStartVideoCall} className="p-2.5 text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-xl transition" title="Video Call"><Video size={18}/></button>
                <button onClick={handleStartCodeRoom} className="p-2.5 text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-xl transition mr-1" title="Live Code"><Code2 size={18}/></button>
                <div className="w-px h-6 bg-slate-800 hidden lg:block mx-1"></div>
                <button 
                  onClick={() => setShowRightPanel(!showRightPanel)} 
                  className={`p-2.5 hidden lg:flex rounded-xl transition ${showRightPanel ? 'bg-slate-800 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`} 
                  title="Toggle Profile Info"
                >
                  <MoreVertical size={18}/>
                </button>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-5 bg-slate-950">
              {messagesLoading ? (
                <div className="h-full flex items-center justify-center">
                  <Loader2 className="animate-spin h-8 w-8 text-indigo-500" />
                </div>
              ) : messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-4 opacity-70">
                  <div className="p-4 bg-slate-900 border border-slate-800 rounded-full text-indigo-400">
                    <MessageSquare size={32} />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-200 text-lg">Start a conversation with {activeChat.fullName}</h4>
                    <p className="text-sm text-slate-400 max-w-sm mt-1">This is the beginning of your direct message history.</p>
                  </div>
                </div>
              ) : (
                messages.map((msg, index) => {
                  const msgSenderId = msg.sender._id || msg.sender;
                  const isOwnMessage = msgSenderId === user._id;
                  
                  return (
                    <div key={msg._id || index} className={`flex gap-3 max-w-[85%] sm:max-w-[70%] ${isOwnMessage ? 'ml-auto flex-row-reverse' : ''}`}>
                      {!isOwnMessage && (
                        <img src={activeChat.profilePicture} alt="Sender" className="w-8 h-8 rounded-full object-cover mt-auto mb-1 border border-slate-800 shrink-0 shadow-sm" />
                      )}
                      <div className={`flex flex-col ${isOwnMessage ? 'items-end' : 'items-start'}`}>
                        <div className={`px-4 py-2.5 rounded-2xl text-[15px] leading-relaxed whitespace-pre-wrap ${
                          isOwnMessage
                            ? 'bg-gradient-to-br from-indigo-600 to-purple-600 text-white rounded-br-sm shadow-md shadow-indigo-950/50'
                            : 'bg-slate-800 border border-slate-700/80 text-slate-100 rounded-bl-sm shadow-sm'
                        }`}>
                          {msg.content}
                        </div>
                        <div className={`flex items-center gap-1.5 mt-1.5 px-1 text-[10px] font-semibold text-slate-500 ${isOwnMessage ? 'flex-row-reverse' : ''}`}>
                          <span>{new Date(msg.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          {/* Mock Read Receipt */}
                          {isOwnMessage && <CheckCheck size={14} className="text-indigo-400" />}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} className="h-2" />
            </div>

            {/* Composer */}
            <div className="p-4 bg-slate-900 border-t border-slate-800">
              <div className="bg-slate-950 border border-slate-800 rounded-2xl flex items-end overflow-hidden focus-within:border-indigo-500/50 focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all shadow-inner">
                
                {/* Left Attachments */}
                <div className="flex p-2 gap-0.5 shrink-0">
                  <button type="button" className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition" title="Attach file"><Paperclip size={18}/></button>
                </div>

                {/* Input */}
                <textarea 
                  value={newMessageText}
                  onChange={e => setNewMessageText(e.target.value)}
                  placeholder={`Message @${activeChat.fullName}...`}
                  className="flex-1 bg-transparent border-none py-3.5 px-2 text-[15px] text-slate-100 placeholder:text-slate-500 focus:outline-none resize-none max-h-32 min-h-[52px] leading-tight custom-scrollbar"
                  rows="1"
                  onKeyDown={(e) => {
                    if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(e); }
                  }}
                />

                {/* Right Actions */}
                <div className="flex p-2 gap-0.5 items-center shrink-0">
                  <button type="button" className="p-2 text-slate-400 hover:text-yellow-400 hover:bg-slate-800 rounded-xl transition" title="Emoji"><Smile size={18}/></button>
                  <button type="button" className="p-2 text-slate-400 hover:text-emerald-400 hover:bg-slate-800 rounded-xl transition" title="Voice Message"><Mic size={18}/></button>
                  
                  {/* Send Button */}
                  <button 
                    type="button" 
                    onClick={handleSendMessage} 
                    disabled={!newMessageText.trim()} 
                    className="p-2.5 ml-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:bg-slate-800 text-white disabled:text-slate-500 rounded-xl transition shadow-lg shadow-indigo-950/50"
                  >
                    <Send size={18} className={newMessageText.trim() ? "translate-x-0.5 -translate-y-0.5" : ""} />
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ── RIGHT PANE: Profile Panel ─────────────────────────────────── */}
      {activeChat && showRightPanel && (
        <div className="hidden lg:flex w-[320px] xl:w-[360px] bg-slate-900 border-l border-slate-800 flex-col overflow-y-auto custom-scrollbar shadow-[-10px_0_30px_-15px_rgba(0,0,0,0.5)]">
          
          {/* Cover & Avatar */}
          <div className="h-32 bg-gradient-to-br from-indigo-700 via-purple-700 to-indigo-900 relative">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-30 mix-blend-overlay"></div>
          </div>
          <div className="px-6 pb-6 -mt-12 relative flex flex-col items-center border-b border-slate-800">
            <img 
              src={activeChat.profilePicture} 
              alt="Avatar" 
              className="w-[100px] h-[100px] rounded-2xl border-4 border-slate-900 object-cover shadow-2xl bg-slate-800 mb-4" 
            />
            <h2 className="text-xl font-bold text-white tracking-tight">{activeChat.fullName}</h2>
            <p className="text-sm font-medium text-indigo-400 mb-5 text-center px-4 leading-tight">{activeChat.headline || activeChat.role || 'Software Engineer'}</p>
            
            <div className="flex gap-2 w-full">
              <a href={`/profile/${activeChat._id}`} className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-sm font-bold flex items-center justify-center transition border border-slate-700 shadow-sm">
                View Full Profile
              </a>
            </div>
          </div>

          {/* Details Scroll */}
          <div className="p-6 space-y-8 flex-1">
            
            {/* Stats */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-950 border border-slate-800/80 rounded-2xl p-4 text-center shadow-inner">
                <span className="block text-2xl font-black text-white">{activeChat.followers?.length || 0}</span>
                <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mt-1 block">Followers</span>
              </div>
              <div className="bg-slate-950 border border-slate-800/80 rounded-2xl p-4 text-center shadow-inner">
                <span className="block text-2xl font-black text-white">{activeChat.projects?.length || 0}</span>
                <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mt-1 block">Projects</span>
              </div>
            </div>

            {/* Skills */}
            <div>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                <Code2 size={14} className="text-indigo-400"/> Top Skills
              </h3>
              <div className="flex flex-wrap gap-2">
                {(activeChat.skills && activeChat.skills.length > 0 ? activeChat.skills : ['Add skills in profile']).map((skill, i) => (
                  <span key={i} className="px-3 py-1.5 bg-slate-950 border border-slate-800 text-slate-300 rounded-lg text-xs font-semibold shadow-sm">{skill}</span>
                ))}
              </div>
            </div>

            {/* Social Links */}
            <div>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                <ExternalLink size={14} className="text-indigo-400"/> Social Links
              </h3>
              <div className="space-y-2.5">
                {activeChat.githubLink ? (
                  <a href={activeChat.githubLink} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl transition text-slate-300 hover:text-white group">
                    <Github size={18} className="text-slate-400 group-hover:text-white"/> 
                    <span className="text-sm font-semibold">GitHub Profile</span>
                    <ExternalLink size={14} className="ml-auto text-slate-600 group-hover:text-slate-400" />
                  </a>
                ) : (
                  <div className="flex items-center gap-3 p-3 bg-slate-950/50 border border-slate-800/50 rounded-xl text-slate-600 opacity-60">
                    <Github size={18}/> 
                    <span className="text-sm font-semibold">No GitHub Linked</span>
                  </div>
                )}

                {activeChat.linkedinLink ? (
                  <a href={activeChat.linkedinLink} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl transition text-slate-300 hover:text-white group">
                    <Linkedin size={18} className="text-blue-400"/> 
                    <span className="text-sm font-semibold">LinkedIn Profile</span>
                    <ExternalLink size={14} className="ml-auto text-slate-600 group-hover:text-slate-400" />
                  </a>
                ) : (
                  <div className="flex items-center gap-3 p-3 bg-slate-950/50 border border-slate-800/50 rounded-xl text-slate-600 opacity-60">
                    <Linkedin size={18}/> 
                    <span className="text-sm font-semibold">No LinkedIn Linked</span>
                  </div>
                )}
              </div>
            </div>
            
          </div>
        </div>
      )}
      
    </div>
  );
};

export default Connections;
