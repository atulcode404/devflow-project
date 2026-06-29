import React from 'react';

const StatusIndicator = ({ isOnline, lastSeen }) => {
  // If user is explicitly online
  if (isOnline) {
    return (
      <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-400">
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
        Online
      </div>
    );
  }

  // Calculate time diff
  if (!lastSeen) {
    return (
      <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
        <span className="w-2 h-2 rounded-full bg-slate-600"></span>
        Offline
      </div>
    );
  }

  const now = new Date();
  const seen = new Date(lastSeen);
  const diffInMinutes = Math.floor((now - seen) / (1000 * 60));
  
  if (diffInMinutes < 60) {
    return (
      <div className="flex items-center gap-1.5 text-xs font-medium text-yellow-400">
        <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
        Active {diffInMinutes <= 0 ? 'just now' : `${diffInMinutes} min ago`}
      </div>
    );
  }
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return (
      <div className="flex items-center gap-1.5 text-xs font-medium text-orange-400">
        <span className="w-2 h-2 rounded-full bg-orange-500"></span>
        Active {diffInHours} hour{diffInHours > 1 ? 's' : ''} ago
      </div>
    );
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays === 1) {
    return (
      <div className="flex items-center gap-1.5 text-xs font-medium text-slate-400">
        <span className="w-2 h-2 rounded-full bg-slate-500"></span>
        Active yesterday
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
      <span className="w-2 h-2 rounded-full bg-slate-600"></span>
      Active {diffInDays} days ago
    </div>
  );
};

export default StatusIndicator;
