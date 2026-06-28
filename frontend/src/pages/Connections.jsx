import React, { useState, useEffect, useContext, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { SOCKET_URL } from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { Check, X, MessageSquare, Send, ArrowLeft, Loader2, Sparkles, Video, Code2 } from 'lucide-react';
import { io } from 'socket.io-client';
import VideoCallModal from '../components/VideoCallModal';
import IncomingCallPopup from '../components/IncomingCallPopup';

const Connections = () => {
  const [connections, setConnections] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  // ── Chat State ──────────────────────────────────────────────────────
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessageText, setNewMessageText] = useState('');
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [socket, setSocket] = useState(null);
  const messagesEndRef = useRef(null);

  // ── Video Call State ────────────────────────────────────────────────
  const [showVideoCall, setShowVideoCall] = useState(false);
  const [isCallInitiator, setIsCallInitiator] = useState(false);
  const [incomingCall, setIncomingCall] = useState(null);
  const [incomingOffer, setIncomingOffer] = useState(null);
  const [callRemoteUser, setCallRemoteUser] = useState(null); // Always holds the peer user

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

  // ── Socket setup ────────────────────────────────────────────────────
  useEffect(() => {
    const newSocket = io(SOCKET_URL, { withCredentials: true });
    setSocket(newSocket);
    return () => newSocket.disconnect();
  }, [user]);

  // ── Socket event listeners ──────────────────────────────────────────
  useEffect(() => {
    if (!socket) return;

    socket.on('newConnectionRequest', fetchConnections);
    socket.on('connectionAccepted', fetchConnections);

    // Video Call — incoming
    socket.on('incoming-call', ({ callerId, callerInfo, offer }) => {
      setIncomingCall({ callerId, callerInfo });
      setIncomingOffer(offer);
      setCallRemoteUser(callerInfo); // ← save caller so remoteUser never goes undefined
    });

    socket.on('call-rejected', () => {
      setShowVideoCall(false);
      setIsCallInitiator(false);
      setCallRemoteUser(null);
      alert('📵 Call was declined.');
    });

    return () => {
      socket.off('newConnectionRequest', fetchConnections);
      socket.off('connectionAccepted', fetchConnections);
      socket.off('incoming-call');
      socket.off('call-rejected');
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

  // ── Video Call handlers ─────────────────────────────────────────────
  const handleStartVideoCall = () => {
    if (!activeChat || !socket) return;
    setCallRemoteUser(activeChat); // ← save who we are calling
    setIsCallInitiator(true);
    setShowVideoCall(true);
  };

  const handleAnswerCall = () => {
    // Keep incomingCall.callerInfo in callRemoteUser — already set by socket listener
    setIsCallInitiator(false);
    setIncomingCall(null);  // dismiss popup
    setShowVideoCall(true); // open modal (callRemoteUser is still set)
  };

  const handleRejectCall = () => {
    if (socket && incomingCall) {
      socket.emit('reject-call', { targetUserId: incomingCall.callerId });
    }
    setIncomingCall(null);
    setIncomingOffer(null);
    setCallRemoteUser(null);
  };

  // ── Code Room handler ───────────────────────────────────────────────
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
      <div className="flex flex-col justify-center items-center h-[calc(100vh-4rem)] bg-slate-900">
        <Loader2 className="animate-spin h-10 w-10 text-indigo-500 mb-4" />
        <p className="text-slate-400 text-sm animate-pulse">Loading connections...</p>
      </div>
    );
  }

  // ── Main render ─────────────────────────────────────────────────────
  return (
    <>
      <div className="min-h-[calc(100vh-4rem)] bg-slate-950 text-slate-100 flex">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col md:flex-row gap-6">

          {/* ── Left Pane ─────────────────────────────────────────── */}
          <div className={`flex-1 flex flex-col gap-8 transition-all duration-300 ${activeChat ? 'md:max-w-md hidden md:flex' : ''}`}>

            {/* Pending Requests */}
            <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
              <h2 className="text-xl font-bold text-slate-100 mb-6 flex items-center gap-2">
                Pending Requests
                {pendingRequests.length > 0 && (
                  <span className="bg-indigo-600/30 text-indigo-400 border border-indigo-500/30 py-0.5 px-2.5 rounded-full text-xs font-semibold">
                    {pendingRequests.length}
                  </span>
                )}
              </h2>
              {pendingRequests.length === 0 ? (
                <p className="text-slate-400 text-sm italic bg-slate-950/50 p-4 rounded-xl border border-slate-900 text-center">
                  No pending requests right now.
                </p>
              ) : (
                <div className="space-y-4">
                  {pendingRequests.map(req => (
                    <div key={req._id} className="bg-slate-950 border border-slate-800/80 rounded-xl p-4 flex items-center justify-between transition hover:border-slate-700">
                      <div className="flex items-center gap-3">
                        <img src={req.sender.profilePicture} alt="Profile" className="w-10 h-10 rounded-full object-cover border border-slate-700" />
                        <div className="min-w-0">
                          <h4 className="font-semibold text-slate-100 text-sm truncate w-28 sm:w-36">{req.sender.fullName}</h4>
                          <p className="text-xs text-slate-400 truncate w-28 sm:w-36">{req.sender.bio || 'Wants to connect'}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => handleRespond(req._id, 'accepted')} className="p-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition cursor-pointer" title="Accept">
                          <Check size={16} />
                        </button>
                        <button onClick={() => handleRespond(req._id, 'rejected')} className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-red-400 rounded-lg transition cursor-pointer" title="Reject">
                          <X size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Your Network */}
            <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex-1 flex flex-col">
              <h2 className="text-xl font-bold text-slate-100 mb-6">Your Network</h2>
              {activeConnections.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center p-8 bg-slate-950/50 rounded-xl border border-slate-900 text-center min-h-[250px]">
                  <p className="text-slate-400 text-sm italic mb-4">You don't have any connections yet.</p>
                  <a href="/" className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-400 hover:underline bg-indigo-500/10 border border-indigo-500/20 px-3 py-1.5 rounded-lg transition">
                    <Sparkles size={14} /> Go to Developer Feed
                  </a>
                </div>
              ) : (
                <div className="space-y-3 overflow-y-auto max-h-[500px] pr-1">
                  {activeConnections.map(conn => {
                    const connectedUser = conn.sender._id === user._id ? conn.receiver : conn.sender;
                    const isCurrentChat = activeChat && activeChat._id === connectedUser._id;
                    return (
                      <div
                        key={conn._id}
                        onClick={() => setActiveChat(connectedUser)}
                        className={`group p-4 rounded-xl border flex items-center justify-between cursor-pointer transition ${
                          isCurrentChat
                            ? 'bg-indigo-600/15 border-indigo-500/50'
                            : 'bg-slate-950 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900/50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <img src={connectedUser.profilePicture} alt="Profile" className="w-12 h-12 rounded-full object-cover border border-slate-700" />
                          <div>
                            <h4 className="font-semibold text-slate-100 text-sm group-hover:text-indigo-400 transition">{connectedUser.fullName}</h4>
                            <div className="mt-1 flex flex-wrap gap-1">
                              {(connectedUser.skills || []).slice(0, 2).map((s, i) => (
                                <span key={i} className="text-[10px] text-slate-400 px-1.5 py-0.5 rounded border border-slate-800">{s}</span>
                              ))}
                            </div>
                          </div>
                        </div>
                        <button className={`p-2 rounded-lg transition ${isCurrentChat ? 'bg-indigo-600 text-white' : 'bg-slate-900 text-slate-400 group-hover:text-indigo-400 border border-slate-800'}`}>
                          <MessageSquare size={16} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </div>

          {/* ── Right Pane — Chat ──────────────────────────────────── */}
          <div className={`flex-1 flex flex-col bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden transition-all duration-300 ${!activeChat ? 'hidden md:flex items-center justify-center p-12 min-h-[500px]' : 'flex min-h-[500px] h-[calc(100vh-8rem)]'}`}>
            {!activeChat ? (
              <div className="text-center max-w-sm space-y-4">
                <div className="w-16 h-16 rounded-full bg-slate-950 border border-slate-800 flex items-center justify-center mx-auto text-indigo-400 shadow-inner">
                  <MessageSquare size={32} />
                </div>
                <h3 className="text-lg font-bold text-slate-200">Start Messaging</h3>
                <p className="text-slate-400 text-sm">Select a connected developer from your network list to open a chat.</p>
              </div>
            ) : (
              <div className="flex-1 flex flex-col h-full">

                {/* ── Chat Header with VIDEO CALL + CODE ROOM buttons ── */}
                <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setActiveChat(null)}
                      className="md:hidden p-1.5 bg-slate-800 text-slate-400 hover:text-white rounded-lg mr-2 cursor-pointer"
                    >
                      <ArrowLeft size={16} />
                    </button>
                    <img src={activeChat.profilePicture} alt="Profile" className="w-10 h-10 rounded-full object-cover border border-slate-700" />
                    <div>
                      <h3 className="font-bold text-slate-100 text-sm sm:text-base leading-tight">{activeChat.fullName}</h3>
                      <p className="text-xs text-emerald-400">● Online</p>
                    </div>
                  </div>

                  {/* ★★★ VIDEO CALL + CODE ROOM BUTTONS ★★★ */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleStartVideoCall}
                      title="Start Video Call"
                      className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600/20 hover:bg-indigo-600/40 border border-indigo-500/30 text-indigo-400 hover:text-indigo-300 rounded-xl transition cursor-pointer text-xs font-semibold"
                    >
                      <Video size={15} />
                      <span className="hidden sm:inline">Video Call</span>
                    </button>
                    <button
                      onClick={handleStartCodeRoom}
                      title="Open Code Room"
                      className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600/20 hover:bg-emerald-600/40 border border-emerald-500/30 text-emerald-400 hover:text-emerald-300 rounded-xl transition cursor-pointer text-xs font-semibold"
                    >
                      <Code2 size={15} />
                      <span className="hidden sm:inline">Code Room</span>
                    </button>
                  </div>
                </div>

                {/* ── Messages ────────────────────────────────────── */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-900/30">
                  {messagesLoading ? (
                    <div className="h-full flex items-center justify-center">
                      <Loader2 className="animate-spin h-8 w-8 text-indigo-500" />
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-3">
                      <div className="p-3 bg-slate-950 border border-slate-800 rounded-full text-indigo-500">
                        <Sparkles size={20} />
                      </div>
                      <h4 className="font-bold text-slate-300 text-sm">Say Hello!</h4>
                      <p className="text-xs text-slate-400 max-w-xs">Send a message to start chatting, or start a video call to connect face-to-face!</p>
                    </div>
                  ) : (
                    messages.map((msg, index) => {
                      const msgSenderId = msg.sender._id || msg.sender;
                      const isOwnMessage = msgSenderId === user._id;
                      return (
                        <div
                          key={msg._id || index}
                          className={`flex gap-3 max-w-[85%] sm:max-w-[70%] ${isOwnMessage ? 'ml-auto flex-row-reverse' : ''}`}
                        >
                          {!isOwnMessage && (
                            <img src={activeChat.profilePicture} alt="Sender" className="w-8 h-8 rounded-full object-cover mt-0.5 border border-slate-800" />
                          )}
                          <div>
                            <div className={`p-3.5 rounded-2xl text-sm leading-relaxed ${
                              isOwnMessage
                                ? 'bg-indigo-600 text-white rounded-tr-none shadow-md shadow-indigo-950/20'
                                : 'bg-slate-950 border border-slate-800/80 text-slate-200 rounded-tl-none'
                            }`}>
                              {msg.content}
                            </div>
                            <span className={`text-[10px] text-slate-500 mt-1 block px-1 ${isOwnMessage ? 'text-right' : ''}`}>
                              {new Date(msg.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* ── Message Input ────────────────────────────────── */}
                <form onSubmit={handleSendMessage} className="p-4 bg-slate-950 border-t border-slate-800 flex gap-2">
                  <input
                    type="text"
                    value={newMessageText}
                    onChange={e => setNewMessageText(e.target.value)}
                    placeholder={`Message ${activeChat.fullName}...`}
                    className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-slate-100 text-sm transition placeholder-slate-500"
                  />
                  <button
                    type="submit"
                    disabled={!newMessageText.trim()}
                    className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl flex items-center justify-center gap-1.5 transition text-sm font-semibold cursor-pointer"
                  >
                    <Send size={16} /> <span className="hidden sm:inline">Send</span>
                  </button>
                </form>

              </div>
            )}
          </div>

        </div>
      </div>

      {/* ── Video Call Overlay ─────────────────────────────────────────── */}
      {showVideoCall && socket && callRemoteUser && (
        <VideoCallModal
          socket={socket}
          localUser={user}
          remoteUser={callRemoteUser}
          isInitiator={isCallInitiator}
          incomingOffer={incomingOffer}
          onClose={() => {
            setShowVideoCall(false);
            setIsCallInitiator(false);
            setIncomingOffer(null);
            setCallRemoteUser(null);
          }}
        />
      )}

      {/* ── Incoming Call Popup ────────────────────────────────────────── */}
      {incomingCall && !showVideoCall && (
        <IncomingCallPopup
          caller={incomingCall.callerInfo}
          onAnswer={handleAnswerCall}
          onReject={handleRejectCall}
        />
      )}
    </>
  );
};

export default Connections;
