"use client";

import { useRouter } from "next/navigation";
import ProductForm from "@/app/components/ProductForm";
import { useAccount } from "wagmi";

interface Props {
  searchParams: { campaignId: string };
}
export default function CreateProductPage({ searchParams }: Props) {
  const campaignId = searchParams.campaignId;

  const router = useRouter();
  const userId = useAccount().address;

  const handleCreateProduct = async (values: any) => {
    try {
      if (!userId) {
        throw new Error("User not authenticated");
      }
      const formData = new FormData();
      formData.append("campaignId", campaignId);
      formData.append("userId", userId);
      formData.append("manufacturerId", values.manufacturerId);
      formData.append("countryOfOrigin", values.countryOfOrigin);
      formData.append("type", values.type);
      formData.append("logo", values.logo);
      formData.append("images", values.images);
      formData.append("name", values.name);
      formData.append("description", values.description);
      formData.append("supply", values.supply.toString());
      formData.append("freeShipping", values.freeShipping);
      formData.append("status", values.status);

      formData.append("category", JSON.stringify(values.category));
      formData.append("price", JSON.stringify(values.price));
      formData.append("inventory", JSON.stringify(values.inventory));
      formData.append(
        "productReturnPolicy",
        JSON.stringify(values.productReturnPolicy)
      );

      console.log("formDataPages---", formData);
      const response = await fetch("/api/create-product", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to create product");
      }

      router.push("/campaign?campaignId=" + campaignId);
    } catch (error) {
      console.error("Error creating product:", error);
      alert("Error creating product. Please try again.");
    }
  };

  return <ProductForm onSubmit={handleCreateProduct} />;
}
