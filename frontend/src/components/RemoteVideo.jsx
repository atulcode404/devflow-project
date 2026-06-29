import React from 'react';

const FALLBACK_AVATAR = 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png';

const RemoteVideo = ({ videoRef, remoteUser, connectionState }) => {
  const isConnected = connectionState === 'connected';

  const statusText = {
    connecting:    'Connecting…',
    disconnected:  'Disconnected',
    failed:        'Connection failed',
    reconnecting:  'Reconnecting…',
  }[connectionState] || 'Calling…';

  return (
    <div className="relative w-full h-full bg-slate-950">
      {/* Remote video stream */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        className={`w-full h-full object-cover transition-opacity duration-300 ${isConnected ? 'opacity-100' : 'opacity-0'}`}
      />

      {/* Placeholder while not connected */}
      {!isConnected && (
        <div className="absolute inset-0 flex flex-col items-center justify-center space-y-5 bg-slate-950">
          {/* Animated avatar ring */}
          <div className="relative flex items-center justify-center">
            <span className="absolute w-36 h-36 rounded-full bg-indigo-500/10 animate-ping" />
            <span className="absolute w-28 h-28 rounded-full bg-indigo-500/15 animate-pulse" />
            <img
              src={remoteUser?.profilePicture || FALLBACK_AVATAR}
              alt={remoteUser?.fullName}
              onError={e => { e.target.onerror = null; e.target.src = FALLBACK_AVATAR; }}
              className="w-24 h-24 rounded-full object-cover border-2 border-indigo-500/40 relative z-10"
            />
          </div>
          <div className="text-center space-y-1.5">
            <h3 className="text-slate-200 font-bold text-lg">{remoteUser?.fullName}</h3>
            <p className="text-slate-500 text-sm animate-pulse">{statusText}</p>
          </div>
        </div>
      )}

      {/* Connected nameplate */}
      {isConnected && (
        <div className="absolute bottom-4 left-4 text-[11px] text-slate-200 bg-slate-950/70 backdrop-blur-sm px-3 py-1.5 rounded-xl font-semibold flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 bg-green-400 rounded-full" />
          {remoteUser?.fullName}
        </div>
      )}
    </div>
  );
};

export default RemoteVideo;
