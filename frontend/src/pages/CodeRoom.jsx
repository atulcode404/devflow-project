import React, { useState, useEffect, useRef, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import { io } from 'socket.io-client';
import { AuthContext } from '../context/AuthContext';
import api, { SOCKET_URL } from '../services/api';
import {
  Copy, Download, LogOut, Users, Code2, CheckCheck,
  Loader2, ChevronDown, Send
} from 'lucide-react';

const LANGUAGES = [
  { value: 'javascript', label: 'JavaScript' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'python', label: 'Python' },
  { value: 'cpp', label: 'C++' },
  { value: 'java', label: 'Java' },
  { value: 'html', label: 'HTML' },
  { value: 'css', label: 'CSS' },
];

const STARTER_CODE = {
  javascript: '// DevFlow Pair Programming Room\n// Real-time collaborative code editor\n\nfunction greet(name) {\n  return `Hello, ${name}!`;\n}\n\nconsole.log(greet("Developer"));\n',
  typescript: '// TypeScript Room\n\nconst greet = (name: string): string => {\n  return `Hello, ${name}!`;\n};\n\nconsole.log(greet("Developer"));\n',
  python: '# Python Room\n\ndef greet(name):\n    return f"Hello, {name}!"\n\nprint(greet("Developer"))\n',
  cpp: '// C++ Room\n#include <iostream>\nusing namespace std;\n\nint main() {\n    cout << "Hello, Developer!" << endl;\n    return 0;\n}\n',
  java: '// Java Room\npublic class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello, Developer!");\n    }\n}\n',
  html: '<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8">\n  <title>DevFlow Room</title>\n</head>\n<body>\n  <h1>Hello, Developer!</h1>\n</body>\n</html>\n',
  css: '/* CSS Room */\nbody {\n  font-family: sans-serif;\n  background: #0f172a;\n  color: #e2e8f0;\n}\n',
};

const CodeRoom = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('javascript');
  const [participants, setParticipants] = useState([]);
  const [copied, setCopied] = useState(false);
  const [isRemoteChange, setIsRemoteChange] = useState(false);

  // Room chat
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const chatEndRef = useRef(null);

  // Timers
  const [sessionTime, setSessionTime] = useState(0);
  const socketRef = useRef(null);
  const editorRef = useRef(null);

  // Format time
  const formatTime = (s) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return h > 0
      ? `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
      : `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  };

  useEffect(() => {
    const timer = setInterval(() => setSessionTime(t => t + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch room data
  useEffect(() => {
    const fetchRoom = async () => {
      try {
        // Join room via API
        const joinRes = await api.post('/rooms/join', { roomId });
        const r = joinRes.data.room;
        setRoom(r);
        setCode(r.code || STARTER_CODE[r.language] || STARTER_CODE.javascript);
        setLanguage(r.language || 'javascript');
        setParticipants(r.participants || []);
      } catch (err) {
        setError(err.response?.data?.message || 'Room not found or closed');
      } finally {
        setLoading(false);
      }
    };

    fetchRoom();
  }, [roomId]);

  // Socket setup
  useEffect(() => {
    const socket = io(SOCKET_URL, { withCredentials: true });
    socketRef.current = socket;

    socket.emit('join-room', { roomId });

    socket.on('code-update', ({ code: newCode }) => {
      setIsRemoteChange(true);
      setCode(newCode);
    });

    socket.on('language-update', ({ language: newLang }) => {
      setLanguage(newLang);
    });

    socket.on('room-user-joined', ({ userId }) => {
      // Refetch participants
      api.get(`/rooms/${roomId}`).then(res => {
        setParticipants(res.data.participants || []);
      }).catch(() => {});
    });

    socket.on('room-user-left', ({ userId }) => {
      setParticipants(prev => prev.filter(p => p._id !== userId));
    });

    socket.on('room-chat-message', (msg) => {
      setChatMessages(prev => [...prev, msg]);
    });

    return () => {
      socket.emit('leave-room', { roomId });
      socket.disconnect();
    };
  }, [roomId]);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const handleEditorChange = (value) => {
    if (isRemoteChange) {
      setIsRemoteChange(false);
      return;
    }
    setCode(value || '');
    socketRef.current?.emit('code-change', { roomId, code: value || '' });
  };

  const handleLanguageChange = (newLang) => {
    setLanguage(newLang);
    const newCode = STARTER_CODE[newLang] || '';
    setCode(newCode);
    socketRef.current?.emit('language-change', { roomId, language: newLang });
    socketRef.current?.emit('code-change', { roomId, code: newCode });
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const ext = { javascript: 'js', typescript: 'ts', python: 'py', cpp: 'cpp', java: 'java', html: 'html', css: 'css' };
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `devflow-session.${ext[language] || 'txt'}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSaveAndLeave = async () => {
    try {
      await api.put(`/rooms/${roomId}/code`, { code, language });
    } catch (err) { /* ignore */ }
    socketRef.current?.emit('leave-room', { roomId });
    navigate('/connections');
  };

  const sendChatMessage = () => {
    if (!chatInput.trim()) return;
    const msg = {
      sender: { _id: user._id, fullName: user.fullName, profilePicture: user.profilePicture },
      text: chatInput.trim(),
      timestamp: new Date().toISOString(),
    };
    socketRef.current?.emit('room-chat-message', { roomId, msg });
    setChatMessages(prev => [...prev, msg]);
    setChatInput('');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="animate-spin h-10 w-10 text-indigo-500 mx-auto" />
          <p className="text-slate-400 text-sm">Joining coding room...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center space-y-4 max-w-sm">
          <div className="text-5xl">🚫</div>
          <h2 className="text-xl font-bold text-slate-200">{error}</h2>
          <button
            onClick={() => navigate('/connections')}
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold rounded-xl transition cursor-pointer"
          >
            Back to Connections
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-slate-950 flex flex-col overflow-hidden">
      {/* Top Bar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900 border-b border-slate-800 shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-indigo-400">
            <Code2 size={16} />
            <span className="text-sm font-bold text-slate-100">DevFlow Code Room</span>
          </div>
          <span className="px-2 py-0.5 bg-slate-950 border border-slate-800 rounded text-[10px] font-mono text-slate-400">
            {roomId}
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* Session timer */}
          <span className="text-xs font-mono text-slate-400 bg-slate-950 border border-slate-800 px-2.5 py-1 rounded-lg">
            ⏱ {formatTime(sessionTime)}
          </span>

          {/* Language Selector */}
          <div className="relative">
            <select
              value={language}
              onChange={(e) => handleLanguageChange(e.target.value)}
              className="appearance-none bg-slate-950 border border-slate-800 rounded-lg pl-3 pr-7 py-1.5 text-xs text-slate-300 focus:outline-none cursor-pointer"
            >
              {LANGUAGES.map(l => (
                <option key={l.value} value={l.value}>{l.label}</option>
              ))}
            </select>
            <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
          </div>

          <button
            onClick={handleCopyCode}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs font-bold rounded-lg transition cursor-pointer"
          >
            {copied ? <CheckCheck size={13} className="text-green-400" /> : <Copy size={13} />}
            {copied ? 'Copied!' : 'Copy'}
          </button>

          <button
            onClick={handleDownload}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs font-bold rounded-lg transition cursor-pointer"
          >
            <Download size={13} />
            Download
          </button>

          <button
            onClick={handleSaveAndLeave}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 text-xs font-bold rounded-lg transition cursor-pointer"
          >
            <LogOut size={13} />
            Leave
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Monaco Editor */}
        <div className="flex-1 overflow-hidden">
          <Editor
            height="100%"
            language={language}
            value={code}
            onChange={handleEditorChange}
            onMount={(editor) => { editorRef.current = editor; }}
            theme="vs-dark"
            options={{
              fontSize: 14,
              fontFamily: '"Fira Code", "JetBrains Mono", monospace',
              fontLigatures: true,
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
              wordWrap: 'on',
              padding: { top: 16, bottom: 16 },
              smoothScrolling: true,
              cursorSmoothCaretAnimation: 'on',
              lineNumbers: 'on',
              renderWhitespace: 'none',
              bracketPairColorization: { enabled: true },
            }}
          />
        </div>

        {/* Right Sidebar */}
        <div className="w-64 bg-slate-900 border-l border-slate-800 flex flex-col shrink-0">
          {/* Participants */}
          <div className="p-4 border-b border-slate-800">
            <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Users size={11} /> Participants ({participants.length})
            </h4>
            <div className="space-y-2">
              {participants.map((p) => (
                <div key={p._id} className="flex items-center gap-2">
                  <div className="relative">
                    <img
                      src={p.profilePicture}
                      alt={p.fullName}
                      className="w-7 h-7 rounded-full object-cover border border-slate-700"
                    />
                    <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-400 rounded-full border border-slate-900"></span>
                  </div>
                  <span className="text-xs text-slate-300 font-semibold truncate">
                    {p.fullName}
                    {p._id === room?.host?._id && (
                      <span className="ml-1 text-[9px] text-indigo-400 font-bold">(host)</span>
                    )}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Room Chat */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="p-3 border-b border-slate-800">
              <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Room Chat</h4>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
              {chatMessages.length === 0 ? (
                <p className="text-slate-600 text-[10px] text-center italic mt-4">No messages yet. Say hello!</p>
              ) : (
                chatMessages.map((msg, i) => (
                  <div key={i} className={`flex gap-1.5 ${msg.sender._id === user._id ? 'flex-row-reverse' : ''}`}>
                    <img
                      src={msg.sender.profilePicture}
                      alt={msg.sender.fullName}
                      className="w-5 h-5 rounded-full object-cover border border-slate-700 shrink-0 mt-0.5"
                    />
                    <div className={`max-w-[80%] ${msg.sender._id === user._id ? 'items-end' : 'items-start'} flex flex-col`}>
                      <div className={`px-2.5 py-1.5 rounded-xl text-[11px] ${
                        msg.sender._id === user._id
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-800 text-slate-200'
                      }`}>
                        {msg.text}
                      </div>
                    </div>
                  </div>
                ))
              )}
              <div ref={chatEndRef} />
            </div>

            <div className="p-3 border-t border-slate-800 flex gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendChatMessage()}
                placeholder="Send a message..."
                className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-[11px] text-slate-300 placeholder-slate-600 outline-none focus:border-indigo-500"
              />
              <button
                onClick={sendChatMessage}
                className="p-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-white transition cursor-pointer"
              >
                <Send size={13} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CodeRoom;
