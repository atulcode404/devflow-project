import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Video, PhoneOff, RotateCcw, AlertTriangle, Phone, Clock, Minimize2, Maximize2, Mic, MicOff, UserPlus, Search, X } from 'lucide-react';
import LocalVideo from './LocalVideo';
import RemoteVideo from './RemoteVideo';
import CallControls from './CallControls';
import api from '../services/api';

const RTC_CONFIG = {
  iceServers: [
    { urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'] },
    {
      urls: 'turn:openrelay.metered.ca:80',
      username: 'openrelayproject',
      credential: 'openrelayproject',
    },
    {
      urls: 'turn:openrelay.metered.ca:443',
      username: 'openrelayproject',
      credential: 'openrelayproject',
    }
  ],
  iceCandidatePoolSize: 10,
};

const CALL_TIMEOUT_SEC = 30;

const formatDuration = (s) =>
  `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

const STATE_COLOR = {
  Calling:      'text-yellow-400',
  Ringing:      'text-amber-400',
  Connecting:   'text-cyan-400',
  Connected:    'text-green-400',
  Reconnecting: 'text-orange-400',
  Failed:       'text-red-500',
  Ended:        'text-slate-500',
};

const VideoCallModal = ({
  socket, localUser, initialRemoteUser,
  isInitiator, incomingOffer,
  isVoiceOnly = false,
  roomId,
  isMergeCallJoined = false,
  iceBuffer = [],
  onClose,
}) => {
  const localVideoRef   = useRef(null);
  const localStreamRef  = useRef(null);
  const screenTrackRef  = useRef(null);

  // Mesh WebRTC State
  const peersRef = useRef(new Map()); // Map<userId, RTCPeerConnection>
  const iceQueuesRef = useRef(new Map()); // Map<userId, RTCIceCandidate[]>
  const remoteDescsSetRef = useRef(new Set()); // Set<userId>

  const [participants, setParticipants] = useState({}); // { [userId]: { user: Object, stream: MediaStream, state: String } }
  
  // Timers
  const callStartTimeRef = useRef(Date.now());
  const timeoutRef = useRef(null); 
  const timerRef = useRef(null);

  // UI State
  const [isMuted,         setIsMuted]         = useState(false);
  const [isCameraOff,     setIsCameraOff]     = useState(isVoiceOnly);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [callDuration,    setCallDuration]    = useState(0);
  const [roomState,       setRoomState]       = useState(isInitiator ? 'Calling' : 'Connecting');
  
  const roomStateRef = useRef(roomState);
  useEffect(() => { roomStateRef.current = roomState; }, [roomState]);
  const [timeoutCountdown, setTimeoutCountdown] = useState(CALL_TIMEOUT_SEC);
  const [errorMsg,        setErrorMsg]        = useState('');
  const [isMinimized,     setIsMinimized]     = useState(false);
  
  // Add Participant Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [connections, setConnections] = useState([]);

  // ── 1. Cleanup ───────────────────────────────────────────────────────
  const cleanup = useCallback(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(t => t.stop());
      localStreamRef.current = null;
    }
    if (screenTrackRef.current) {
      screenTrackRef.current.stop();
      screenTrackRef.current = null;
    }
    peersRef.current.forEach(pc => pc.close());
    peersRef.current.clear();
    clearTimeout(timeoutRef.current);
    socket.emit('end-call', { targetUserId: null, roomId }); // Notify server to leave room
  }, [socket, roomId]);

  const handleEndCall = useCallback((isManual = false) => {
    setRoomState('Ended');
    cleanup();
    if (isManual) {
      // Notify all participants we are leaving
      Object.keys(participants).forEach(userId => {
        socket.emit('end-call', { targetUserId: userId, roomId });
      });
    }
    setTimeout(() => onClose(), 1500);
  }, [cleanup, onClose, participants, socket, roomId]);

  // ── 2. Create Peer Connection for a User ──────────────────────────────
  const createPeer = useCallback((userId, userInfo) => {
    if (peersRef.current.has(userId)) return peersRef.current.get(userId);

    const pc = new RTCPeerConnection(RTC_CONFIG);
    peersRef.current.set(userId, pc);
    iceQueuesRef.current.set(userId, []);

    // Add local tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        pc.addTrack(track, localStreamRef.current);
      });
    }

    pc.onicecandidate = (e) => {
      if (e.candidate) {
        socket.emit('ice-candidate', { targetUserId: userId, candidate: e.candidate });
      }
    };

    pc.onconnectionstatechange = () => {
      setParticipants(prev => ({
        ...prev,
        [userId]: { ...prev[userId], state: pc.connectionState === 'connected' ? 'Connected' : pc.connectionState }
      }));
      if (pc.connectionState === 'connected') {
        setRoomState('Connected');
        clearTimeout(timeoutRef.current);
      } else if (pc.connectionState === 'failed') {
        // If a specific peer failed, we don't fail the whole room unless it's the only peer
        console.error(`Connection with ${userId} failed`);
      }
    };

    pc.ontrack = (e) => {
      setParticipants(prev => ({
        ...prev,
        [userId]: { user: userInfo, stream: e.streams[0], state: 'Connected' }
      }));
    };

    return pc;
  }, [socket]);

  // ── 3. Initialization & Local Media ──────────────────────────────────
  useEffect(() => {
    let mounted = true;

    const init = async () => {
      try {
        let stream;
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: !isVoiceOnly,
            audio: true,
          });
        } catch (mediaErr) {
          console.warn('Camera failed, falling back to audio only', mediaErr);
          stream = await navigator.mediaDevices.getUserMedia({
            video: false,
            audio: true,
          });
          setIsCameraOff(true);
        }
        
        if (!mounted) {
          stream.getTracks().forEach(t => t.stop());
          return;
        }
        localStreamRef.current = stream;
        if (localVideoRef.current) localVideoRef.current.srcObject = stream;

        // If this is a standard 1-to-1 initial call
        if (initialRemoteUser) {
          setParticipants({
            [initialRemoteUser._id]: { user: initialRemoteUser, stream: null, state: isInitiator ? 'Calling' : 'Connecting' }
          });

          const pc = createPeer(initialRemoteUser._id, initialRemoteUser);

          if (isInitiator) {
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            // First call uses standard `call-user` to trigger popup
            socket.emit('call-user', { 
              targetUserId: initialRemoteUser._id, 
              offer, 
              callerInfo: {
                _id: localUser._id,
                fullName: localUser.fullName,
                profilePicture: localUser.profilePicture
              }, 
              isVoiceOnly,
              roomId
            });

            timeoutRef.current = setTimeout(() => {
              if (roomStateRef.current !== 'Connected') {
                socket.emit('call-timeout', { targetUserId: initialRemoteUser._id });
                setRoomState('Failed');
                setErrorMsg('No answer from user.');
                cleanup();
              }
            }, CALL_TIMEOUT_SEC * 1000);

          } else if (incomingOffer) {
            // We are receiving the initial call
            await pc.setRemoteDescription(new RTCSessionDescription(incomingOffer));
            remoteDescsSetRef.current.add(initialRemoteUser._id);
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            socket.emit('answer-call', { targetUserId: initialRemoteUser._id, answer, roomId, isVoiceOnly });
            
            // Apply buffered ICE candidates if any were received while ringing
            if (iceBuffer && iceBuffer.length > 0) {
              iceBuffer.forEach(item => {
                if (item.senderId === initialRemoteUser._id) {
                  pc.addIceCandidate(new RTCIceCandidate(item.candidate)).catch(console.error);
                }
              });
            }
          }
        } else if (isMergeCallJoined) {
          // We joined an existing room! Wait for participant-joined or peer-offers
          setRoomState('Connected');
        }

      } catch (err) {
        console.error('Media error:', err);
        setErrorMsg('Camera/Microphone access denied or unavailable.');
        setRoomState('Failed');
      }
    };

    init();
    return () => { mounted = false; cleanup(); };
  }, [isInitiator, isVoiceOnly, initialRemoteUser, incomingOffer, isMergeCallJoined, socket, roomId]);

  // ── 4. Mesh Network Socket Events ────────────────────────────────────
  useEffect(() => {
    if (!socket) return;

    const handleCallAnswered = async ({ answer, senderId }) => {
      const pc = peersRef.current.get(senderId);
      if (pc) {
        await pc.setRemoteDescription(new RTCSessionDescription(answer));
        remoteDescsSetRef.current.add(senderId);
        // Drain ICE queue
        const queue = iceQueuesRef.current.get(senderId) || [];
        queue.forEach(c => pc.addIceCandidate(new RTCIceCandidate(c)).catch(console.error));
        iceQueuesRef.current.set(senderId, []);
        clearTimeout(timeoutRef.current);
      }
    };

    const handleIceCandidate = async ({ candidate, senderId }) => {
      const pc = peersRef.current.get(senderId);
      if (pc) {
        if (remoteDescsSetRef.current.has(senderId)) {
          pc.addIceCandidate(new RTCIceCandidate(candidate)).catch(console.error);
        } else {
          iceQueuesRef.current.get(senderId).push(candidate);
        }
      }
    };

    const handleCallRinging = () => {
      if (roomState === 'Calling') setRoomState('Ringing');
    };

    const handleCallEnded = ({ endedBy }) => {
      if (peersRef.current.has(endedBy)) {
        peersRef.current.get(endedBy).close();
        peersRef.current.delete(endedBy);
        setParticipants(prev => {
          const newP = { ...prev };
          delete newP[endedBy];
          return newP;
        });
      }
      
      // If everyone left except us
      if (peersRef.current.size === 0) {
        handleEndCall(false);
      }
    };

    const handleParticipantJoined = async ({ joinedUserId }) => {
      // New user joined room! We must create offer for them.
      // We don't have their callerInfo yet, but peer-offer can pass our info
      const pc = createPeer(joinedUserId, { _id: joinedUserId, fullName: 'Connecting...' });
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      
      socket.emit('peer-offer', { 
        targetUserId: joinedUserId, 
        offer, 
        callerInfo: {
          _id: localUser._id,
          fullName: localUser.fullName,
          profilePicture: localUser.profilePicture
        }
      });
    };

    const handlePeerOffer = async ({ offer, senderId, callerInfo }) => {
      // Received an offer inside the room from an existing participant
      const pc = createPeer(senderId, callerInfo);
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      remoteDescsSetRef.current.add(senderId);
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      
      socket.emit('peer-answer', { targetUserId: senderId, answer });
    };

    socket.on('call-answered', handleCallAnswered);
    socket.on('peer-answer', handleCallAnswered); // Same logic
    socket.on('ice-candidate', handleIceCandidate);
    socket.on('call-ringing', handleCallRinging);
    socket.on('call-ended', handleCallEnded);
    socket.on('participant-joined', handleParticipantJoined);
    socket.on('peer-offer', handlePeerOffer);
    socket.on('call-participant-left', handleCallEnded);

    return () => {
      socket.off('call-answered', handleCallAnswered);
      socket.off('peer-answer', handleCallAnswered);
      socket.off('ice-candidate', handleIceCandidate);
      socket.off('call-ringing', handleCallRinging);
      socket.off('call-ended', handleCallEnded);
      socket.off('participant-joined', handleParticipantJoined);
      socket.off('peer-offer', handlePeerOffer);
      socket.off('call-participant-left', handleCallEnded);
    };
  }, [socket, roomState, handleEndCall, createPeer, localUser]);

  // Duration Timer
  useEffect(() => {
    if (roomState !== 'Connected') return;
    timerRef.current = setInterval(() => setCallDuration(d => d + 1), 1000);
    return () => clearInterval(timerRef.current);
  }, [roomState]);

  // Pre-connect timeout countdown
  useEffect(() => {
    if (!isInitiator || roomState === 'Connected' || roomState === 'Failed' || roomState === 'Ended') return;
    const id = setInterval(() => {
      const elapsed = Math.floor((Date.now() - callStartTimeRef.current) / 1000);
      setTimeoutCountdown(Math.max(0, CALL_TIMEOUT_SEC - elapsed));
    }, 1000);
    return () => clearInterval(id);
  }, [isInitiator, roomState]);


  // ── Controls ────────────────────────────────────────────────────────
  const handleToggleMute = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  };

  const handleToggleCamera = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsCameraOff(!videoTrack.enabled);
      }
    }
  };

  const handleToggleScreenShare = async () => {
    if (isScreenSharing) {
      screenTrackRef.current?.stop();
      setIsScreenSharing(false);
      const videoTrack = localStreamRef.current?.getVideoTracks()[0];
      peersRef.current.forEach(pc => {
        const sender = pc.getSenders().find(s => s.track?.kind === 'video');
        if (sender && videoTrack) sender.replaceTrack(videoTrack);
      });
      if (localVideoRef.current) localVideoRef.current.srcObject = localStreamRef.current;
    } else {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        const screenTrack = screenStream.getVideoTracks()[0];
        screenTrackRef.current = screenTrack;
        
        peersRef.current.forEach(pc => {
          const sender = pc.getSenders().find(s => s.track?.kind === 'video');
          if (sender) sender.replaceTrack(screenTrack);
        });
        
        if (localVideoRef.current) localVideoRef.current.srcObject = screenStream;
        setIsScreenSharing(true);
        screenTrack.onended = () => {
          setIsScreenSharing(false);
          const ct = localStreamRef.current?.getVideoTracks()[0];
          peersRef.current.forEach(pc => {
            const sender = pc.getSenders().find(s => s.track?.kind === 'video');
            if (sender && ct) sender.replaceTrack(ct);
          });
          if (localVideoRef.current) localVideoRef.current.srcObject = localStreamRef.current;
        };
      } catch (err) {
        console.error('[Screen] share failed:', err);
      }
    }
  };

  // ── Add Participant Modal ──────────────────────────────────────────
  const handleOpenAddModal = async () => {
    setShowAddModal(true);
    try {
      const res = await api.get('/connections');
      setConnections(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleInviteParticipant = (userToInvite) => {
    socket.emit('call-merge-request', { 
      targetUserId: userToInvite._id, 
      roomId, 
      callerInfo: {
        _id: localUser._id,
        fullName: localUser.fullName,
        profilePicture: localUser.profilePicture
      }
    });
    setShowAddModal(false);
    alert(`Invite sent to ${userToInvite.fullName}!`);
  };

  // ── Render ────────────────────────────────────────────────────────
  const showVideoArea = !isVoiceOnly && roomState !== 'Failed' && roomState !== 'Ended';
  const participantsList = Object.values(participants);
  const mainRemote = participantsList.length > 0 ? participantsList[0] : null;

  // Mini Floating Window
  if (isMinimized) {
    return (
      <div className="fixed bottom-6 right-6 z-[9990] w-72 h-48 bg-slate-900 border border-slate-700 rounded-2xl overflow-hidden shadow-2xl flex flex-col group cursor-move">
        <div className="flex-1 relative overflow-hidden bg-slate-950 flex items-center justify-center">
          {showVideoArea && mainRemote?.stream ? (
            <video
              autoPlay
              playsInline
              ref={(v) => { if (v && v.srcObject !== mainRemote.stream) v.srcObject = mainRemote.stream; }}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="flex -space-x-4">
              {participantsList.map((p, i) => (
                <img
                  key={p.user._id || i}
                  src={p.user.profilePicture || 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png'}
                  className="w-16 h-16 rounded-full object-cover border-2 border-slate-700"
                />
              ))}
            </div>
          )}

          {/* Hover Overlay */}
          <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-3">
            <div className="flex justify-between items-start">
              <span className="bg-slate-900/80 text-slate-300 text-[10px] px-2 py-1 rounded-full backdrop-blur-sm truncate max-w-[120px]">
                {participantsList.length} Participants
              </span>
              <button
                onClick={() => setIsMinimized(false)}
                className="p-1.5 bg-slate-800/80 hover:bg-slate-700 rounded-full text-slate-300 transition"
              >
                <Maximize2 size={14} />
              </button>
            </div>
            <div className="flex justify-center gap-3">
              <button onClick={handleToggleMute} className={`p-2.5 rounded-full transition ${isMuted ? 'bg-red-500/20 text-red-400' : 'bg-slate-800/80 text-slate-300'}`}>
                {isMuted ? <MicOff size={16} /> : <Mic size={16} />}
              </button>
              <button onClick={() => handleEndCall(true)} className="p-2.5 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-lg transition">
                <PhoneOff size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Determine Grid Class for multiple participants
  const gridClass = participantsList.length === 1 ? 'grid-cols-1' : 
                    participantsList.length === 2 ? 'grid-cols-2' : 
                    participantsList.length <= 4 ? 'grid-cols-2 grid-rows-2' : 'grid-cols-3 grid-rows-2';

  return (
    <div className="fixed inset-0 z-[9990] bg-slate-950/97 backdrop-blur-xl flex flex-col font-sans select-none">
      
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex -space-x-2">
            {participantsList.slice(0,3).map(p => (
              <img
                key={p.user._id}
                src={p.user.profilePicture || 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png'}
                className="w-10 h-10 rounded-full object-cover border border-slate-700"
              />
            ))}
            {participantsList.length > 3 && (
              <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-slate-300">
                +{participantsList.length - 3}
              </div>
            )}
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-100">
              {participantsList.length === 1 ? participantsList[0].user.fullName : 'Group Call'}
            </h3>
            <p className={`text-[10px] font-semibold uppercase tracking-wider ${STATE_COLOR[roomState] || 'text-slate-400'}`}>
              ● {roomState}
              {roomState === 'Connected' && ` · ${formatDuration(callDuration)}`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-slate-500 text-xs">
          <button onClick={handleOpenAddModal} className="flex items-center gap-1 bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-full transition shadow-lg shadow-indigo-500/20 mr-2">
            <UserPlus size={14} /> Add
          </button>

          {isVoiceOnly ? <Phone size={14} className="text-purple-400" /> : <Video size={14} className="text-indigo-400" />}
          <span className="hidden sm:inline">{isVoiceOnly ? 'Voice Call' : 'Video Call'} · DevFlow</span>
          
          <button onClick={() => setIsMinimized(true)} title="Minimize call" className="ml-2 p-2 hover:bg-slate-800 rounded-lg transition text-slate-400 hover:text-slate-200">
            <Minimize2 size={16} />
          </button>
        </div>
      </div>

      {/* Main Area */}
      <div className="flex-1 relative overflow-hidden flex items-center justify-center p-4">
        
        {/* State Overlays */}
        {roomState === 'Failed' && (
          <div className="absolute inset-0 z-20 bg-slate-900/95 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center">
            <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-full mb-4">
              <AlertTriangle size={36} />
            </div>
            <h2 className="text-xl font-bold text-slate-100 mb-2">Connection Failed</h2>
            <p className="text-sm text-slate-400 max-w-xs mb-6">{errorMsg || 'Could not connect.'}</p>
            <button onClick={() => handleEndCall(true)} className="flex items-center gap-2 px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-semibold transition cursor-pointer">
              <PhoneOff size={16} /> Close
            </button>
          </div>
        )}

        {/* Video Grid for Multi-peer */}
        {showVideoArea && (
          <div className={`w-full h-full grid ${gridClass} gap-4 max-w-6xl mx-auto`}>
            {participantsList.map(p => (
              <div key={p.user._id} className="relative rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 shadow-xl flex items-center justify-center group">
                <video 
                  autoPlay 
                  playsInline 
                  ref={(v) => { if (v && v.srcObject !== p.stream) v.srcObject = p.stream; }} 
                  className="w-full h-full object-cover" 
                />
                <div className="absolute bottom-4 left-4 bg-slate-950/70 backdrop-blur-md px-3 py-1.5 rounded-full border border-slate-700/50 flex items-center gap-2">
                  <span className="text-xs font-medium text-slate-200">{p.user.fullName}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Local Video Picture-in-Picture */}
        {showVideoArea && (
          <div className="absolute bottom-6 right-6 w-48 aspect-[3/4] rounded-2xl overflow-hidden shadow-2xl border border-slate-700 bg-slate-900 z-10">
             <video ref={localVideoRef} autoPlay playsInline muted className={`w-full h-full object-cover ${!isScreenSharing ? 'scale-x-[-1]' : ''}`} />
             {isCameraOff && !isScreenSharing && (
                <div className="absolute inset-0 bg-slate-800 flex items-center justify-center">
                  <img src={localUser?.profilePicture} className="w-16 h-16 rounded-full object-cover opacity-50" />
                </div>
             )}
          </div>
        )}

        {/* Voice-only Waiting Screen */}
        {isVoiceOnly && roomState !== 'Failed' && roomState !== 'Ended' && (
          <div className="flex flex-col items-center justify-center gap-6">
            <div className="flex gap-4">
              {participantsList.map(p => (
                <div key={p.user._id} className="relative">
                  <img src={p.user.profilePicture} className="w-32 h-32 rounded-full object-cover border-4 border-slate-700 animate-pulse" />
                  {/* Hidden audio element to play remote stream */}
                  <audio 
                    autoPlay 
                    playsInline 
                    ref={(a) => { if (a && a.srcObject !== p.stream) a.srcObject = p.stream; }} 
                  />
                </div>
              ))}
            </div>
            <div className="text-center">
              <h3 className="text-slate-100 text-xl font-bold">{participantsList.length} Participants</h3>
              <p className={`text-sm mt-1 animate-pulse ${STATE_COLOR[roomState]}`}>{roomState}</p>
            </div>
          </div>
        )}
      </div>

      {/* Add Participant Modal */}
      {showAddModal && (
        <div className="absolute inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-slate-100">Add to Call</h2>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white">
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
              {connections.map(conn => {
                const isAlreadyInCall = participants[conn._id];
                return (
                  <div key={conn._id} className="flex items-center justify-between p-3 bg-slate-950 border border-slate-800 rounded-xl">
                    <div className="flex items-center gap-3">
                      <img src={conn.profilePicture} className="w-10 h-10 rounded-full" />
                      <span className="text-sm font-medium text-slate-200">{conn.fullName}</span>
                    </div>
                    {isAlreadyInCall ? (
                      <span className="text-xs text-green-400 font-semibold px-3 py-1 bg-green-500/10 rounded-full">In Call</span>
                    ) : (
                      <button 
                        onClick={() => handleInviteParticipant(conn)}
                        className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full text-xs font-semibold transition"
                      >
                        Invite
                      </button>
                    )}
                  </div>
                );
              })}
              {connections.length === 0 && (
                <div className="text-center text-slate-500 py-4 text-sm">No connections available.</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Controls bar */}
      <CallControls
        isMuted={isMuted}
        isCameraOff={isCameraOff || isVoiceOnly}
        isScreenSharing={isScreenSharing}
        onToggleMute={handleToggleMute}
        onToggleCamera={isVoiceOnly ? undefined : handleToggleCamera}
        onToggleScreenShare={isVoiceOnly ? undefined : handleToggleScreenShare}
        onEndCall={() => handleEndCall(true)}
      />
    </div>
  );
};

export default VideoCallModal;
