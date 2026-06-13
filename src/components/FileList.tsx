import React from 'react';
import { File as FileIcon, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { FileMeta } from '@/store/transferSlice';

interface FileListProps {
    files: FileMeta[];
}

export const FileList: React.FC<FileListProps> = ({ files }) => {
    if (files.length === 0) return null;

    const formatSize = (bytes: number) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    return (
        <div className="w-full max-w-xl space-y-3">
            {files.map((file) => (
                <Card key={file.id} className="p-4 flex items-center gap-4">
                    <div className="p-2 rounded-lg bg-muted">
                        <FileIcon className="w-6 h-6 text-muted-foreground" />
                    </div>

                    <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                            <p className="font-medium truncate">{file.name}</p>
                            <span className="text-xs text-muted-foreground">
                                {formatSize(file.size)}
                            </span>
                        </div>

                        <div className="flex items-center gap-3">
                            <Progress value={file.progress} className="h-2" />
                            <span className="text-xs w-8 text-right">{file.progress}%</span>
                        </div>
                    </div>

                    <div className="text-muted-foreground">
                        {file.progress === 100 ? (
                            <CheckCircle className="w-5 h-5 text-green-500" />
                        ) : file.progress > 0 ? (
                            <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
                        ) : (
                            <div className="w-5 h-5" />
                        )}
                    </div>
                </Card>
            ))}
        </div>
    );
};
