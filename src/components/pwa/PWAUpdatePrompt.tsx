'use client';

import React, { useEffect } from 'react';
import { usePWA } from './PWAProvider';
import { RefreshCw, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

export function PWAUpdatePrompt() {
  const { hasUpdate, updateApp } = usePWA();

  useEffect(() => {
    if (hasUpdate) {
      toast(
        <div className="flex items-center gap-3">
          <div className="shrink-0 p-2 rounded-lg bg-gradient-to-br from-violet-500/20 to-blue-500/20 border border-violet-500/20">
            <Sparkles className="w-4 h-4 text-violet-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm text-zinc-100">Update Available!</p>
            <p className="text-xs text-zinc-400 mt-0.5">New version of PeerPizza is ready</p>
          </div>
          <button
            onClick={() => {
              updateApp();
              toast.dismiss();
            }}
            className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white text-black text-sm font-medium hover:bg-zinc-200 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Update
          </button>
        </div>,
        {
          duration: Infinity,
          id: 'pwa-update',
          className: 'bg-zinc-900 border-white/10',
        }
      );
    }
  }, [hasUpdate, updateApp]);

  return null;
}
