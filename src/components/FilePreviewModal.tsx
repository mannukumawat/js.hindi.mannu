'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { X, Download, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, RotateCw } from 'lucide-react'
import { RoomFile } from '@/lib/appwrite'

interface FilePreviewModalProps {
  file: RoomFile | null
  files: RoomFile[]
  isOpen: boolean
  onClose: () => void
  onDownload: (file: RoomFile) => void
  getSignedUrl: (storagePath: string) => Promise<string | null>
}

const IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'ico']
const VIDEO_EXTENSIONS = ['mp4', 'webm', 'ogg', 'mov']
const AUDIO_EXTENSIONS = ['mp3', 'wav', 'ogg', 'aac', 'm4a']

function getFileExtension(fileName: string): string {
  return fileName.split('.').pop()?.toLowerCase() || ''
}

function isImageFile(fileName: string): boolean {
  return IMAGE_EXTENSIONS.includes(getFileExtension(fileName))
}

function isVideoFile(fileName: string): boolean {
  return VIDEO_EXTENSIONS.includes(getFileExtension(fileName))
}

function isAudioFile(fileName: string): boolean {
  return AUDIO_EXTENSIONS.includes(getFileExtension(fileName))
}

export function FilePreviewModal({
  file,
  files,
  isOpen,
  onClose,
  onDownload,
  getSignedUrl,
}: FilePreviewModalProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [zoom, setZoom] = useState(1)
  const [rotation, setRotation] = useState(0)
  const [currentIndex, setCurrentIndex] = useState(0)

  // Get previewable files only
  const previewableFiles = files.filter(
    f => isImageFile(f.file_name) || isVideoFile(f.file_name) || isAudioFile(f.file_name)
  )

  // Update current index when file changes
  useEffect(() => {
    if (file) {
      const idx = previewableFiles.findIndex(f => f.id === file.id)
      if (idx !== -1) setCurrentIndex(idx)
    }
  }, [file, previewableFiles])

  // Load preview URL
  useEffect(() => {
    const loadPreview = async () => {
      if (!file || !isOpen) {
        setPreviewUrl(null)
        return
      }

      // Check if it's a relay file
      if (file.storage_path.startsWith('relay:')) {
        // For relay files, we'd need to fetch from the API
        // For now, just show download option
        setPreviewUrl(null)
        return
      }

      setLoading(true)
      try {
        const url = await getSignedUrl(file.storage_path)
        setPreviewUrl(url)
      } catch (err) {
        console.error('Failed to load preview:', err)
        setPreviewUrl(null)
      }
      setLoading(false)
    }

    loadPreview()
    // Reset zoom and rotation when file changes
    setZoom(1)
    setRotation(0)
  }, [file, isOpen, getSignedUrl])

  // Navigation callbacks - defined before useEffect that uses them
  const goToPrevious = useCallback(() => {
    if (previewableFiles.length > 1) {
      setCurrentIndex(prev => prev > 0 ? prev - 1 : previewableFiles.length - 1)
    }
  }, [previewableFiles.length])

  const goToNext = useCallback(() => {
    if (previewableFiles.length > 1) {
      setCurrentIndex(prev => prev < previewableFiles.length - 1 ? prev + 1 : 0)
    }
  }, [previewableFiles.length])

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      } else if (e.key === 'ArrowLeft') {
        goToPrevious()
      } else if (e.key === 'ArrowRight') {
        goToNext()
      } else if (e.key === '+' || e.key === '=') {
        setZoom(z => Math.min(z + 0.25, 3))
      } else if (e.key === '-') {
        setZoom(z => Math.max(z - 0.25, 0.5))
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, goToPrevious, goToNext, onClose])

  const currentFile = previewableFiles[currentIndex] || file

  if (!currentFile) return null

  const isImage = isImageFile(currentFile.file_name)
  const isVideo = isVideoFile(currentFile.file_name)
  const isAudio = isAudioFile(currentFile.file_name)

  return (
    <Dialog open={isOpen} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-4xl w-[95vw] max-h-[90vh] p-0 bg-black/95 border-white/10 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-zinc-900/50">
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-medium text-white truncate">{currentFile.file_name}</h3>
            <p className="text-xs text-zinc-500">
              {(currentFile.file_size / 1024 / 1024).toFixed(2)} MB
              {previewableFiles.length > 1 && ` • ${currentIndex + 1} of ${previewableFiles.length}`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {isImage && (
              <>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => setZoom(z => Math.max(z - 0.25, 0.5))}
                  className="w-8 h-8 text-zinc-400 hover:text-white"
                >
                  <ZoomOut className="w-4 h-4" />
                </Button>
                <span className="text-xs text-zinc-500 w-12 text-center">{Math.round(zoom * 100)}%</span>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => setZoom(z => Math.min(z + 0.25, 3))}
                  className="w-8 h-8 text-zinc-400 hover:text-white"
                >
                  <ZoomIn className="w-4 h-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => setRotation(r => (r + 90) % 360)}
                  className="w-8 h-8 text-zinc-400 hover:text-white"
                >
                  <RotateCw className="w-4 h-4" />
                </Button>
              </>
            )}
            <Button
              size="icon"
              variant="ghost"
              onClick={() => onDownload(currentFile)}
              className="w-8 h-8 text-zinc-400 hover:text-white"
            >
              <Download className="w-4 h-4" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              onClick={onClose}
              className="w-8 h-8 text-zinc-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="relative flex items-center justify-center min-h-[400px] max-h-[70vh] overflow-auto p-4">
          {loading ? (
            <div className="flex flex-col items-center gap-2">
              <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-sm text-zinc-500">Loading preview...</span>
            </div>
          ) : previewUrl ? (
            <>
              {isImage && (
                <img
                  src={previewUrl}
                  alt={currentFile.file_name}
                  className="max-w-full max-h-full object-contain transition-transform duration-200"
                  style={{
                    transform: `scale(${zoom}) rotate(${rotation}deg)`,
                  }}
                  onError={() => setPreviewUrl(null)}
                />
              )}
              {isVideo && (
                <video
                  src={previewUrl}
                  controls
                  autoPlay
                  className="max-w-full max-h-full"
                >
                  Your browser does not support video playback.
                </video>
              )}
              {isAudio && (
                <div className="flex flex-col items-center gap-4 p-8">
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-orange-500/20 to-violet-500/20 flex items-center justify-center">
                    <span className="text-4xl">🎵</span>
                  </div>
                  <audio src={previewUrl} controls autoPlay className="w-full max-w-md">
                    Your browser does not support audio playback.
                  </audio>
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center gap-4 text-center p-8">
              <div className="w-16 h-16 rounded-2xl bg-zinc-800 flex items-center justify-center">
                <span className="text-3xl">📄</span>
              </div>
              <div>
                <p className="text-zinc-300 font-medium">Preview Not Available</p>
                <p className="text-sm text-zinc-500 mt-1">Download the file to view it</p>
              </div>
              <Button
                onClick={() => onDownload(currentFile)}
                className="bg-orange-600 hover:bg-orange-500"
              >
                <Download className="w-4 h-4 mr-2" />
                Download File
              </Button>
            </div>
          )}

          {/* Navigation Arrows */}
          {previewableFiles.length > 1 && (
            <>
              <button
                onClick={goToPrevious}
                className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 hover:bg-black/80 flex items-center justify-center text-white transition-colors"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button
                onClick={goToNext}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 hover:bg-black/80 flex items-center justify-center text-white transition-colors"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </>
          )}
        </div>

        {/* Thumbnails Strip (if multiple previewable files) */}
        {previewableFiles.length > 1 && (
          <div className="flex gap-2 p-3 border-t border-white/10 bg-zinc-900/50 overflow-x-auto">
            {previewableFiles.map((f, idx) => (
              <button
                key={f.id}
                onClick={() => setCurrentIndex(idx)}
                className={`shrink-0 w-12 h-12 rounded-lg overflow-hidden border-2 transition-all ${
                  idx === currentIndex
                    ? 'border-orange-500 scale-110'
                    : 'border-transparent opacity-60 hover:opacity-100'
                }`}
              >
                {isImageFile(f.file_name) ? (
                  <div className="w-full h-full bg-zinc-800 flex items-center justify-center text-xl">🖼️</div>
                ) : isVideoFile(f.file_name) ? (
                  <div className="w-full h-full bg-zinc-800 flex items-center justify-center text-xl">🎬</div>
                ) : (
                  <div className="w-full h-full bg-zinc-800 flex items-center justify-center text-xl">🎵</div>
                )}
              </button>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

// Export helper for use in ChatRoom
export { isImageFile, isVideoFile, isAudioFile }
