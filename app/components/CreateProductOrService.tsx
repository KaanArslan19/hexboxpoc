"use client";
import { ProductOrService } from "../types";
import { useAccount } from "wagmi";
import Link from "next/link";
import CustomButton from "./ui/CustomButton";

interface Props {
  pors: ProductOrService;
  userId: string;
  campaignId: string;
}

export default function CreateProductOrService({
  pors,
  userId,
  campaignId,
}: Props) {
  const { address } = useAccount();
  const campaignOwner = userId === address;

  if (!campaignOwner) return null;

  return (
    <div className="w-full px-4 py-2">
      <div className="flex gap-4 justify-end">
        {(pors === ProductOrService.ProductOnly ||
          pors === ProductOrService.ProductAndService) && (
          <Link href={`/create-product?campaignId=${campaignId}`}>
            <CustomButton className="py-2 px-6 hover:bg-blueColor/80 bg-blueColor text-white rounded-lg">
              Create new Product
            </CustomButton>
          </Link>
        )}

        {(pors === ProductOrService.ServiceOnly ||
          pors === ProductOrService.ProductAndService) && (
          <Link href={`/create-service?campaignId=${campaignId}`}>
            <CustomButton className="py-2 px-6 hover:bg-blueColor/80 bg-blueColor text-white rounded-lg">
              Create new Service
            </CustomButton>
          </Link>
        )}
      </div>
    </div>
  );
}
