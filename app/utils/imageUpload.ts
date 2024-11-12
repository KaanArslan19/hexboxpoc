import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { v4 as uuidv4 } from 'uuid';

const s3Client = new S3Client({
    region: 'auto',
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID!,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    },
});

export async function uploadImageToR2(file: File) {
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
        return { 
            error: "Invalid file type. Please upload a valid image (JPEG, PNG, GIF, or WEBP)" 
        };
    }

    // Optional: Validate file size (e.g., max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    if (file.size > maxSize) {
        return { 
            error: "File size too large. Maximum size is 5MB" 
        }
    }

    // Generate unique ID for the image
    const uniqueId = uuidv4();
    const fileExtension = file.name.split('.').pop();
    const logoFileName = `${uniqueId}.${fileExtension}`
    const logoFileDir = `campaign_logos/${logoFileName}`;

        // Upload to S3
    const buffer = Buffer.from(await file.arrayBuffer());
    const uploadParams = {
        Bucket: process.env.R2_BUCKET_NAME!,
        Key: logoFileDir,
        Body: buffer,
        ContentType: file.type,
    };

    await s3Client.send(new PutObjectCommand(uploadParams));

    return logoFileName
}
