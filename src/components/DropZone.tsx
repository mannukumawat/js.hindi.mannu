import React, { useCallback, useState } from 'react';
import { Upload, File as FileIcon, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface DropZoneProps {
    onFilesSelected: (files: File[]) => void;
}

export const DropZone: React.FC<DropZoneProps> = ({ onFilesSelected }) => {
    const [isDragging, setIsDragging] = useState(false);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    }, []);

    const handleDrop = useCallback(
        (e: React.DragEvent) => {
            e.preventDefault();
            setIsDragging(false);

            if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                onFilesSelected(Array.from(e.dataTransfer.files));
            }
        },
        [onFilesSelected]
    );

    const handleFileInput = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            if (e.target.files && e.target.files.length > 0) {
                onFilesSelected(Array.from(e.target.files));
            }
        },
        [onFilesSelected]
    );

    return (
        <Card
            className={cn(
                'relative flex flex-col items-center justify-center w-full max-w-xl p-12 border-2 border-dashed rounded-3xl transition-all duration-500 cursor-pointer overflow-hidden group',
                isDragging
                    ? 'border-orange-500 bg-orange-500/10 scale-[1.02] shadow-[0_0_40px_-10px_rgba(234,88,12,0.5)]'
                    : 'border-white/10 bg-zinc-900/50 hover:border-orange-500/50 hover:bg-zinc-900/80 hover:scale-[1.01]'
            )}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => document.getElementById('file-input')?.click()}
        >
            <input
                id="file-input"
                type="file"
                multiple
                className="hidden"
                onChange={handleFileInput}
            />

            {/* Animated background gradient blob */}
            <div className={cn(
                "absolute inset-0 bg-gradient-to-tr from-orange-500/20 via-transparent to-violet-500/20 opacity-0 transition-opacity duration-500",
                isDragging ? "opacity-100" : "group-hover:opacity-50"
            )} />

            <div className="relative z-10 flex flex-col items-center gap-6 text-center">
                <div className={cn(
                    "p-6 rounded-2xl transition-all duration-500",
                    isDragging
                        ? "bg-orange-500 text-white scale-110 rotate-3 shadow-lg"
                        : "bg-white/5 text-zinc-400 group-hover:bg-white/10 group-hover:text-white group-hover:scale-110"
                )}>
                    {isDragging ? (
                        <Zap className="w-10 h-10 animate-pulse" />
                    ) : (
                        <Upload className="w-10 h-10" />
                    )}
                </div>

                <div className="space-y-2">
                    <h3 className={cn(
                        "text-2xl font-bold tracking-tight transition-colors duration-300",
                        isDragging ? "text-orange-500" : "text-white"
                    )}>
                        {isDragging ? "Drop files to blast off!" : "Drop files here"}
                    </h3>
                    <p className="text-zinc-400 max-w-xs mx-auto">
                        Support for multiple files and folders.
                        <br />
                        <span className="text-xs opacity-50">Fast & secure transfers</span>
                    </p>
                </div>

                <Button
                    size="lg"
                    className={cn(
                        "mt-2 rounded-full font-medium transition-all duration-300",
                        isDragging
                            ? "bg-orange-500 text-white hover:bg-orange-600"
                            : "bg-white text-black hover:bg-zinc-200"
                    )}
                >
                    Select Files
                </Button>
            </div>
        </Card>
    );
};
