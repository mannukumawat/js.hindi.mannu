'use client';

import { Provider } from 'react-redux';
import { store } from '@/store/store';
import { Toaster } from 'sonner';
import { PWAProvider, PWAInstallPrompt, PWAUpdatePrompt, NetworkStatus } from '@/components/pwa';

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <Provider store={store}>
            <PWAProvider>
                {children}
                <Toaster position="top-center" richColors />
                <PWAInstallPrompt />
                <PWAUpdatePrompt />
                <NetworkStatus />
            </PWAProvider>
        </Provider>
    );
}
