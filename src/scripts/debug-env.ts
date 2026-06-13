import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

console.log('Available environment variables:');
Object.keys(process.env).forEach(key => {
    if (key.startsWith('R2_') || key.includes('BUCKET')) {
        console.log(key);
    }
});
