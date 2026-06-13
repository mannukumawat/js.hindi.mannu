import { NextRequest, NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME;

// Validate environment variables
function validateEnv() {
    const missing = [];
    if (!R2_ACCOUNT_ID) missing.push('R2_ACCOUNT_ID');
    if (!R2_ACCESS_KEY_ID) missing.push('R2_ACCESS_KEY_ID');
    if (!R2_SECRET_ACCESS_KEY) missing.push('R2_SECRET_ACCESS_KEY');
    if (!R2_BUCKET_NAME) missing.push('R2_BUCKET_NAME');
    return missing;
}

function getR2Client() {
    return new S3Client({
        region: 'auto',
        endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
        credentials: {
            accessKeyId: R2_ACCESS_KEY_ID,
            secretAccessKey: R2_SECRET_ACCESS_KEY,
        },
    });
}

// POST: Get presigned URL for direct upload to R2
export async function POST(request: NextRequest) {
    try {
        // Validate environment first
        const missing = validateEnv();
        if (missing.length > 0) {
            console.error('Missing R2 environment variables:', missing);
            return NextResponse.json(
                { error: `Missing environment variables: ${missing.join(', ')}` },
                { status: 500 }
            );
        }

        const { fileName, fileType, fileSize } = await request.json();

        if (!fileName) {
            return NextResponse.json(
                { error: 'File name is required' },
                { status: 400 }
            );
        }

        // Generate unique room ID
        const roomId = uuidv4();
        const key = `${roomId}/${fileName}`;

        const r2Client = getR2Client();

        // Create presigned URL for upload (valid for 1 hour)
        const command = new PutObjectCommand({
            Bucket: R2_BUCKET_NAME!,
            Key: key,
            ContentType: fileType || 'application/octet-stream',
        });

        const presignedUrl = await getSignedUrl(r2Client, command, { expiresIn: 3600 });

        return NextResponse.json({
            success: true,
            roomId,
            key,
            uploadUrl: presignedUrl,
            fileName,
            fileSize,
            fileType,
        });
    } catch (error) {
        console.error('Upload URL generation error:', error);
        return NextResponse.json(
            { error: 'Failed to generate upload URL', details: String(error) },
            { status: 500 }
        );
    }
}

