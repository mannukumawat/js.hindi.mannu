import { NextResponse } from 'next/server';
import { S3Client, ListObjectsV2Command, DeleteObjectsCommand } from '@aws-sdk/client-s3';

// R2 Configuration from environment variables
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

export async function GET(request: Request) {
    // Security check (optional but recommended)
    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');

    // Simple protection: require ?key=secure-cleanup-key
    if (key !== 'secure-cleanup-key') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        console.log('Starting cleanup job...');

        // 1. List all objects
        const listCommand = new ListObjectsV2Command({
            Bucket: R2_BUCKET_NAME,
        });

        const listResponse = await r2Client.send(listCommand);
        const allObjects = listResponse.Contents || [];

        if (allObjects.length === 0) {
            return NextResponse.json({ message: 'No files found to clean up.' });
        }

        // 2. Filter objects older than 24 hours
        const now = new Date();
        const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

        const objectsToDelete = allObjects.filter(obj => {
            return obj.LastModified && obj.LastModified < twentyFourHoursAgo;
        });

        if (objectsToDelete.length === 0) {
            return NextResponse.json({
                message: 'No files older than 24 hours found.',
                totalFilesChecked: allObjects.length
            });
        }

        // 3. Delete filtered objects
        const deleteCommand = new DeleteObjectsCommand({
            Bucket: R2_BUCKET_NAME,
            Delete: {
                Objects: objectsToDelete.map(obj => ({ Key: obj.Key })),
            },
        });

        await r2Client.send(deleteCommand);

        return NextResponse.json({
            message: 'Cleanup successful',
            deletedCount: objectsToDelete.length,
            deletedFiles: objectsToDelete.map(obj => obj.Key),
            totalFilesChecked: allObjects.length
        });

    } catch (error) {
        console.error('Cleanup error:', error);
        return NextResponse.json({ error: 'Cleanup failed', details: error }, { status: 500 });
    }
}
