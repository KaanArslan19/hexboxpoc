import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { v4 as uuidv4 } from "uuid";

const s3Client = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

export async function uploadImageToR2(file: File) {
  // Validate file type
  const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
  if (!allowedTypes.includes(file.type)) {
    return {
      error:
        "Invalid file type. Please upload a valid image (JPEG, PNG, GIF, or WEBP)",
    };
  }

  // Optional: Validate file size (e.g., max 5MB)
  const maxSize = 5 * 1024 * 1024; // 5MB in bytes
  if (file.size > maxSize) {
    return {
      error: "File size too large. Maximum size is 5MB",
    };
  }

  // Generate unique ID for the image
  const uniqueId = uuidv4();
  const fileExtension = file.name.split(".").pop();
  const logoFileName = `${uniqueId}.${fileExtension}`;
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

  return logoFileName;
}

export async function uploadProductImageToR2(file: File, uuid: string) {
  // Validate file type
  const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
  if (!allowedTypes.includes(file.type)) {
    return {
      error:
        "Invalid file type. Please upload a valid image (JPEG, PNG, GIF, or WEBP)",
    };
  }

  // Optional: Validate file size (e.g., max 5MB)
  const maxSize = 5 * 1024 * 1024; // 5MB in bytes
  if (file.size > maxSize) {
    return {
      error: "File size too large. Maximum size is 5MB",
    };
  }

  // Generate unique ID for the image
  //const uniqueId = uuidv4();
  const fileExtension = file.name.split(".").pop();
  const logoFileName = `${uuid}.${fileExtension}`;
  const logoFileDir = `product_logos/${logoFileName}`;

  // Upload to S3
  const buffer = Buffer.from(await file.arrayBuffer());
  const uploadParams = {
    Bucket: process.env.R2_BUCKET_NAME!,
    Key: logoFileDir,
    Body: buffer,
    ContentType: file.type,
  };

  await s3Client.send(new PutObjectCommand(uploadParams));

  return logoFileName;
}

export async function uploadProductImagesToR2(files: File[], uuid: string) {
  const uploadedFileNames: string[] = [];
  const errors: string[] = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      errors.push(
        `File ${file.name}: Invalid file type. Please upload a valid image (JPEG, PNG, GIF, or WEBP)`
      );
      continue;
    }

    // Validate file size
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      errors.push(
        `File ${file.name}: File size too large. Maximum size is 5MB`
      );
      continue;
    }

    try {
      const fileExtension = file.name.split(".").pop();
      const fileName = `${uuid}_${i}.${fileExtension}`;
      const fileDir = `product_images/${fileName}`;

      // Upload to S3
      const buffer = Buffer.from(await file.arrayBuffer());
      const uploadParams = {
        Bucket: process.env.R2_BUCKET_NAME!,
        Key: fileDir,
        Body: buffer,
        ContentType: file.type,
      };

      await s3Client.send(new PutObjectCommand(uploadParams));
      uploadedFileNames.push(fileName);
    } catch (error) {
      errors.push(`File ${file.name}: Upload failed - ${error}`);
    }
  }

  return {
    uploadedFiles: uploadedFileNames,
    errors: errors.length > 0 ? errors : undefined,
  };
}
