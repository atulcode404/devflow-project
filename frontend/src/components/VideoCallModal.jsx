import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Video } from 'lucide-react';
import LocalVideo from './LocalVideo';
import RemoteVideo from './RemoteVideo';
import CallControls from './CallControls';

// ── STUN servers for NAT traversal (free Google servers) ──────────────
const STUN_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
  ],
};

// ── Format MM:SS ──────────────────────────────────────────────────────
const formatDuration = (s) =>
  `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

// ── Connection state badge color ──────────────────────────────────────
const stateColor = {
  connecting: 'text-yellow-400',
  connected: 'text-green-400',
  disconnected: 'text-red-400',
  failed: 'text-red-500',
  closed: 'text-slate-500',
};

// ═══════════════════════════════════════════════════════════════════════
// VideoCallModal — Composes LocalVideo + RemoteVideo + CallControls
// Props:
//   socket        — active Socket.io socket
//   localUser     — current user object { _id, fullName, profilePicture }
//   remoteUser    — peer user object     { _id, fullName, profilePicture }
//   isInitiator   — true if this user started the call
//   incomingOffer — WebRTC offer from the caller (only set for receiver)
//   onClose       — callback to destroy modal
// ═══════════════════════════════════════════════════════════════════════
const VideoCallModal = ({ socket, localUser, remoteUser, isInitiator, incomingOffer, onClose }) => {
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const pcRef = useRef(null);               // RTCPeerConnection
  const localStreamRef = useRef(null);      // local MediaStream
  const screenTrackRef = useRef(null);      // screen share track

  // ── UI state ─────────────────────────────────────────────────────────
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [connectionState, setConnectionState] = useState('connecting');
  const timerRef = useRef(null);

  // ── 1. Build RTCPeerConnection ────────────────────────────────────────
  const createPeerConnection = useCallback(() => {
    const pc = new RTCPeerConnection(STUN_SERVERS);

    // Send ICE candidates to peer via socket.io
    pc.onicecandidate = ({ candidate }) => {
      if (candidate) {
        socket.emit('ice-candidate', { targetUserId: remoteUser._id, candidate });
      }
    };

    // Receive remote video/audio track
    pc.ontrack = ({ streams }) => {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = streams[0];
      }
    };

    // Track connection changes → update badge + start timer
    pc.onconnectionstatechange = () => {
      setConnectionState(pc.connectionState);
      if (pc.connectionState === 'connected') {
        timerRef.current = setInterval(() => setCallDuration(d => d + 1), 1000);
      }
    };

    pcRef.current = pc;
    return pc;
  }, [socket, remoteUser]);

  // ── 2. Get local camera + microphone ─────────────────────────────────
  const startLocalStream = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      localStreamRef.current = stream;
      if (localVideoRef.current) localVideoRef.current.srcObject = stream;
      return stream;
    } catch (err) {
      console.error('Could not access camera/mic:', err);
      return null;
    }
  }, []);

  // ── 3. Caller flow — create & send offer ─────────────────────────────
  const startCall = useCallback(async () => {
    const stream = await startLocalStream();
    if (!stream) return;

    const pc = createPeerConnection();
    stream.getTracks().forEach(track => pc.addTrack(track, stream));

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    // → call-user
    socket.emit('call-user', {
      targetUserId: remoteUser._id,
      offer,
      callerInfo: {
        _id: localUser._id,
        fullName: localUser.fullName,
        profilePicture: localUser.profilePicture,
      },
    });
  }, [createPeerConnection, startLocalStream, socket, remoteUser, localUser]);

  // ── 4. Receiver flow — accept offer & send answer ────────────────────
  const answerCall = useCallback(async () => {
    const stream = await startLocalStream();
    if (!stream) return;

    const pc = createPeerConnection();
    stream.getTracks().forEach(track => pc.addTrack(track, stream));

    // → answer-call
    await pc.setRemoteDescription(new RTCSessionDescription(incomingOffer));
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);

    socket.emit('answer-call', { targetUserId: remoteUser._id, answer });
  }, [createPeerConnection, startLocalStream, incomingOffer, socket, remoteUser]);

  // ── 5. Socket.io listeners ────────────────────────────────────────────
  useEffect(() => {
    if (!socket) return;

    // call-answered → complete handshake
    socket.on('call-answered', async ({ answer }) => {
      if (pcRef.current) {
        await pcRef.current.setRemoteDescription(new RTCSessionDescription(answer));
      }
    });

    // ice-candidate → add to peer connection
    socket.on('ice-candidate', async ({ candidate }) => {
      if (pcRef.current && candidate) {
        try {
          await pcRef.current.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (e) { /* ignore */ }
      }
    });

    // end-call → remote user hung up
    socket.on('call-ended', () => handleEndCall(false));

    return () => {
      socket.off('call-answered');
      socket.off('ice-candidate');
      socket.off('call-ended');
    };
  }, [socket]);

  // ── 6. Init call on mount ─────────────────────────────────────────────
  useEffect(() => {
    if (isInitiator) {
      startCall();
    } else {
      answerCall();
    }
    return cleanup;
  }, []);

  // ── 7. Cleanup all resources ──────────────────────────────────────────
  const cleanup = () => {
    localStreamRef.current?.getTracks().forEach(t => t.stop());
    screenTrackRef.current?.stop();
    pcRef.current?.close();
    if (timerRef.current) clearInterval(timerRef.current);
  };

  // ── 8. End call ───────────────────────────────────────────────────────
  const handleEndCall = (notify = true) => {
    if (notify) {
      socket.emit('end-call', { targetUserId: remoteUser._id });
    }
    cleanup();
    onClose();
  };

  // ── 9. CallControls callbacks ─────────────────────────────────────────
  const handleToggleMute = () => {
    localStreamRef.current?.getAudioTracks().forEach(t => { t.enabled = !t.enabled; });
    setIsMuted(m => !m);
  };

  const handleToggleCamera = () => {
    localStreamRef.current?.getVideoTracks().forEach(t => { t.enabled = !t.enabled; });
    setIsCameraOff(c => !c);
  };

  const handleToggleScreenShare = async () => {
    if (isScreenSharing) {
      // Switch back to camera
      screenTrackRef.current?.stop();
      const cameraTrack = localStreamRef.current?.getVideoTracks()[0];
      if (cameraTrack && pcRef.current) {
        const sender = pcRef.current.getSenders().find(s => s.track?.kind === 'video');
        sender?.replaceTrack(cameraTrack);
        if (localVideoRef.current) localVideoRef.current.srcObject = localStreamRef.current;
      }
      setIsScreenSharing(false);
    } else {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        const screenTrack = screenStream.getVideoTracks()[0];
        screenTrackRef.current = screenTrack;

        const sender = pcRef.current?.getSenders().find(s => s.track?.kind === 'video');
        sender?.replaceTrack(screenTrack);
        if (localVideoRef.current) localVideoRef.current.srcObject = screenStream;

        setIsScreenSharing(true);

        // Auto-revert when user stops via browser UI
        screenTrack.onended = () => {
          setIsScreenSharing(false);
          const cameraTrack = localStreamRef.current?.getVideoTracks()[0];
          pcRef.current?.getSenders().find(s => s.track?.kind === 'video')?.replaceTrack(cameraTrack);
          if (localVideoRef.current) localVideoRef.current.srcObject = localStreamRef.current;
        };
      } catch (err) {
        console.error('Screen share failed:', err);
      }
    }
  };

  // ── Render ────────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-[9990] bg-slate-950/95 backdrop-blur-xl flex flex-col">

      {/* ── Header ──────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 shrink-0">
        <div className="flex items-center gap-3">
          <img
            src={remoteUser?.profilePicture}
            alt={remoteUser?.fullName}
            className="w-9 h-9 rounded-full object-cover border border-slate-700"
          />
          <div>
            <h3 className="text-sm font-bold text-slate-100">{remoteUser?.fullName}</h3>
            <p className={`text-[10px] font-semibold uppercase tracking-wider ${stateColor[connectionState] || 'text-slate-400'}`}>
              {connectionState === 'connected'
                ? `● Connected · ${formatDuration(callDuration)}`
                : `● ${connectionState}`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-slate-500 text-xs">
          <Video size={14} className="text-indigo-400" />
          <span>Video Call · DevFlow</span>
        </div>
      </div>

      {/* ── Video Area ───────────────────────────────────────────────── */}
      <div className="flex-1 relative overflow-hidden">
        {/* RemoteVideo fills the main area */}
        <RemoteVideo
          videoRef={remoteVideoRef}
          remoteUser={remoteUser}
          connectionState={connectionState}
        />

        {/* LocalVideo PiP bottom-right */}
        <LocalVideo
          videoRef={localVideoRef}
          isCameraOff={isCameraOff}
          isScreenSharing={isScreenSharing}
        />
      </div>

      {/* ── CallControls bar ─────────────────────────────────────────── */}
      <CallControls
        isMuted={isMuted}
        isCameraOff={isCameraOff}
        isScreenSharing={isScreenSharing}
        onToggleMute={handleToggleMute}
        onToggleCamera={handleToggleCamera}
        onToggleScreenShare={handleToggleScreenShare}
        onEndCall={() => handleEndCall(true)}
      />
    </div>
  );
};

export default VideoCallModal;
