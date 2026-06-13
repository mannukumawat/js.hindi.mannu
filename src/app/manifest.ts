import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: 'PeerPizza - Secure P2P & Relay File Sharing',
        short_name: 'PeerPizza',
        description: 'Share files directly with peers (P2P) or use our secure Relay for 24h temporary links.',
        start_url: '/',
        display: 'standalone',
        background_color: '#000000',
        theme_color: '#000000',
        orientation: 'any',
        scope: '/',
        categories: ['productivity', 'utilities', 'social'],
        icons: [
            {
                src: '/icon',
                sizes: '32x32',
                type: 'image/png',
            },
            {
                src: '/icons/icon-192x192',
                sizes: '192x192',
                type: 'image/png',
            },
            {
                src: '/icons/icon-512x512',
                sizes: '512x512',
                type: 'image/png',
            },
            {
                src: '/icons/icon-512x512',
                sizes: '512x512',
                type: 'image/png',
                purpose: 'maskable',
            },
        ],
        shortcuts: [
            {
                name: 'Create Room',
                short_name: 'Create',
                description: 'Create a new file sharing room',
                url: '/?action=create',
                icons: [{ src: '/icon2', sizes: '192x192' }],
            },
            {
                name: 'Join Room',
                short_name: 'Join',
                description: 'Join an existing room',
                url: '/?action=join',
                icons: [{ src: '/icon2', sizes: '192x192' }],
            },
        ],
        screenshots: [
            {
                src: '/og-image.png',
                sizes: '1200x630',
                type: 'image/png',
                label: 'PeerPizza Home Screen',
            },
        ],
        share_target: {
            action: '/share',
            method: 'POST',
            enctype: 'multipart/form-data',
            params: {
                title: 'title',
                text: 'text',
                url: 'url',
                files: [
                    {
                        name: 'files',
                        accept: ['*/*'],
                    },
                ],
            },
        },
    };
}
