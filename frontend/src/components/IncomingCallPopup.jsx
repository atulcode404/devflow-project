import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Phone, PhoneOff, Video, Volume2, VolumeX } from 'lucide-react';

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
      // Two-tone ring pattern (like a phone)
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

const IncomingCallPopup = ({ caller, onAnswer, onReject }) => {
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

  const toggleMute = () => {
    if (isMuted) {
      ringtoneRef.current?.setVolume(0.3);
    } else {
      ringtoneRef.current?.setVolume(0);
    }
    setIsMuted(!isMuted);
  };

  return (
    <div className="fixed bottom-6 right-6 z-[9999]" style={{ animation: 'slideIn 0.3s ease-out' }}>
      <style>{`
        @keyframes slideIn {
          from { transform: translateX(120%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes pulseRing {
          0% { transform: scale(1); opacity: 0.6; }
          50% { transform: scale(1.3); opacity: 0; }
          100% { transform: scale(1); opacity: 0; }
        }
      `}</style>

      <div className="bg-slate-900 border border-indigo-500/30 rounded-3xl shadow-2xl shadow-indigo-950/50 p-5 w-72 space-y-4 backdrop-blur-xl">
        {/* Pulsing avatar */}
        <div className="flex justify-center">
          <div className="relative">
            <span
              className="absolute inset-0 rounded-full bg-indigo-500/20"
              style={{ animation: 'pulseRing 1.5s ease-out infinite' }}
            />
            <span
              className="absolute inset-0 rounded-full bg-indigo-500/10"
              style={{ animation: 'pulseRing 1.5s ease-out infinite 0.5s' }}
            />
            <img
              src={caller?.profilePicture || 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png'}
              alt={caller?.fullName}
              className="w-16 h-16 rounded-full object-cover border-2 border-indigo-500/50 relative z-10"
            />
          </div>
        </div>

        {/* Caller info */}
        <div className="text-center space-y-1">
          <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest flex items-center justify-center gap-1.5">
            <Video size={11} /> Incoming Video Call
          </p>
          <h3 className="text-base font-extrabold text-slate-100">{caller?.fullName}</h3>
          <p className="text-xs text-slate-500">Ringing... {elapsed}s</p>
        </div>

        {/* Volume toggle */}
        <div className="flex justify-center">
          <button
            onClick={toggleMute}
            className="flex items-center gap-1.5 text-[10px] text-slate-500 hover:text-slate-300 transition cursor-pointer"
          >
            {isMuted ? <VolumeX size={12} /> : <Volume2 size={12} />}
            {isMuted ? 'Unmute ringtone' : 'Mute ringtone'}
          </button>
        </div>

        {/* Action buttons */}
        <div className="flex gap-3">
          <button
            onClick={handleReject}
            className="flex-1 flex items-center justify-center gap-2 py-3 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 rounded-2xl font-bold text-sm transition cursor-pointer"
          >
            <PhoneOff size={16} /> Reject
          </button>
          <button
            onClick={handleAnswer}
            className="flex-1 flex items-center justify-center gap-2 py-3 bg-green-500/20 hover:bg-green-500/30 border border-green-500/30 text-green-400 rounded-2xl font-bold text-sm transition cursor-pointer"
          >
            <Phone size={16} /> Answer
          </button>
        </div>
      </div>
    </div>
  );
};

export default IncomingCallPopup;
