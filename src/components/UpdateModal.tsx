'use client'

import React, { useEffect, useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Pizza, MessageSquare, Paperclip, Users, Clock } from 'lucide-react'

// Version for local storage compatibility check
const UPDATE_VERSION = 'v1.9.1-features'

export function UpdateModal() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    // Check if user has already seen this update
    const hasSeenUpdate = localStorage.getItem(UPDATE_VERSION)
    if (!hasSeenUpdate) {
      // Delay slightly to allow main hydration
      const timer = setTimeout(() => setOpen(true), 1500)
      return () => clearTimeout(timer)
    }
  }, [])

  const handleClose = () => {
    localStorage.setItem(UPDATE_VERSION, 'true')
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="bg-zinc-950/90 border-white/10 text-white backdrop-blur-xl max-w-md">
        <DialogHeader>
          <div className="mx-auto mb-4 p-3 bg-gradient-to-br from-orange-500/20 to-red-500/20 rounded-full border border-orange-500/20">
             <Pizza className="w-8 h-8 text-orange-500" />
          </div>
          <DialogTitle className="text-2xl text-center font-bold bg-gradient-to-r from-white via-white to-zinc-400 bg-clip-text text-transparent">
            What&apos;s New in v1.9
          </DialogTitle>
          <p className="text-center text-zinc-400 text-sm mt-2">
            Unified chat + file sharing experience
          </p>
        </DialogHeader>

        <div className="space-y-3 py-4">
          <FeatureItem 
            icon={<MessageSquare className="w-4 h-4 text-green-400" />}
            title="Live Room Chat"
            description="Real-time messaging with typing indicators"
          />
          <FeatureItem 
            icon={<Paperclip className="w-4 h-4 text-orange-400" />}
            title="Share Files in Chat"
            description="Quick (500MB) & Relay (6GB) sharing in chat feed"
          />
          <FeatureItem 
            icon={<Users className="w-4 h-4 text-blue-400" />}
            title="User Presence"
            description="See who's online & join/leave notifications"
          />
          <FeatureItem 
            icon={<Clock className="w-4 h-4 text-violet-400" />}
            title="Auto Cleanup"
            description="Temporary rooms & files expire in 24 hours"
          />
        </div>

        <DialogFooter className="sm:justify-center">
          <Button 
            onClick={handleClose}
            className="w-full bg-white text-black hover:bg-zinc-200 font-semibold"
          >
            Let&apos;s Go! 🍕
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function FeatureItem({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="flex gap-3 p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
      <div className="mt-0.5 shrink-0">
        <div className="p-2 rounded-lg bg-zinc-900 border border-white/10">
          {icon}
        </div>
      </div>
      <div>
        <h4 className="text-sm font-semibold text-zinc-100">{title}</h4>
        <p className="text-xs text-zinc-400 leading-relaxed">{description}</p>
      </div>
    </div>
  )
}
