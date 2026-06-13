import React from 'react';
import { cn } from '@/lib/utils';
import { Wifi, WifiOff, Loader2, Clock } from 'lucide-react';

interface ConnectionStatusProps {
    status: 'disconnected' | 'connecting' | 'connected' | 'failed';
    roomId?: string | null;
}

export const ConnectionStatus: React.FC<ConnectionStatusProps> = ({ status, roomId }) => {
    // Agar roomId hai aur disconnected hai, matlab waiting for peer
    const isWaiting = roomId && status === 'disconnected';

    const getStatusText = () => {
        if (isWaiting) return 'Waiting for peer...';
        if (status === 'connected') return 'Connected';
        if (status === 'connecting') return 'Connecting...';
        if (status === 'failed') return 'Connection Failed';
        return 'Ready';
    };

    return (
        <div className={cn(
            "flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium transition-colors",
            status === 'connected' && "bg-green-500/10 text-green-500",
            status === 'connecting' && "bg-yellow-500/10 text-yellow-500",
            isWaiting && "bg-blue-500/10 text-blue-500",
            status === 'disconnected' && !roomId && "bg-gray-500/10 text-gray-500",
            status === 'failed' && "bg-red-500/10 text-red-500"
        )}>
            {status === 'connected' && <Wifi className="w-4 h-4" />}
            {status === 'connecting' && <Loader2 className="w-4 h-4 animate-spin" />}
            {isWaiting && <Clock className="w-4 h-4 animate-pulse" />}
            {status === 'disconnected' && !roomId && <WifiOff className="w-4 h-4" />}
            {status === 'failed' && <WifiOff className="w-4 h-4" />}

            <span>{getStatusText()}</span>
        </div>
    );
};
