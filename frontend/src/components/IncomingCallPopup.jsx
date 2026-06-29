import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Phone, PhoneOff, Video, Volume2, VolumeX, MessageSquare } from 'lucide-react';

// ── Generate ringtone using Web Audio API (no MP3 needed) ─────────────
const createRingtone = () => {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const gainNode = ctx.createGain();
    gainNode.connect(ctx.destination);
    gainNode.gain.value = 0.3;

    let isPlaying = false;
    let intervalId = null;

    const playTone = (freq, startTime, duration) => {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = freq;
      osc.connect(gainNode);
      osc.start(startTime);
      osc.stop(startTime + duration);
    };

    const ring = () => {
      const now = ctx.currentTime;
      playTone(440, now, 0.15);
      playTone(480, now + 0.15, 0.15);
      playTone(440, now + 0.4, 0.15);
      playTone(480, now + 0.55, 0.15);
    };

    return {
      start: () => {
        if (isPlaying) return;
        isPlaying = true;
        if (ctx.state === 'suspended') ctx.resume();
        ring();
        intervalId = setInterval(ring, 2000); // Ring every 2 seconds
      },
      stop: () => {
        isPlaying = false;
        if (intervalId) {
          clearInterval(intervalId);
          intervalId = null;
        }
      },
      setVolume: (vol) => {
        gainNode.gain.value = Math.max(0, Math.min(1, vol));
      },
      cleanup: () => {
        if (intervalId) clearInterval(intervalId);
        ctx.close().catch(() => {});
      },
    };
  } catch (e) {
    // Fallback: no audio
    return { start: () => {}, stop: () => {}, setVolume: () => {}, cleanup: () => {} };
  }
};

const IncomingCallPopup = ({ caller, isVoiceOnly, onAnswer, onReject, onMessage }) => {
  const [elapsed, setElapsed] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const ringtoneRef = useRef(null);

  // ── Start ringtone on mount ─────────────────────────────────────────
  useEffect(() => {
    const ringtone = createRingtone();
    ringtoneRef.current = ringtone;
    ringtone.start();

    return () => {
      ringtone.stop();
      ringtone.cleanup();
    };
  }, []);

  // ── Elapsed timer ───────────────────────────────────────────────────
  useEffect(() => {
    const timer = setInterval(() => setElapsed(e => e + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  // ── Stop ringtone + call parent handler ─────────────────────────────
  const handleAnswer = useCallback(() => {
    ringtoneRef.current?.stop();
    onAnswer();
  }, [onAnswer]);

  const handleReject = useCallback(() => {
    ringtoneRef.current?.stop();
    onReject();
  }, [onReject]);
  
  const handleMessage = useCallback(() => {
    ringtoneRef.current?.stop();
    onMessage();
  }, [onMessage]);

  const toggleMute = () => {
    if (isMuted) {
      ringtoneRef.current?.setVolume(0.3);
    } else {
      ringtoneRef.current?.setVolume(0);
    }
    setIsMuted(!isMuted);
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-slate-950/95 backdrop-blur-xl flex flex-col justify-between items-center py-20" style={{ animation: 'fadeIn 0.3s ease-out' }}>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes pulseRing {
          0% { transform: scale(1); opacity: 0.8; }
          50% { transform: scale(1.6); opacity: 0; }
          100% { transform: scale(1); opacity: 0; }
        }
      `}</style>

      {/* Top Section: Caller Info & Avatar */}
      <div className="flex flex-col items-center flex-1 justify-center space-y-12">
        
        <div className="text-center space-y-2">
          <p className="text-sm text-indigo-400 font-bold uppercase tracking-widest flex items-center justify-center gap-2">
            {isVoiceOnly ? <Phone size={14} /> : <Video size={14} />} 
            DevFlow {isVoiceOnly ? 'Voice' : 'Video'} Call
          </p>
          <h2 className="text-4xl font-extrabold text-slate-100">{caller?.fullName}</h2>
          <p className="text-slate-400">Incoming... {elapsed}s</p>
        </div>

        {/* Pulsing avatar */}
        <div className="relative flex justify-center items-center h-48 w-48">
          <span
            className="absolute inset-0 rounded-full bg-indigo-500/30"
            style={{ animation: 'pulseRing 2s ease-out infinite' }}
          />
          <span
            className="absolute inset-0 rounded-full bg-indigo-500/20"
            style={{ animation: 'pulseRing 2s ease-out infinite 0.6s' }}
          />
          <img
            src={caller?.profilePicture || 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png'}
            alt={caller?.fullName}
            className="w-32 h-32 rounded-full object-cover border-4 border-slate-800 relative z-10 shadow-2xl"
          />
        </div>
      </div>

      {/* Bottom Section: Action Buttons */}
      <div className="w-full max-w-sm px-6 pb-10 flex justify-between items-end">
        {/* Reject Button */}
        <div className="flex flex-col items-center gap-2">
          <button
            onClick={handleReject}
            className="h-16 w-16 bg-red-500 hover:bg-red-400 flex items-center justify-center text-white rounded-full shadow-lg shadow-red-500/30 transition-all hover:scale-110 active:scale-95"
          >
            <PhoneOff size={28} />
          </button>
          <span className="text-slate-300 font-medium text-sm">Decline</span>
        </div>

        {/* Message Button */}
        <div className="flex flex-col items-center gap-2 mb-4">
          <button
            onClick={handleMessage}
            className="h-12 w-12 bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-300 rounded-full shadow-lg transition-all hover:scale-110 active:scale-95 border border-slate-700"
          >
            <MessageSquare size={20} />
          </button>
          <span className="text-slate-400 font-medium text-xs">Message</span>
        </div>

        {/* Answer Button */}
        <div className="flex flex-col items-center gap-2">
          <button
            onClick={handleAnswer}
            className="h-16 w-16 bg-green-500 hover:bg-green-400 flex items-center justify-center text-white rounded-full shadow-lg shadow-green-500/30 transition-all hover:scale-110 active:scale-95 animate-bounce"
            style={{ animationDuration: '2s' }}
          >
            <Phone size={28} className="animate-pulse" />
          </button>
          <span className="text-slate-300 font-medium text-sm">Accept</span>
        </div>
      </div>

      {/* Volume toggle */}
      <div className="absolute top-8 right-8">
        <button
          onClick={toggleMute}
          className="flex items-center justify-center h-10 w-10 bg-slate-800/50 hover:bg-slate-700/50 rounded-full text-slate-400 transition cursor-pointer"
          title={isMuted ? 'Unmute ringtone' : 'Mute ringtone'}
        >
          {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
        </button>
      </div>

    </div>
  );
};

export default IncomingCallPopup;
