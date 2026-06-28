import React from 'react';
import { Mic, MicOff, Video, VideoOff, PhoneOff, Monitor, StopCircle } from 'lucide-react';

const CallControls = ({ isMuted, isCameraOff, isScreenSharing, onToggleMute, onToggleCamera, onToggleScreenShare, onEndCall }) => {
  return (
    <div className="flex items-center justify-center gap-4 py-6 border-t border-slate-800 bg-slate-950">
      {/* Mute / Unmute */}
      <button
        onClick={onToggleMute}
        title={isMuted ? 'Unmute microphone' : 'Mute microphone'}
        className={`w-12 h-12 rounded-full border flex items-center justify-center transition cursor-pointer ${
          isMuted
            ? 'bg-red-500/20 border-red-500/30 text-red-400 hover:bg-red-500/30'
            : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
        }`}
      >
        {isMuted ? <MicOff size={18} /> : <Mic size={18} />}
      </button>

      {/* Camera On / Off */}
      <button
        onClick={onToggleCamera}
        title={isCameraOff ? 'Turn camera on' : 'Turn camera off'}
        className={`w-12 h-12 rounded-full border flex items-center justify-center transition cursor-pointer ${
          isCameraOff
            ? 'bg-red-500/20 border-red-500/30 text-red-400 hover:bg-red-500/30'
            : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
        }`}
      >
        {isCameraOff ? <VideoOff size={18} /> : <Video size={18} />}
      </button>

      {/* Screen Share */}
      <button
        onClick={onToggleScreenShare}
        title={isScreenSharing ? 'Stop screen sharing' : 'Share your screen'}
        className={`w-12 h-12 rounded-full border flex items-center justify-center transition cursor-pointer ${
          isScreenSharing
            ? 'bg-indigo-500/30 border-indigo-500/50 text-indigo-300 hover:bg-indigo-500/40'
            : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
        }`}
      >
        {isScreenSharing ? <StopCircle size={18} /> : <Monitor size={18} />}
      </button>

      {/* End Call */}
      <button
        onClick={onEndCall}
        title="End call"
        className="w-14 h-14 rounded-full bg-red-500 hover:bg-red-400 border-0 flex items-center justify-center transition cursor-pointer shadow-lg shadow-red-950/50"
      >
        <PhoneOff size={22} className="text-white" />
      </button>
    </div>
  );
};

export default CallControls;
