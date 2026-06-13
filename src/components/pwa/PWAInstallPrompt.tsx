'use client';

import React from 'react';
import { usePWA } from './PWAProvider';
import { Download, X, Smartphone, Zap, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function PWAInstallPrompt() {
  const { isInstallable, showInstallPrompt, promptInstall, dismissInstall } = usePWA();

  if (!isInstallable || !showInstallPrompt) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-md animate-in slide-in-from-bottom-5 duration-500">
      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-zinc-900/95 via-zinc-900/95 to-zinc-800/95 backdrop-blur-xl shadow-2xl">
        {/* Decorative gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 via-transparent to-violet-500/10 pointer-events-none" />
        
        {/* Close button */}
        <button
          onClick={dismissInstall}
          className="absolute top-3 right-3 p-1.5 rounded-full bg-white/5 hover:bg-white/10 transition-colors"
          aria-label="Dismiss"
        >
          <X className="w-4 h-4 text-zinc-400" />
        </button>

        <div className="relative p-4">
          {/* Header */}
          <div className="flex items-start gap-3 mb-4">
            <div className="shrink-0 p-2.5 rounded-xl bg-gradient-to-br from-orange-500/20 to-orange-600/20 border border-orange-500/20">
              <Download className="w-5 h-5 text-orange-400" />
            </div>
            <div>
              <h3 className="font-semibold text-white text-base">Install PeerPizza</h3>
              <p className="text-sm text-zinc-400 mt-0.5">Get the full app experience</p>
            </div>
          </div>

          {/* Features */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            <div className="flex flex-col items-center gap-1.5 p-2 rounded-lg bg-white/5">
              <Smartphone className="w-4 h-4 text-blue-400" />
              <span className="text-[10px] text-zinc-400 text-center">Works Offline</span>
            </div>
            <div className="flex flex-col items-center gap-1.5 p-2 rounded-lg bg-white/5">
              <Zap className="w-4 h-4 text-yellow-400" />
              <span className="text-[10px] text-zinc-400 text-center">Faster Launch</span>
            </div>
            <div className="flex flex-col items-center gap-1.5 p-2 rounded-lg bg-white/5">
              <Shield className="w-4 h-4 text-green-400" />
              <span className="text-[10px] text-zinc-400 text-center">Native Feel</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={dismissInstall}
              className="flex-1 text-zinc-400 hover:text-white hover:bg-white/5"
            >
              Not now
            </Button>
            <Button
              size="sm"
              onClick={promptInstall}
              className="flex-1 bg-white text-black hover:bg-zinc-200 font-medium"
            >
              <Download className="w-4 h-4 mr-1.5" />
              Install
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
