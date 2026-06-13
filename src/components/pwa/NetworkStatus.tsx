'use client';

import React, { useEffect } from 'react';
import { usePWA } from './PWAProvider';
import { Wifi, WifiOff } from 'lucide-react';
import { toast } from 'sonner';

export function NetworkStatus() {
  const { isOnline, wasOffline } = usePWA();

  useEffect(() => {
    if (!isOnline) {
      toast(
        <div className="flex items-center gap-3">
          <div className="shrink-0 p-2 rounded-lg bg-red-500/20 border border-red-500/20">
            <WifiOff className="w-4 h-4 text-red-400" />
          </div>
          <div className="flex-1">
            <p className="font-medium text-sm text-zinc-100">You&apos;re offline</p>
            <p className="text-xs text-zinc-400 mt-0.5">Some features may be unavailable</p>
          </div>
        </div>,
        {
          duration: Infinity,
          id: 'network-status',
          className: 'bg-zinc-900 border-red-500/20',
        }
      );
    } else if (wasOffline) {
      toast.dismiss('network-status');
      toast(
        <div className="flex items-center gap-3">
          <div className="shrink-0 p-2 rounded-lg bg-green-500/20 border border-green-500/20">
            <Wifi className="w-4 h-4 text-green-400" />
          </div>
          <div className="flex-1">
            <p className="font-medium text-sm text-zinc-100">Back online!</p>
            <p className="text-xs text-zinc-400 mt-0.5">All features are now available</p>
          </div>
        </div>,
        {
          duration: 3000,
          id: 'network-online',
          className: 'bg-zinc-900 border-green-500/20',
        }
      );
    }
  }, [isOnline, wasOffline]);

  return null;
}
