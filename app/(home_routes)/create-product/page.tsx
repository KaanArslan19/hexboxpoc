"use client";

import { useRouter } from "next/navigation";
import ProductForm from "@/app/components/ProductForm";
import { useAccount, useWalletClient } from "wagmi";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";

interface Props {
  searchParams: { campaignId: string };
}
export default function CreateProductPage({ searchParams }: Props) {
  const campaignId = searchParams.campaignId;

  const router = useRouter();
  const userId = useAccount().address;
  const { data: walletClient } = useWalletClient();
  const [productOrService, setProductOrService] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [transactionStatus, setTransactionStatus] = useState<string | null>(null);

  useEffect(() => {
    const fetchCampaign = async () => {
      try {
        const res = await fetch(`/api/getCampaign?campaignId=${campaignId}`);
        if (!res.ok) throw new Error("Campaign not found");
        const campaign = await res.json();

        setProductOrService(campaign.product_or_service);
      } catch (error) {
        console.log("error", error);
        router.push("/");
      }
    };

    fetchCampaign();
  }, [campaignId, router]);

  const handleCreateProduct = async (values: any) => {
    try {
      if (!userId) {
        throw new Error("User not authenticated");
      }
      
      if (!walletClient) {
        throw new Error("Wallet not connected");
      }

      setIsSubmitting(true);
      setTransactionStatus("Preparing product data...");

      const formData = new FormData();
      formData.append("campaignId", campaignId);
      formData.append("userId", userId);
      formData.append("manufacturerId", values.manufacturerId);
      formData.append("countryOfOrigin", values.countryOfOrigin);
      formData.append("type", values.type);
      formData.append("logo", values.logo);
      if (Array.isArray(values.images)) {
        values.images.forEach((image: File, index: number) => {
          formData.append(`images[${index}]`, image);
        });
      } else if (values.images) {
        formData.append("images", values.images);
      }
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
      setTransactionStatus("Saving product to database...");
      const response = await fetch("/api/create-product", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create product");
      }

      // Success - redirect to campaign page
      setTransactionStatus("Success! Redirecting...");
      toast.success("Product created successfully!", {
        position: "top-center",
        autoClose: 5000,
      });
      setIsSubmitting(false); 
      router.push("/campaign?campaignId=" + campaignId);
    } catch (txError: any) {
      console.error("Transaction error:", txError);
      toast.error(`Transaction error: ${txError.message || "Unknown error"}`, {
        position: "top-center",
        autoClose: 5000,
      });
      setTransactionStatus(null);
      throw new Error(`Transaction failed: ${txError.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div>
      {transactionStatus && (
        <div className="fixed top-0 left-0 w-full bg-blue-500 text-white p-4 z-50 text-center">
          {transactionStatus}
        </div>
      )}
      <ProductForm
        productOrService={productOrService}
        onSubmit={handleCreateProduct}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}
