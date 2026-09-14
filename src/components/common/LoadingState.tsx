import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingStateProps {
  message?: string;
}

export function LoadingState({ message = 'Loading fresh produce data.' }: LoadingStateProps) {
  return (
    <div className="py-16 text-center space-y-3 flex flex-col items-center justify-center">
      <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
      <p className="text-sm font-semibold text-slate-400">{message}</p>
    </div>
  );
}
