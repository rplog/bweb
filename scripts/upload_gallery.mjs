import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const SHARE_DIR = './Share';
const BUCKET_NAME = 'neosphere-assets';

// Ensure ffmpeg is available
try {
    execSync('ffmpeg -version', { stdio: 'ignore' });
} catch (e) {
    console.error('Error: ffmpeg is not installed or not in PATH.');
    process.exit(1);
}

// Ensure wrangler is available
try {
    execSync('npx wrangler --version', { stdio: 'ignore' });
} catch (e) {
    console.error('Error: wrangler is not installed or not in PATH.');
    process.exit(1);
}

const processDirectory = (dir) => {
    const items = fs.readdirSync(dir, { withFileTypes: true });

    for (const item of items) {
        const fullPath = path.join(dir, item.name);

        if (item.isDirectory()) {
            processDirectory(fullPath);
        } else if (item.isFile()) {
            processFile(fullPath);
        }
    }
};

const processFile = (filePath) => {
    const ext = path.extname(filePath).toLowerCase();

    // Only process images
    if (!['.heic', '.jpg', '.jpeg', '.png', '.webp'].includes(ext)) return;

    let uploadPath = filePath;
    let cleanup = false;

    // Convert HEIC to JPG
    if (ext === '.heic') {
        const newPath = filePath.replace(/\.heic$/i, '.jpg');
        console.log(`Converting ${path.basename(filePath)} to JPG...`);
        try {
            // ffmpeg -i input.heic -q:v 2 output.jpg (-q:v 2 is high quality)
            execSync(`ffmpeg -i "${filePath}" -y -q:v 2 "${newPath}"`, { stdio: 'inherit' });
            uploadPath = newPath;
            cleanup = true;
        } catch (e) {
            console.error(`Failed to convert ${filePath}:`, e);
            return;
        }
    }

    // Determine R2 key
    // filePath is like Share\Flora\image.jpg
    // We want key like Flora/image.jpg
    // Remove SHARE_DIR prefix and normalize slashes
    const relativePath = path.relative(SHARE_DIR, uploadPath).replace(/\\/g, '/');
    const key = relativePath; // e.g. Flora/image.jpg

    console.log(`Uploading ${key} to R2...`);
    try {
        // npx wrangler r2 object put neosphere-assets/Flora/image.jpg --file Share/Flora/image.jpg
        execSync(`npx wrangler r2 object put ${BUCKET_NAME}/${key} --file "${uploadPath}"`, { stdio: 'inherit' });
    } catch (e) {
        console.error(`Failed to upload ${key}:`, e);
    }

    // Cleanup converted file
    if (cleanup) {
        try {
            fs.unlinkSync(uploadPath);
        } catch (e) {
            console.error(`Failed to cleanup ${uploadPath}:`, e);
        }
    }
};

console.log('Starting Gallery Upload...');
if (fs.existsSync(SHARE_DIR)) {
    processDirectory(SHARE_DIR);
    console.log('Done!');
} else {
    console.error(`Directory ${SHARE_DIR} not found.`);
}
