import 'dotenv/config';
import { S3Client, ListObjectsV2Command, DeleteObjectsCommand } from '@aws-sdk/client-s3';

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

async function testCleanup() {
    console.log('🧪 Testing cleanup logic...');

    try {
        // 1. List all objects
        const listCommand = new ListObjectsV2Command({
            Bucket: R2_BUCKET_NAME,
        });

        const listResponse = await r2Client.send(listCommand);
        const allObjects = listResponse.Contents || [];
        console.log(`Found ${allObjects.length} total files.`);

        // 2. Filter objects older than 24 hours
        const now = new Date();
        const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

        const objectsToDelete = allObjects.filter(obj => {
            return obj.LastModified && obj.LastModified < twentyFourHoursAgo;
        });

        console.log(`Found ${objectsToDelete.length} files older than 24 hours.`);

        if (objectsToDelete.length > 0) {
            console.log('⚠️  Would delete:', objectsToDelete.map(o => o.Key));
            // Uncomment to actually delete in test
            // const deleteCommand = new DeleteObjectsCommand({
            //     Bucket: R2_BUCKET_NAME,
            //     Delete: {
            //         Objects: objectsToDelete.map(obj => ({ Key: obj.Key })),
            //     },
            // });
            // await r2Client.send(deleteCommand);
            // console.log('✅ Deleted files.');
        } else {
            console.log('✅ No old files to delete.');
        }

    } catch (error) {
        console.error('❌ Test failed:', error);
    }
}

testCleanup();
