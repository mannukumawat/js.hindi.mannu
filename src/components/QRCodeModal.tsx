import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { QrCode, Copy, Check, ScanLine } from 'lucide-react';
import { toast } from 'sonner';

interface QRCodeModalProps {
    link: string;
}

export const QRCodeModal: React.FC<QRCodeModalProps> = ({ link }) => {
    const [copied, setCopied] = React.useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(link);
        setCopied(true);
        toast.success('Link copied to clipboard');
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="outline" className="gap-2 border-white/10 bg-white/5 hover:bg-white/10 hover:text-white transition-colors">
                    <QrCode className="w-4 h-4" />
                    Show QR Code
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md bg-zinc-950 border-white/10 text-white">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl">
                        <ScanLine className="w-5 h-5 text-orange-500" />
                        Scan to Connect
                    </DialogTitle>
                </DialogHeader>
                <div className="flex flex-col items-center justify-center p-6 space-y-8">
                    <div className="relative group">
                        <div className="absolute -inset-1 bg-gradient-to-r from-orange-500 to-violet-500 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
                        <div className="relative p-4 bg-white rounded-xl">
                            <QRCodeSVG value={link} size={200} />
                        </div>
                    </div>

                    <div className="flex items-center gap-2 w-full">
                        <div className="flex-1 relative">
                            <input
                                type="text"
                                value={link}
                                readOnly
                                className="w-full bg-zinc-900 border border-white/10 rounded-lg py-2.5 pl-3 pr-10 text-sm text-zinc-400 focus:outline-none focus:border-orange-500/50 transition-colors"
                            />
                            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                <span className="text-xs text-zinc-600">URL</span>
                            </div>
                        </div>
                        <Button
                            size="icon"
                            className="bg-white/10 hover:bg-white/20 text-white border-0"
                            onClick={handleCopy}
                        >
                            {copied ? (
                                <Check className="w-4 h-4 text-green-500" />
                            ) : (
                                <Copy className="w-4 h-4" />
                            )}
                        </Button>
                    </div>

                    <p className="text-xs text-zinc-500 text-center">
                        Scan with your phone camera or QR code reader app
                    </p>
                </div>
            </DialogContent>
        </Dialog>
    );
};
