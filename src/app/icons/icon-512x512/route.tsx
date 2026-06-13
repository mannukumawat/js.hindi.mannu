import { ImageResponse } from 'next/og';

// Route segment config
export const runtime = 'edge';

// Image metadata
export const size = {
    width: 512,
    height: 512,
};
export const contentType = 'image/png';

// Image generation - 512x512 icon for PWA
export async function GET() {
    return new ImageResponse(
        (
            <div
                style={{
                    fontSize: 380,
                    background: 'linear-gradient(135deg, #1a1a1a 0%, #0a0a0a 100%)',
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '80px',
                }}
            >
                🍕
            </div>
        ),
        {
            ...size,
        }
    );
}
