import React from 'react';

const RemoteVideo = ({ videoRef, remoteUser, connectionState }) => {
  const isConnected = connectionState === 'connected';

  return (
    <div className="relative w-full h-full bg-slate-950">
      {/* Remote video stream */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        className="w-full h-full object-cover"
      />

      {/* Placeholder while connecting */}
      {!isConnected && (
        <div className="absolute inset-0 flex flex-col items-center justify-center space-y-4 bg-slate-950">
          <div className="relative">
            <span className="absolute inset-0 rounded-full bg-indigo-500/10 animate-ping scale-150"></span>
            <img
              src={remoteUser?.profilePicture || 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png'}
              alt={remoteUser?.fullName}
              className="w-24 h-24 rounded-full object-cover border-2 border-indigo-500/30 relative z-10"
            />
          </div>
          <div className="text-center space-y-1">
            <h3 className="text-slate-200 font-bold text-base">{remoteUser?.fullName}</h3>
            <p className="text-slate-500 text-sm animate-pulse">
              {connectionState === 'connecting' ? 'Calling...' :
               connectionState === 'disconnected' ? 'Disconnected' :
               connectionState === 'failed' ? 'Connection failed' : 'Connecting...'}
            </p>
          </div>
        </div>
      )}

      {/* Connected label bottom-left */}
      {isConnected && (
        <div className="absolute bottom-4 left-4 text-[10px] text-slate-300 bg-slate-950/60 px-2 py-1 rounded-lg font-semibold">
          {remoteUser?.fullName}
        </div>
      )}
    </div>
  );
};

export default RemoteVideo;
