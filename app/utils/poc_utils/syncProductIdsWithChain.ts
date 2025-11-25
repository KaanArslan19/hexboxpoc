import { ethers } from "ethers";
import {
  S3Client,
  CopyObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
} from "@aws-sdk/client-s3";
import client from "@/app/utils/mongodb";
import USDCFundraiserUpgradeable from "@/app/utils/contracts/artifacts/contracts/USDCFundraiserUpgradeable.sol/USDCFundraiserUpgradeable.json";

const s3Client = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

interface ProductSyncResult {
  success: boolean;
  productId: number | string;
  uniqueProductId?: string;
  error?: string;
}

interface SyncResult {
  success: boolean;
  syncedProducts: ProductSyncResult[];
  errors: string[];
}

/**
 * Checks if an object exists in R2 storage
 */
async function objectExists(key: string): Promise<boolean> {
  try {
    await s3Client.send(
      new HeadObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME!,
        Key: key,
      })
    );
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Updates the metadata JSON file with the new unique product ID
 */
async function updateMetadataImageUrl(
  metadataKey: string,
  oldProductId: string | number,
  newProductId: string,
  logoExtension: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Get the existing metadata file
    const getResponse = await s3Client.send(
      new GetObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME!,
        Key: metadataKey,
      })
    );

    // Read the file content
    const bodyContents = await getResponse.Body?.transformToString();
    if (!bodyContents) {
      return { success: false, error: "Failed to read metadata file" };
    }

    // Parse the JSON
    const metadata = JSON.parse(bodyContents);

    // Update the image URL with the new product ID
    const oldLogoFilename = `${oldProductId}.${logoExtension}`;
    const newLogoFilename = `${newProductId}.${logoExtension}`;

    if (metadata.image && metadata.image.includes(oldLogoFilename)) {
      metadata.image = metadata.image.replace(oldLogoFilename, newLogoFilename);
    }

    // Update the ID attribute if it exists
    if (metadata.attributes && Array.isArray(metadata.attributes)) {
      const idAttribute = metadata.attributes.find(
        (attr: any) => attr.trait_type === "ID"
      );
      if (idAttribute) {
        idAttribute.value = newProductId;
      }
    }

    // Upload the updated metadata
    const updatedContent = JSON.stringify(metadata);
    await s3Client.send(
      new PutObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME!,
        Key: metadataKey,
        Body: updatedContent,
        ContentType: "application/json",
      })
    );

    console.log(
      `Successfully updated metadata image URL from ${oldLogoFilename} to ${newLogoFilename}`
    );
    return { success: true };
  } catch (error) {
    console.error(`Error updating metadata image URL:`, error);
    return {
      success: false,
      error: `Failed to update metadata: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
    };
  }
}

/**
 * Renames a file in R2 storage by copying and deleting the original
 */
async function renameR2File(
  oldKey: string,
  newKey: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Check if source file exists
    const exists = await objectExists(oldKey);
    if (!exists) {
      console.log(`Source file does not exist: ${oldKey}`);
      return { success: false, error: `Source file not found: ${oldKey}` };
    }

    // Copy the object to the new key
    await s3Client.send(
      new CopyObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME!,
        CopySource: `${process.env.R2_BUCKET_NAME}/${oldKey}`,
        Key: newKey,
      })
    );

    // Delete the old object
    await s3Client.send(
      new DeleteObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME!,
        Key: oldKey,
      })
    );

    console.log(`Successfully renamed ${oldKey} to ${newKey}`);
    return { success: true };
  } catch (error) {
    console.error(`Error renaming file from ${oldKey} to ${newKey}:`, error);
    return {
      success: false,
      error: `Failed to rename: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
    };
  }
}

/**
 * Syncs a single product ID with its on-chain unique product ID
 * This function:
 * 1. Gets unique product ID from the contract
 * 2. Renames R2 files (metadata, logo, images)
 * 3. Updates database with originalProductId and new productId
 */
