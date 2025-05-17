import { S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3";

const s3Client = new S3Client({
    region: "auto",
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    },
});

export const deleteMetadata = async (metadataDbId: string) => {
    try {
        const metadataFileDir = `product_metadata/${metadataDbId}`;
        const deleteObjectCommand = new DeleteObjectCommand({
            Bucket: process.env.R2_BUCKET_NAME!,
            Key: metadataFileDir,
        });
        await s3Client.send(deleteObjectCommand);
        return true;
    } catch (error) {
        console.error("Error deleting metadata:", error);
        return false;
    }
};
    