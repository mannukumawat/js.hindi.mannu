// PeerJS sirf browser mein kaam karta hai, SSR mein nahi
// So we use dynamic import

import type { DataConnection, Peer as PeerType } from 'peerjs';

// PeerJS connection options
// Apna server use karne ke liye .env.local mein NEXT_PUBLIC_PEER_* variables set karo
const peerOptions = {
    host: process.env.NEXT_PUBLIC_PEER_HOST || '0.peerjs.com',
    port: parseInt(process.env.NEXT_PUBLIC_PEER_PORT || '443'),
    path: process.env.NEXT_PUBLIC_PEER_PATH || '/',
    secure: process.env.NEXT_PUBLIC_PEER_SECURE !== 'false',
    debug: 2,
    config: {
        iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:global.stun.twilio.com:3478' },
        ],
    },
};

class PeerService {
    private peer: PeerType | null = null;
    private connection: DataConnection | null = null;

    // Initialize Peer
    // Peer initialize karta hai
    async init(id?: string): Promise<string> {
        // Dynamic import for client-side only
        // SSR se bachne ke liye dynamic import use kar rahe hain
        if (typeof window === 'undefined') {
            throw new Error('PeerJS only works in browser');
        }

        const { default: Peer } = await import('peerjs');

        return new Promise((resolve, reject) => {
            if (this.peer) {
                resolve(this.peer.id);
                return;
            }

            this.peer = id ? new Peer(id, peerOptions) : new Peer(peerOptions);

            this.peer.on('open', (peerId) => {
                console.log('My Peer ID is: ' + peerId);
                resolve(peerId);
            });

            this.peer.on('error', (err) => {
                console.error('Peer error:', err);
                reject(err);
            });
        });
    }

    // Connect to another peer
    // Dusre peer se connect karta hai
    connect(peerId: string): Promise<DataConnection> {
        return new Promise((resolve, reject) => {
            if (!this.peer) {
                reject(new Error('Peer not initialized'));
                return;
            }

            const conn = this.peer.connect(peerId, {
                reliable: true,
            });

            conn.on('open', () => {
                this.connection = conn;
                resolve(conn);
            });

            conn.on('error', (err) => {
                console.error('Connection error:', err);
                reject(err);
            });
        });
    }

    // Listen for incoming connections
    // Incoming connection ka wait karta hai
    onConnection(callback: (conn: DataConnection) => void) {
        if (!this.peer) return;
        this.peer.on('connection', (conn) => {
            conn.on('open', () => {
                this.connection = conn;
                callback(conn);
            });
        });
    }

    // Send data
    // Data bhejta hai
    send(data: unknown) {
        if (this.connection && this.connection.open) {
            this.connection.send(data);
        } else {
            console.warn('Connection not open, cannot send data');
        }
    }

    // Get current connection
    getConnection(): DataConnection | null {
        return this.connection;
    }

    // Destroy peer
    // Peer connection band karta hai
    destroy() {
        if (this.connection) {
            this.connection.close();
        }
        if (this.peer) {
            this.peer.destroy();
        }
        this.peer = null;
        this.connection = null;
    }
}

export const peerService = new PeerService();
export type { DataConnection };
