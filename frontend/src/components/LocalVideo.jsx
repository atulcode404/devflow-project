import React from 'react';
import { VideoOff } from 'lucide-react';

const LocalVideo = ({ videoRef, isCameraOff, isScreenSharing }) => {
  return (
    <div className="absolute bottom-4 right-4 w-36 h-24 rounded-xl overflow-hidden border-2 border-slate-700 shadow-xl bg-slate-900 z-10">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="w-full h-full object-cover"
      />
      {isCameraOff && !isScreenSharing && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-900">
          <VideoOff size={20} className="text-slate-500" />
        </div>
      )}
      <div className="absolute bottom-1 left-1.5 text-[9px] text-slate-400 font-semibold bg-slate-950/60 px-1.5 py-0.5 rounded">
        You {isScreenSharing ? '(Screen)' : ''}
      </div>
    </div>
  );
};

export default LocalVideo;
