import React, { createContext, useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { AuthContext } from './AuthContext';
import api, { SOCKET_URL } from '../services/api';
import IncomingCallPopup from '../components/IncomingCallPopup';
import VideoCallModal from '../components/VideoCallModal';

export const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [socket, setSocket] = useState(null);

  // Global Call States
  const [showVideoCall, setShowVideoCall] = useState(false);
  const [isCallInitiator, setIsCallInitiator] = useState(false);
  const [incomingCall, setIncomingCall] = useState(null);
  const [incomingOffer, setIncomingOffer] = useState(null);
  const [callRemoteUser, setCallRemoteUser] = useState(null);
  const [isVoiceOnly, setIsVoiceOnly] = useState(false);
  const [roomId, setRoomId] = useState(null);
  const [isMergeCall, setIsMergeCall] = useState(false);
  const [iceBuffer, setIceBuffer] = useState([]); // Buffer ICE candidates while ringing
  const [activeUsers, setActiveUsers] = useState(new Set());
  
  // Custom Toast State
  const [toastMsg, setToastMsg] = useState(null);

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 4000);
  };

  // Initialize socket on user login
  useEffect(() => {
    if (!user) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
      return;
    }

    const newSocket = io(SOCKET_URL, {
      withCredentials: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      transports: ['websocket', 'polling'], // try websocket first, fallback to polling
      timeout: 20000, // 20s for Render cold starts
    });

    setSocket(newSocket);
    
    // Set user as online
    api.put('/users/status', { isOnline: true }).catch(console.error);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        api.put('/users/status', { isOnline: false }).catch(console.error);
      } else {
        api.put('/users/status', { isOnline: true }).catch(console.error);
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      api.put('/users/status', { isOnline: false }).catch(console.error);
      newSocket.disconnect();
    };
  }, [user]);

  // Global Socket Listeners for Calls
  useEffect(() => {
    if (!socket) return;

    const handleIncomingCall = ({ callerId, callerInfo, offer, isVoiceOnly: voiceOnly, roomId: incomingRoomId }) => {
      setIncomingCall({ callerId, callerInfo, isVoiceOnly: !!voiceOnly });
      setIncomingOffer(offer);
      setCallRemoteUser(callerInfo);
      setIsVoiceOnly(!!voiceOnly);
      setRoomId(incomingRoomId);
      setIsMergeCall(false);
      setIceBuffer([]); // Reset buffer for new call
      socket.emit('call-ringing', { targetUserId: callerId });
    };
    
    const handleMergeCallRequest = ({ requester, callerInfo, roomId: incomingRoomId }) => {
      setIncomingCall({ callerId: requester, callerInfo, isVoiceOnly: false }); // Merge calls are video/voice hybrid
      setCallRemoteUser(callerInfo);
      setRoomId(incomingRoomId);
      setIsMergeCall(true);
      socket.emit('call-ringing', { targetUserId: requester });
    };

    const handleCallRejected = () => {
      setShowVideoCall(false);
      setIsCallInitiator(false);
      setCallRemoteUser(null);
      setRoomId(null);
      showToast('📵 Call was declined.');
    };

    const handleCallBusy = () => {
      setShowVideoCall(false);
      setIsCallInitiator(false);
      setCallRemoteUser(null);
      setRoomId(null);
      showToast('The user is currently in another call.');
    };

    const handleCallFailed = ({ message }) => {
      setShowVideoCall(false);
      setIsCallInitiator(false);
      setCallRemoteUser(null);
      setRoomId(null);
      showToast('❌ ' + message);
    };

    const handleActiveUsers = (usersArray) => {
      setActiveUsers(new Set(usersArray));
    };

    const handleUserOnline = ({ userId }) => {
      setActiveUsers(prev => {
        const newSet = new Set(prev);
        newSet.add(userId);
        return newSet;
      });
    };

    const handleUserOffline = ({ userId }) => {
      setActiveUsers(prev => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    };

    const handleIceCandidate = ({ candidate, senderId }) => {
      // If video call modal is NOT open yet, buffer them!
      // (When it is open, VideoCallModal handles it directly)
      setIceBuffer(prev => [...prev, { candidate, senderId }]);
    };

    socket.on('incoming-call', handleIncomingCall);
    socket.on('call-merge-request', handleMergeCallRequest);
    socket.on('call-rejected', handleCallRejected);
    socket.on('call-busy', handleCallBusy);
    socket.on('call-failed', handleCallFailed);
    socket.on('ice-candidate', handleIceCandidate);
    socket.on('active-users', handleActiveUsers);
    socket.on('user-online', handleUserOnline);
    socket.on('user-offline', handleUserOffline);

    return () => {
      socket.off('incoming-call', handleIncomingCall);
      socket.off('call-merge-request', handleMergeCallRequest);
      socket.off('call-rejected', handleCallRejected);
      socket.off('call-busy', handleCallBusy);
      socket.off('call-failed', handleCallFailed);
      socket.off('ice-candidate', handleIceCandidate);
      socket.off('active-users', handleActiveUsers);
      socket.off('user-online', handleUserOnline);
      socket.off('user-offline', handleUserOffline);
    };
  }, [socket]);

  // API for starting/handling calls
  const startCall = (remoteUser, voiceOnly = false) => {
    if (!socket) return;
    const newRoomId = Math.random().toString(36).substring(2, 10);
    setRoomId(newRoomId);
    setCallRemoteUser(remoteUser);
    setIsCallInitiator(true);
    setIsVoiceOnly(voiceOnly);
    setShowVideoCall(true);
  };

  const answerCall = () => {
    setIsCallInitiator(false);
    setIncomingCall(null);
    setShowVideoCall(true);
  };

  const rejectCall = (navigateTarget = null) => {
    if (socket && incomingCall) {
      socket.emit('reject-call', { targetUserId: incomingCall.callerId });
    }
    setIncomingCall(null);
    setIncomingOffer(null);
    setCallRemoteUser(null);
    setRoomId(null);
    setIsMergeCall(false);
    if (navigateTarget) {
      navigate(navigateTarget);
    }
  };

  return (
    <SocketContext.Provider value={{ 
      socket, startCall, activeUsers, showToast
    }}>
      {children}

      {/* Global Toast Notification */}
      {toastMsg && (
        <div className="fixed top-24 right-6 z-[9999] bg-slate-800 text-white px-6 py-3 rounded-xl shadow-2xl border border-slate-700 animate-fade-in-up flex items-center gap-3">
          <span className="text-sm font-semibold">{toastMsg}</span>
        </div>
      )}
      
      {/* Global Call UI */}
      {incomingCall && (
        <IncomingCallPopup
          caller={incomingCall.callerInfo}
          isVoiceOnly={incomingCall.isVoiceOnly}
          isMergeCall={isMergeCall}
          onAnswer={answerCall}
          onReject={() => rejectCall(null)}
          onMessage={() => rejectCall('/connections')}
        />
      )}

      {showVideoCall && socket && (
        <VideoCallModal
          socket={socket}
          localUser={user}
          initialRemoteUser={callRemoteUser}
          isInitiator={isCallInitiator}
          incomingOffer={incomingOffer}
          isVoiceOnly={isVoiceOnly}
          roomId={roomId}
          isMergeCallJoined={isMergeCall}
          iceBuffer={iceBuffer}
          onClose={() => {
            setShowVideoCall(false);
            setCallRemoteUser(null);
            setIncomingOffer(null);
            setRoomId(null);
            setIsMergeCall(false);
            setIceBuffer([]);
          }}
        />
      )}
    </SocketContext.Provider>
  );
};
