import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

export const extractMetadata = async (filePath, mimeType) => {
    const stats = fs.statSync(filePath);
    const fileBuffer = fs.readFileSync(filePath);
    const hashSum = crypto.createHash('sha256');
    hashSum.update(fileBuffer);
    const checksum = hashSum.digest('hex');

    return {
        filename: path.basename(filePath),
        mimeType,
        size: stats.size,
        checksum,
        // Note: pageCount, dimensions, duration require specific libraries which can be added per file type
    };
};
