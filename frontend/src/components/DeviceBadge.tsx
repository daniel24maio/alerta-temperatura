import React from 'react';

interface DeviceBadgeProps {
  status: 'online' | 'offline';
  lastSeen?: string;
}

export const DeviceBadge: React.FC<DeviceBadgeProps> = ({ status, lastSeen }) => {
  const isOnline = status === 'online';
  const formattedTime = lastSeen ? new Date(lastSeen).toLocaleTimeString() : '--:--';

  return (
    <div
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border ${
        isOnline
          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
          : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
      }`}
    >
      <span
        className={`w-2 h-2 rounded-full ${
          isOnline ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]' : 'bg-rose-400 shadow-[0_0_8px_#f87171]'
        }`}
      />
      <span>
        {isOnline ? `Online (${formattedTime})` : `Offline (${formattedTime})`}
      </span>
    </div>
  );
};
