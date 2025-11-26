import client from "@/app/utils/mongodb";
import { ObjectId } from "mongodb";
import { deleteProductImages, deleteProductLogo } from "@/app/utils/imageDelete";
import { deleteMetadata } from "../metadataDelete";
    
export const deleteProduct = async (productDbId: string) => {
    const mdbClient = client;
    const db = mdbClient.db(process.env.HEXBOX_DB);
    const product = await db.collection("products").findOne({ _id: new ObjectId(productDbId) });
    if (!product) {
        return { success: false, error: "Product not found" };
    }
    try {
        const deleteLogoResult = await deleteProductLogo(product.logo);
        if (!deleteLogoResult) {
            console.error("Failed to delete product logo");
        }
        const deleteImageResult = await deleteProductImages(product.images.uploadedFiles);
        if (!deleteImageResult) {
            console.error("Failed to delete product image");
        }
        const deleteMetadataResult = await deleteMetadata(`${product.productId}.json`);
        if (!deleteMetadataResult) {
            console.error("Failed to delete product metadata");
        }
    } catch (error) {
        console.error("Error deleting product data:", error);
    }
    const result = await db.collection("products").deleteOne({ _id: new ObjectId(productDbId) });
    if (!result) {
        return { success: false, error: "Failed to delete product" };
    }
    return { success: true };
};