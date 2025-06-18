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

// ...productInitialValues,
// type: ProductOrService.ServiceOnly,
// inventory: undefined,
// freeShipping: undefined,
// productReturnPolicy: undefined,
// service_terms: {
//   contract_time_begining: "",
//   contract_length: "2 hours",
// },

export async function uploadProductMetadataToR2(productMetadata: any) {

    // const productAttributes = [

    // ]

    // const serviceAttributes = [
    //     {
    //         trait_type: "Details",
    //         value: productMetadata.details
    //     },
    //     {
    //         trait_type: "ID", // Probably unnecessary.
    //         value: productMetadata.productId
    //     },
    //     {
    //         trait_type: "Type",
    //         value: productMetadata.type
    //     },
    //     {
    //         trait_type: "Manufacturer",
    //         value: productMetadata.manufacturerId
    //     },
    //     {
    //         trait_type: "Country of Origin",
    //         value: productMetadata.countryOfOrigin
    //     },
    //     {
    //         trait_type: "Free Shipping",
    //         value: productMetadata.freeShipping
    //     },
    //     {
    //         trait_type: "Campaign ID",
    //         value: productMetadata.campaignId
    //     },
    //     {
    //         trait_type: "Return Policy",
    //         value: productMetadata.returnPolicy
    //     },
    // ]

    // const attributes = productMetadata.type === ProductOrService.Product ? productAttributes : serviceAttributes;

    const productMetadataStructure = {
        name: productMetadata.name,
        description: productMetadata.description,
        image: `${process.env.R2_BUCKET_URL}/product_logos/${productMetadata.logo}`, //https://static.hexbox.money/campaign_products/images/${productMetadata.image}`, // Check to make sure this is accurate.
        attributes: [
            {
                trait_type: "ID", // Probably unnecessary.
                value: productMetadata.productId
            },
            {
                trait_type: "Type",
                value: productMetadata.type
            },
            {
                trait_type: "Manufacturer",
                value: productMetadata.manufacturerId
            },
            {
                trait_type: "Country of Origin",
                value: productMetadata.countryOfOrigin
            },
            {
                trait_type: "Free Shipping",
                value: productMetadata.freeShipping
            },
            {
                trait_type: "Campaign ID",
                value: productMetadata.campaignId
            },
            {
                trait_type: "Return Policy",
                value: JSON.stringify(productMetadata.returnPolicy)
            },
            {
                trait_type: "Fullfillment Details",
                value: productMetadata.fulfillmentDetails ? productMetadata.fulfillmentDetails : ""
            },
            {
                trait_type: "Delivery Date",
                value: productMetadata.deliveryDate ? productMetadata.deliveryDate : ""
            }
        ]
    }

    const jsn = JSON.stringify(productMetadataStructure);
    const blob = new Blob([jsn], { type: 'application/json' });
    const file = new File([ blob ], 'file.json');

        // Upload to S3
    const buffer = Buffer.from(await file.arrayBuffer());
    const uploadParams = {
        Bucket: process.env.R2_BUCKET_NAME!,
        Key: `product_metadata/${productMetadata.productId}.json`,
        Body: buffer,
        ContentType: file.type,
    };

    await s3Client.send(new PutObjectCommand(uploadParams));

    return `product_metadata/${productMetadata.productId}.json`
}