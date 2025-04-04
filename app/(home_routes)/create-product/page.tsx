"use client";

import { useRouter } from "next/navigation";
import ProductForm from "@/app/components/ProductForm";
import { useAccount, useWalletClient } from "wagmi";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { ProductOrService } from "@/app/types";
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
  const [transactionStatus, setTransactionStatus] = useState<string | null>(
    null
  );

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
    console.log("values", values);
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
      const priceValue = values.price || {
        amount: 0,
        tax_inclusive: false,
        gst_rate: 0,
        gst_amount: 0,
      };
      formData.append(
        "price",
        JSON.stringify({
          amount: Number(priceValue.amount) || 0,
          tax_inclusive: Boolean(priceValue.tax_inclusive),
          gst_rate: Number(priceValue.gst_rate) || 0,
          gst_amount: Number(priceValue.gst_amount) || 0,
        })
      );
      if (Array.isArray(values.images)) {
        values.images.forEach((image: File, index: number) => {
          formData.append(`images[${index}]`, image);
        });
      } else if (values.images) {
        formData.append("images", values.images);
      }
      formData.append("name", values.name);
      formData.append("description", values.description);
      formData.append("status", values.status);

      formData.append("category", JSON.stringify(values.category));
      formData.append("isDonationProduct", "false");

      formData.append("freeShipping", values.freeShipping);

      if (values.type === ProductOrService.ServiceOnly) {
        formData.append("inventory", "null");
        formData.append("freeShipping", "false");
        formData.append("productReturnPolicy", "null");

        if (values.service_terms) {
          formData.append(
            "service_terms",
            JSON.stringify({
              contract_time_begining:
                values.service_terms.contract_time_begining,
              contract_length: values.service_terms.contract_length,
            })
          );
        }
      } else {
        formData.append(
          "inventory",
          JSON.stringify(
            values.type === ProductOrService.ServiceOnly
              ? { stock_level: 0 }
              : values.inventory ?? { stock_level: 0 }
          )
        );
        formData.append(
          "freeShipping",
          values.freeShipping?.toString() || "false"
        );
        const processedReturnPolicy =
          values.type === ProductOrService.ServiceOnly
            ? null
            : {
                eligible: values.productReturnPolicy?.eligible ?? false,
                return_period_days:
                  values.productReturnPolicy?.return_period_days ?? 0,
                conditions: values.productReturnPolicy?.conditions ?? "",
              };

        // When appending to formData
        formData.append(
          "productReturnPolicy",
          JSON.stringify(processedReturnPolicy)
        );
      }

      setTransactionStatus("Saving product to database...");
      console.log(formData);
      const response = await fetch("/api/create-product", {
        method: "POST",
        body: formData,
      });
      const responseText = await response.text();
      let errorData;
      console.log(responseText, "responseText");
      try {
        // Only try to parse if there's content
        if (responseText.trim()) {
          errorData = JSON.parse(responseText);
        } else {
          errorData = { message: "Empty response received from server" };
        }
      } catch (parseError) {
        console.error("Failed to parse response:", responseText);
        errorData = {
          message: `Invalid JSON response: ${responseText.substring(
            0,
            100
          )}...`,
        };
      }
      if (!response.ok) {
        throw new Error(errorData.message || "Failed to create product");
      }

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
        <div className="fixed top-0 left-0 w-full bg-blueColor text-white p-4 z-50 text-center">
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
