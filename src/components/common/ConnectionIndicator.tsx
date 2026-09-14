'use client';

import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';

export function ConnectionIndicator() {
  const [isOnline, setIsOnline] = useState(true);
  const [lastSynced, setLastSynced] = useState<string>('');

  useEffect(() => {
    setIsOnline(navigator.onLine);
    const updateTime = () => {
      const now = new Date();
      setLastSynced(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    };
    updateTime();

    const handleOnline = () => {
      setIsOnline(true);
      updateTime();
    };
    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const interval = setInterval(updateTime, 60000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, []);

  return (
    <div 
      className={`inline-flex items-center gap-1.5 text-[11px] font-medium px-2 py-0.5 rounded-full border transition-all ${
        isOnline
          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
          : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30'
      }`}
      title={isOnline ? `Online - Last synced at ${lastSynced}` : 'Offline - Showing cached state'}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
      <span className="hidden sm:inline font-bold">
        {isOnline ? `Live (${lastSynced})` : 'Offline'}
      </span>
      <span className="sm:hidden font-bold">
        {isOnline ? 'Live' : 'Offline'}
      </span>
    </div>
  );
}