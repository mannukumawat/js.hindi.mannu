import 'dotenv/config';
import { S3Client, PutBucketLifecycleConfigurationCommand } from '@aws-sdk/client-s3';

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

async function setupLifecycle() {
    console.log(`Configuring lifecycle for bucket: ${R2_BUCKET_NAME}...`);

    const command = new PutBucketLifecycleConfigurationCommand({
        Bucket: R2_BUCKET_NAME,
        LifecycleConfiguration: {
            Rules: [
                {
                    ID: 'delete-after-24h',
                    Status: 'Enabled',
                    Filter: {
                        Prefix: '', // Apply to all files
                    },
                    Expiration: {
                        Days: 1, // Delete after 1 day
                    },
                },
            ],
        },
    });

    try {
        await r2Client.send(command);
        console.log('✅ Successfully configured lifecycle rule: delete-after-24h');
    } catch (error) {
        console.error('❌ Error configuring lifecycle:', error);
    }
}

setupLifecycle();
