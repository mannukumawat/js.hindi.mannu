'use client';

import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import { setTransferMode, TransferMode } from '@/store/transferSlice';
import { Link as LinkIcon, Users, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export function ModeSelector() {
    const dispatch = useDispatch();
    const { transferMode, transferStatus } = useSelector((state: RootState) => state.transfer);

    const isDisabled = transferStatus !== 'idle';

    const handleModeChange = (mode: TransferMode) => {
        if (!isDisabled) {
            dispatch(setTransferMode(mode));
        }
    };

    return (
        <div className="w-full max-w-md mx-auto">
            <div className="flex gap-2 p-1 bg-zinc-900/50 border border-white/5 rounded-xl">
                {/* Relay Mode Button (formerly Cloud) */}
                <button
                    onClick={() => handleModeChange('cloud')}
                    disabled={isDisabled}
                    className={cn(
                        "flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg transition-all duration-300",
                        isDisabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer",
                        transferMode === 'cloud'
                            ? "bg-blue-600 text-white shadow-lg shadow-blue-900/20"
                            : "text-zinc-400 hover:text-white hover:bg-white/5"
                    )}
                >
                    <LinkIcon className="w-4 h-4" />
                    <div className="flex flex-col items-start">
                        <span className="font-medium text-sm leading-none">Relay</span>
                        <span className="text-[10px] opacity-70 leading-none mt-1">24h Link</span>
                    </div>
                    {transferMode === 'cloud' && <CheckCircle2 className="w-3.5 h-3.5 ml-auto text-blue-200" />}
                </button>

                {/* P2P Mode Button */}
                <button
                    onClick={() => handleModeChange('p2p')}
                    disabled={isDisabled}
                    className={cn(
                        "flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg transition-all duration-300",
                        isDisabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer",
                        transferMode === 'p2p'
                            ? "bg-green-600 text-white shadow-lg shadow-green-900/20"
                            : "text-zinc-400 hover:text-white hover:bg-white/5"
                    )}
                >
                    <Users className="w-4 h-4" />
                    <div className="flex flex-col items-start">
                        <span className="font-medium text-sm leading-none">P2P</span>
                        <span className="text-[10px] opacity-70 leading-none mt-1">Direct Transfer</span>
                    </div>
                    {transferMode === 'p2p' && <CheckCircle2 className="w-3.5 h-3.5 ml-auto text-green-200" />}
                </button>
            </div>
        </div>
    );
}