export async function syncSingleProductIdWithChain(
  productId: string | number,
  fundraiserAddress: string
): Promise<ProductSyncResult> {
  try {
    // Initialize provider and contract
    const provider = new ethers.JsonRpcProvider(
      process.env.RPC_URL
    );

    const fundraiserContract = new ethers.Contract(
      fundraiserAddress,
      USDCFundraiserUpgradeable.abi,
      provider
    );

    // Get product from database
    const mdbClient = client;
    const db = mdbClient.db(process.env.HEXBOX_DB);
    const product = await db
      .collection("products")
      .findOne({ productId: productId });

    if (!product) {
      return {
        success: false,
        productId,
        error: `Product ${productId} not found in database`,
      };
    }

    const originalProductId = product.productId;
    console.log(`Processing product with original ID: ${originalProductId}`);

    // Get unique product ID from contract
    let uniqueProductId: bigint;
    try {
      uniqueProductId = await fundraiserContract.getUniqueProductId(
        BigInt(originalProductId)
      );
      console.log(
        `Got unique product ID from chain: ${uniqueProductId.toString()}`
      );
    } catch (error) {
      const errorMsg = `Failed to get unique product ID for ${originalProductId}: ${
        error instanceof Error ? error.message : "Unknown error"
      }`;
      console.error(errorMsg);
      return {
        success: false,
        productId: originalProductId,
        error: errorMsg,
      };
    }

    const uniqueProductIdStr = uniqueProductId.toString();

    // Skip if IDs are the same
    if (originalProductId.toString() === uniqueProductIdStr) {
      console.log(`Product ${originalProductId} already has correct ID`);
      return {
        success: true,
        productId: originalProductId,
        uniqueProductId: uniqueProductIdStr,
      };
    }

    const errors: string[] = [];

    // Get logo file extension for metadata update
    const logoExtension = product.logo
      ? product.logo.split(".").pop() || ""
      : "";

    // Rename metadata file
    const oldMetadataKey = `product_metadata/${originalProductId}.json`;
    const newMetadataKey = `product_metadata/${uniqueProductIdStr}.json`;
    const metadataResult = await renameR2File(oldMetadataKey, newMetadataKey);
    if (!metadataResult.success) {
      errors.push(`Metadata rename failed: ${metadataResult.error}`);
    } else {
      // Update the metadata JSON content with new image URL
      const metadataUpdateResult = await updateMetadataImageUrl(
        newMetadataKey,
        originalProductId,
        uniqueProductIdStr,
        logoExtension
      );
      if (!metadataUpdateResult.success) {
        errors.push(
          `Metadata content update failed: ${metadataUpdateResult.error}`
        );
      }
    }

    // Rename logo file if it exists
    if (product.logo) {
      const logoFileName = product.logo;
      const fileExtension = logoFileName.split(".").pop();
      const oldLogoKey = `product_logos/${logoFileName}`;
      const newLogoKey = `product_logos/${uniqueProductIdStr}.${fileExtension}`;

      const logoResult = await renameR2File(oldLogoKey, newLogoKey);
      if (!logoResult.success) {
        errors.push(`Logo rename failed: ${logoResult.error}`);
      }
    }

    // Rename product images
    if (
      product.images?.uploadedFiles &&
      Array.isArray(product.images.uploadedFiles)
    ) {
      for (let i = 0; i < product.images.uploadedFiles.length; i++) {
        const imageFileName = product.images.uploadedFiles[i];
        const fileExtension = imageFileName.split(".").pop();
        const oldImageKey = `product_images/${imageFileName}`;
        const newImageKey = `product_images/${uniqueProductIdStr}_${i}.${fileExtension}`;

        const imageResult = await renameR2File(oldImageKey, newImageKey);
        if (!imageResult.success) {
          errors.push(`Image ${i} rename failed: ${imageResult.error}`);
        }
      }
    }

    // Update database
    const updateResult = await db.collection("products").updateOne(
      { _id: product._id },
      {
        $set: {
          originalProductId: originalProductId,
          productId: uniqueProductIdStr,
          logo: product.logo
            ? `${uniqueProductIdStr}.${product.logo.split(".").pop()}`
            : product.logo,
          status: "available",
          images: product.images?.uploadedFiles
            ? {
                uploadedFiles: product.images.uploadedFiles.map(
                  (fileName: string, index: number) => {
                    const ext = fileName.split(".").pop();
                    return `${uniqueProductIdStr}_${index}.${ext}`;
                  }
                ),
                errors: product.images.errors || null,
              }
            : product.images,
        },
      }
    );

    if (updateResult.modifiedCount === 1) {
      console.log(
        `Successfully synced product ${originalProductId} -> ${uniqueProductIdStr}`
      );
      return {
        success: errors.length === 0,
        productId: originalProductId,
        uniqueProductId: uniqueProductIdStr,
        error: errors.length > 0 ? errors.join("; ") : undefined,
      };
    } else {
      const errorMsg = `Failed to update database for product ${originalProductId}`;
      errors.push(errorMsg);
      return {
        success: false,
        productId: originalProductId,
        error: errors.join("; "),
      };
    }
  } catch (error) {
    const errorMsg = `Error processing product ${productId}: ${
      error instanceof Error ? error.message : "Unknown error"
    }`;
    console.error(errorMsg);
    return {
      success: false,
      productId,
      error: errorMsg,
    };
  }
}

