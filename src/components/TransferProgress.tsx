import React from 'react';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ArrowUp, ArrowDown, Timer } from 'lucide-react';

interface TransferProgressProps {
    totalProgress: number;
    speed: number; // MB/s
    eta: number; // seconds
    isSender: boolean;
    status: string;
}

export const TransferProgress: React.FC<TransferProgressProps> = ({
    totalProgress,
    speed,
    eta,
    isSender,
    status
}) => {
    if (status === 'idle' || status === 'completed') return null;

    const formatTime = (seconds: number) => {
        if (!isFinite(seconds) || seconds < 0) return '--:--';
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <Card className="w-full max-w-xl p-6 space-y-4 bg-muted/30">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    {isSender ? (
                        <ArrowUp className="w-4 h-4 text-blue-500" />
                    ) : (
                        <ArrowDown className="w-4 h-4 text-green-500" />
                    )}
                    <span className="font-medium">
                        {isSender ? 'Sending...' : 'Receiving...'}
                    </span>
                </div>
                <span className="text-sm font-mono">{totalProgress}%</span>
            </div>

            <Progress value={totalProgress} className="h-3" />

            <div className="flex items-center justify-between text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                    <span>{speed} MB/s</span>
                </div>
                <div className="flex items-center gap-2">
                    <Timer className="w-4 h-4" />
                    <span>ETA: {formatTime(eta)}</span>
                </div>
            </div>
        </Card>
    );
};
