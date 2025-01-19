"use client";

import { useRouter } from "next/navigation";
import ProductForm from "@/app/components/ProductForm";
import { useAccount } from "wagmi";
import { fetchSingleCampaign } from "@/app/utils/apiHelpers";

interface Props {
  searchParams: { campaignId: string };
}
export default function CreateProductPage({ searchParams }: Props) {
  const campaignId = searchParams.campaignId;

  const router = useRouter();

  const handleCreateProduct = async (values: any) => {
    try {
      const formData = new FormData();
      formData.append("campaignId", campaignId);
      formData.append("image", values.image);
      formData.append("name", values.name);
      formData.append("description", values.description);
      formData.append("price", values.price.toString());
      formData.append("supply", values.supply.toString());

      const response = await fetch("/api/create-product", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to create product");
      }

      router.push("/");
    } catch (error) {
      console.error("Error creating product:", error);
      alert("Error creating product. Please try again.");
    }
  };

  return <ProductForm onSubmit={handleCreateProduct} />;
}