/**
 * Syncs product IDs with on-chain unique product IDs
 * This function:
 * 1. Fetches all products for a campaign
 * 2. Gets unique product IDs from the contract
 * 3. Renames R2 files (metadata, logo, images)
 * 4. Updates database with originalProductId and new productId
 */
export async function syncProductIdsWithChain(
  campaignId: string,
  fundraiserAddress: string
): Promise<SyncResult> {
  const syncedProducts: ProductSyncResult[] = [];
  const errors: string[] = [];

  try {
    // Initialize provider and contract
    const provider = new ethers.JsonRpcProvider(
      process.env.RPC_URL
    );

    const fundraiserContract = new ethers.Contract(
      fundraiserAddress,
      USDCFundraiserUpgradeable.abi,
      provider
    );

    // Get products from database
    const mdbClient = client;
    const db = mdbClient.db(process.env.HEXBOX_DB);
    const products = await db
      .collection("products")
      .find({ campaignId: campaignId, status: "draft" })
      .toArray();

    if (!products.length) {
      console.log(`No draft products found for campaign ${campaignId}`);
      return {
        success: true,
        syncedProducts: [],
        errors: [],
      };
    }

    console.log(
      `Found ${products.length} products to sync for campaign ${campaignId}`
    );

    // Process each product
    for (const product of products) {
      try {
        const originalProductId = product.productId;
        console.log(
          `Processing product with original ID: ${originalProductId}`
        );

        // Get unique product ID from contract
        let uniqueProductId: bigint;
        try {
          uniqueProductId = await fundraiserContract.getUniqueProductId(
            BigInt(originalProductId)
          );
          console.log(
            `Got unique product ID from chain: ${uniqueProductId.toString()}`
          );
        } catch (error) {
          const errorMsg = `Failed to get unique product ID for ${originalProductId}: ${
            error instanceof Error ? error.message : "Unknown error"
          }`;
          console.error(errorMsg);
          errors.push(errorMsg);
          syncedProducts.push({
            success: false,
            productId: originalProductId,
            error: errorMsg,
          });
          continue;
        }

        const uniqueProductIdStr = uniqueProductId.toString();

        // Skip if IDs are the same
        if (originalProductId.toString() === uniqueProductIdStr) {
          console.log(`Product ${originalProductId} already has correct ID`);
          syncedProducts.push({
            success: true,
            productId: originalProductId,
            uniqueProductId: uniqueProductIdStr,
          });
          continue;
        }

        // Get logo file extension for metadata update
        const logoExtension = product.logo
          ? product.logo.split(".").pop() || ""
          : "";

        // Rename metadata file
        const oldMetadataKey = `product_metadata/${originalProductId}.json`;
        const newMetadataKey = `product_metadata/${uniqueProductIdStr}.json`;
        const metadataResult = await renameR2File(
          oldMetadataKey,
          newMetadataKey
        );
        if (!metadataResult.success) {
          errors.push(
            `Metadata rename failed for product ${originalProductId}: ${metadataResult.error}`
          );
        } else {
          // Update the metadata JSON content with new image URL
          const metadataUpdateResult = await updateMetadataImageUrl(
            newMetadataKey,
            originalProductId,
            uniqueProductIdStr,
            logoExtension
          );
          if (!metadataUpdateResult.success) {
            errors.push(
              `Metadata content update failed for product ${originalProductId}: ${metadataUpdateResult.error}`
            );
          }
        }

        // Rename logo file if it exists
        if (product.logo) {
          const logoFileName = product.logo;
          const fileExtension = logoFileName.split(".").pop();
          const oldLogoKey = `product_logos/${logoFileName}`;
          const newLogoKey = `product_logos/${uniqueProductIdStr}.${fileExtension}`;

          const logoResult = await renameR2File(oldLogoKey, newLogoKey);
          if (!logoResult.success) {
            errors.push(
              `Logo rename failed for product ${originalProductId}: ${logoResult.error}`
            );
          }
        }

        // Rename product images
        if (
          product.images?.uploadedFiles &&
          Array.isArray(product.images.uploadedFiles)
        ) {
          for (let i = 0; i < product.images.uploadedFiles.length; i++) {
            const imageFileName = product.images.uploadedFiles[i];
            const fileExtension = imageFileName.split(".").pop();
            const oldImageKey = `product_images/${imageFileName}`;
            const newImageKey = `product_images/${uniqueProductIdStr}_${i}.${fileExtension}`;

            const imageResult = await renameR2File(oldImageKey, newImageKey);
            if (!imageResult.success) {
              errors.push(
                `Image ${i} rename failed for product ${originalProductId}: ${imageResult.error}`
              );
            }
          }
        }

        // Update database
        const updateResult = await db.collection("products").updateOne(
          { _id: product._id },
          {
            $set: {
              originalProductId: originalProductId,
              productId: uniqueProductIdStr,
              logo: product.logo
                ? `${uniqueProductIdStr}.${product.logo.split(".").pop()}`
                : product.logo,
              status: "available",
              images: product.images?.uploadedFiles
                ? {
                    uploadedFiles: product.images.uploadedFiles.map(
                      (fileName: string, index: number) => {
                        const ext = fileName.split(".").pop();
                        return `${uniqueProductIdStr}_${index}.${ext}`;
                      }
                    ),
                    errors: product.images.errors || null,
                  }
                : product.images,
            },
          }
        );

        if (updateResult.modifiedCount === 1) {
          console.log(
            `Successfully synced product ${originalProductId} -> ${uniqueProductIdStr}`
          );
          syncedProducts.push({
            success: true,
            productId: originalProductId,
            uniqueProductId: uniqueProductIdStr,
          });
        } else {
          const errorMsg = `Failed to update database for product ${originalProductId}`;
          errors.push(errorMsg);
          syncedProducts.push({
            success: false,
            productId: originalProductId,
            error: errorMsg,
          });
        }
      } catch (error) {
        const errorMsg = `Error processing product ${product.productId}: ${
          error instanceof Error ? error.message : "Unknown error"
        }`;
        console.error(errorMsg);
        errors.push(errorMsg);
        syncedProducts.push({
          success: false,
          productId: product.productId,
          error: errorMsg,
        });
      }
    }

    return {
      success: errors.length === 0,
      syncedProducts,
      errors,
    };
  } catch (error) {
    console.error("Error in syncProductIdsWithChain:", error);
    return {
      success: false,
      syncedProducts,
      errors: [
        `Fatal error: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      ],
    };
  }
}
