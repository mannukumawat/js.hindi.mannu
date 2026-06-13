import { NextRequest, NextResponse } from 'next/server';
import { getDownloadUrl } from '@/lib/r2';
import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3';

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID!;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID!;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY!;
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME!;

const r2Client = new S3Client({
    region: 'auto',
    endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
        accessKeyId: R2_ACCESS_KEY_ID,
        secretAccessKey: R2_SECRET_ACCESS_KEY,
    },
});

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ roomId: string }> }
) {
    try {
        const { roomId } = await params;

        // List files in the room folder
        const listCommand = new ListObjectsV2Command({
            Bucket: R2_BUCKET_NAME,
            Prefix: `${roomId}/`,
        });

        const listResponse = await r2Client.send(listCommand);

        if (!listResponse.Contents || listResponse.Contents.length === 0) {
            return NextResponse.json(
                { error: 'Room not found or expired' },
                { status: 404 }
            );
        }

        // Get file info
        const files = await Promise.all(
            listResponse.Contents.map(async (obj) => {
                const key = obj.Key!;
                const fileName = key.split('/').pop() || 'file';
                const downloadUrl = await getDownloadUrl(key, fileName);

                return {
                    key,
                    fileName,
                    size: obj.Size,
                    downloadUrl,
                };
            })
        );

        return NextResponse.json({
            success: true,
            roomId,
            files,
            mode: 'cloud',
        });
    } catch (error) {
        console.error('Download error:', error);
        return NextResponse.json(
            { error: 'Failed to get files' },
            { status: 500 }
        );
    }
}
