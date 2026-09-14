'use client';

import React, { useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { RefreshCw, Pause, Play, ChevronDown, ChevronUp } from 'lucide-react';

const AUTO_RELOAD_INTERVAL = 10; // 10 seconds
const STORAGE_KEY = 'agriflow_auto_reload_enabled';

export default function AutoReloadController() {
  const pathname = usePathname();
  const [secondsLeft, setSecondsLeft] = useState<number>(AUTO_RELOAD_INTERVAL);
  const [isEnabled, setIsEnabled] = useState<boolean>(true);
  const [isMinimized, setIsMinimized] = useState<boolean>(false);
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // 1. Hydrate preference from localStorage (defaults to true)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored !== null) {
        setIsEnabled(stored === 'true');
      }
    }
  }, []);

  // 2. Check if active on auth pages or phone GPS beacon
  const isAuthPage = Boolean(
    pathname &&
    (pathname.includes('/login') ||
     pathname.includes('/register') ||
     pathname.includes('/complete-profile'))
  );

  // 3. Monitor active typing in forms to avoid wiping out user input
  useEffect(() => {
    const handleFocusIn = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      if (
        target &&
        (target.tagName === 'INPUT' ||
         target.tagName === 'TEXTAREA' ||
         target.tagName === 'SELECT' ||
         target.isContentEditable)
      ) {
        setIsTyping(true);
      }
    };

    const handleFocusOut = () => {
      setTimeout(() => {
        const active = document.activeElement as HTMLElement | null;
        if (
          !active ||
          (active.tagName !== 'INPUT' &&
           active.tagName !== 'TEXTAREA' &&
           active.tagName !== 'SELECT' &&
           !active.isContentEditable)
        ) {
          setIsTyping(false);
        }
      }, 150);
    };

    document.addEventListener('focusin', handleFocusIn);
    document.addEventListener('focusout', handleFocusOut);
    return () => {
      document.removeEventListener('focusin', handleFocusIn);
      document.removeEventListener('focusout', handleFocusOut);
    };
  }, []);

  const isBeaconPage = Boolean(pathname && pathname.startsWith('/logistics/track'));

  // 4. 10-second countdown and auto-reload loop
  useEffect(() => {
    if (!isEnabled || isAuthPage || isTyping || isBeaconPage) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          // Trigger automatic page reload every 10 seconds
          if (typeof window !== 'undefined') {
            window.location.reload();
          }
          return AUTO_RELOAD_INTERVAL;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isEnabled, isAuthPage, isTyping, isBeaconPage]);

  // Reset timer on manual toggle
  const toggleEnabled = () => {
    const next = !isEnabled;
    setIsEnabled(next);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, String(next));
    }
    if (next) {
      setSecondsLeft(AUTO_RELOAD_INTERVAL);
    }
  };

  const triggerManualReload = () => {
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  // Status computation
  let statusText = `Reloading in ${secondsLeft}s`;
  let statusColor = 'bg-emerald-500 text-white';
  let isPaused = false;

  if (!isEnabled) {
    statusText = 'Auto-Reload: OFF';
    statusColor = 'bg-slate-400 dark:bg-slate-600 text-white';
    isPaused = true;
  } else if (isAuthPage) {
    statusText = 'Paused (Auth Page)';
    statusColor = 'bg-amber-500 text-white';
    isPaused = true;
  } else if (isTyping) {
    statusText = 'Paused (Typing...)';
    statusColor = 'bg-blue-500 text-white';
    isPaused = true;
  } else if (isBeaconPage) {
    statusText = 'GPS Tracking Page';
    statusColor = 'bg-indigo-600 text-white';
    isPaused = true;
  }

  // Render minimized floating badge
  if (isMinimized) {
    return (
      <div className="fixed bottom-20 sm:bottom-6 left-4 z-50">
        <button
          onClick={() => setIsMinimized(false)}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full shadow-lg text-xs font-semibold backdrop-blur-md border border-white/20 transition-all transform hover:scale-105 ${statusColor}`}
          title="Click to expand auto-reload controller"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${!isPaused ? 'animate-spin' : ''}`} />
          <span>{isEnabled && !isPaused ? `${secondsLeft}s` : 'Paused'}</span>
          <ChevronUp className="w-3.5 h-3.5 opacity-80" />
        </button>
      </div>
    );
  }

  // Render full floating controller
  return (
    <div className="fixed bottom-20 sm:bottom-6 left-4 z-50 select-none animate-in fade-in duration-200">
      <div className="flex items-center gap-2 bg-slate-900/95 dark:bg-slate-800/95 backdrop-blur-md text-white px-3.5 py-2 rounded-xl shadow-2xl border border-slate-700/60 text-xs">
        {/* Animated Status Icon */}
        <div className="flex items-center gap-1.5 font-medium">
          <RefreshCw
            className={`w-3.5 h-3.5 text-emerald-400 ${
              isEnabled && !isPaused ? 'animate-spin' : ''
            }`}
            style={{ animationDuration: '3s' }}
          />
          <span className="font-semibold text-slate-200 hidden sm:inline">
            Auto-Reload:
          </span>
        </div>

        {/* Countdown Badge */}
        <div
          className={`px-2 py-0.5 rounded-md font-mono text-[11px] font-bold transition-colors ${
            !isPaused
              ? secondsLeft <= 3
                ? 'bg-amber-500 text-slate-950 animate-pulse'
                : 'bg-emerald-600/90 text-white'
              : 'bg-slate-700 text-slate-300'
          }`}
        >
          {isEnabled && !isPaused ? `${secondsLeft}s` : statusText}
        </div>

        {/* Pause / Resume Button */}
        <button
          onClick={toggleEnabled}
          className={`p-1 rounded-md hover:bg-slate-700/80 transition-colors text-slate-300 hover:text-white`}
          title={isEnabled ? 'Pause auto-reload' : 'Enable auto-reload (every 10s)'}
          aria-label={isEnabled ? 'Pause auto-reload' : 'Enable auto-reload'}
        >
          {isEnabled ? (
            <Pause className="w-3.5 h-3.5 text-amber-400" />
          ) : (
            <Play className="w-3.5 h-3.5 text-emerald-400" />
          )}
        </button>

        {/* Reload Now Action */}
        <button
          onClick={triggerManualReload}
          className="px-2 py-1 bg-slate-700/80 hover:bg-slate-600 rounded-md font-medium text-[11px] text-slate-200 hover:text-white transition-colors"
          title="Reload page immediately"
        >
          Reload Now
        </button>

        {/* Minimize Button */}
        <button
          onClick={() => setIsMinimized(true)}
          className="p-1 rounded-md hover:bg-slate-700/80 text-slate-400 hover:text-slate-200 transition-colors ml-0.5"
          title="Minimize auto-reload badge"
        >
          <ChevronDown className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
