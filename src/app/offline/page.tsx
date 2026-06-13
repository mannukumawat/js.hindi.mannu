'use client';

import { WifiOff, RefreshCw, Home, Pizza } from 'lucide-react';
import Link from 'next/link';


export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        {/* Animated icon */}
        <div className="relative mx-auto w-24 h-24 mb-8">
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-orange-500/20 to-red-500/20 animate-pulse" />
          <div className="absolute inset-2 rounded-full bg-zinc-900 flex items-center justify-center">
            <WifiOff className="w-10 h-10 text-orange-400" />
          </div>
        </div>

        {/* Title */}
        <h1 className="text-3xl font-bold text-white mb-3">
          You&apos;re Offline
        </h1>
        
        <p className="text-zinc-400 mb-8 leading-relaxed">
          It looks like you&apos;ve lost your internet connection. 
          Don&apos;t worry - some features may still work!
        </p>

        {/* Status card */}
        <div className="bg-zinc-900/50 border border-white/10 rounded-2xl p-6 mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-orange-500/20">
              <Pizza className="w-5 h-5 text-orange-400" />
            </div>
            <h2 className="font-semibold text-white">What you can do:</h2>
          </div>
          
          <ul className="text-left space-y-3">
            <li className="flex items-start gap-3 text-sm">
              <span className="shrink-0 w-5 h-5 rounded-full bg-green-500/20 text-green-400 flex items-center justify-center text-xs">✓</span>
              <span className="text-zinc-300">View previously loaded rooms</span>
            </li>
            <li className="flex items-start gap-3 text-sm">
              <span className="shrink-0 w-5 h-5 rounded-full bg-green-500/20 text-green-400 flex items-center justify-center text-xs">✓</span>
              <span className="text-zinc-300">Access downloaded content</span>
            </li>
            <li className="flex items-start gap-3 text-sm">
              <span className="shrink-0 w-5 h-5 rounded-full bg-yellow-500/20 text-yellow-400 flex items-center justify-center text-xs">!</span>
              <span className="text-zinc-300">File transfers will resume when online</span>
            </li>
          </ul>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => window.location.reload()}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-white text-black font-medium hover:bg-zinc-200 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </button>
          
          <Link
            href="/"
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-zinc-800 text-white font-medium hover:bg-zinc-700 transition-colors border border-white/10"
          >
            <Home className="w-4 h-4" />
            Go Home
          </Link>
        </div>

        {/* Decorative elements */}
        <div className="mt-12 pt-8 border-t border-white/5">
          <p className="text-xs text-zinc-600">
            Tip: Install PeerPizza as an app for better offline support
          </p>
        </div>
      </div>

      {/* Background decorations */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-32 w-64 h-64 rounded-full bg-orange-500/5 blur-3xl" />
        <div className="absolute bottom-1/4 -right-32 w-64 h-64 rounded-full bg-violet-500/5 blur-3xl" />
      </div>
    </div>
  );
}
