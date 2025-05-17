import { S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3";

const s3Client = new S3Client({
    region: "auto",
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    },
});

export const deleteCampaignImage = async (imageDbId: string) => {
    try {
        const logoFileDir = `campaign_logos/${imageDbId}`;
        const deleteObjectCommand = new DeleteObjectCommand({
            Bucket: process.env.R2_BUCKET_NAME!,
            Key: logoFileDir,
        });

        await s3Client.send(deleteObjectCommand);

        return true;
    } catch (error) {
        console.error("Error deleting image:", error);
        return false;
    }
};

export const deleteProductLogo = async (imageDbId: string) => {
    try {
        const logoFileDir = `product_logos/${imageDbId}`;
        const deleteObjectCommand = new DeleteObjectCommand({
            Bucket: process.env.R2_BUCKET_NAME!,
            Key: logoFileDir,
        });
        await s3Client.send(deleteObjectCommand);
        return true;
    } catch (error) {
        console.error("Error deleting image:", error);
        return false;
    }
};

export const deleteProductImages = async (imageDbIds: string[]) => {
    try {
        imageDbIds.forEach(async (imageDbId) => {
            const logoFileDir = `product_images/${imageDbId}`;
            const deleteObjectCommand = new DeleteObjectCommand({
                Bucket: process.env.R2_BUCKET_NAME!,
                Key: logoFileDir,
            });
            await s3Client.send(deleteObjectCommand);
        });
        return true;
    } catch (error) {
        console.error("Error deleting image:", error);
        return false;
    }
};