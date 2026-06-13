'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Message } from '@/lib/appwrite'
import { Button } from '@/components/ui/button'
import { Send } from 'lucide-react'

interface ChatPanelProps {
  messages: Message[]
  onSendMessage: (content: string) => void
  loading?: boolean
  currentUserId?: string
  guestName?: string
}

export function ChatPanel({
  messages,
  onSendMessage,
  loading,
  currentUserId,
  guestName = 'Guest',
}: ChatPanelProps) {
  const [input, setInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (input.trim()) {
      onSendMessage(input.trim())
      setInput('')
    }
  }

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="flex flex-col h-full border border-white/10 rounded-2xl bg-zinc-900/50 backdrop-blur-sm overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-white/10 bg-white/5">
        <h3 className="font-semibold text-white flex items-center gap-2">
          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
          Room Chat
        </h3>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-zinc-500 text-sm">
            No messages yet. Start the conversation!
          </div>
        ) : (
          messages.map((message) => {
            const isOwn = currentUserId && message.user_id === currentUserId
            const displayName = message.user_id ? 'User' : message.guest_name || 'Guest'

            return (
              <div
                key={message.id}
                className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs text-zinc-500">{displayName}</span>
                  <span className="text-xs text-zinc-600">{formatTime(message.created_at)}</span>
                </div>
                <div
                  className={`max-w-[80%] px-3 py-2 rounded-xl text-sm ${
                    isOwn
                      ? 'bg-orange-600 text-white rounded-br-sm'
                      : 'bg-white/10 text-zinc-200 rounded-bl-sm'
                  }`}
                >
                  {message.content}
                </div>
              </div>
            )
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-3 border-t border-white/10 bg-white/5">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 px-4 py-2 bg-black/50 border border-white/10 rounded-xl text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-orange-500/50"
            disabled={loading}
          />
          <Button
            type="submit"
            size="icon"
            disabled={!input.trim() || loading}
            className="bg-orange-600 hover:bg-orange-500 text-white rounded-xl"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </form>
    </div>
  )
}
