import { NextRequest, NextResponse } from "next/server";
import client from "@/app/utils/mongodb";
import { ObjectId } from "mongodb";
import { getServerSideUser } from "@/app/utils/getServerSideUser";
import { uploadImageToR2 } from "@/app/utils/imageUpload";
import { campaignUpdateRateLimiter } from "@/app/lib/auth/utils/rateLimiter";
import {
  verifyTurnstileToken,
  getClientIp,
} from "@/app/lib/turnstile/verifyTurnstile";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSideUser(req);
    if (!session.isAuthenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Apply rate limiting
    const identifier =
      req.headers.get("x-forwarded-for") ||
      req.headers.get("x-real-ip") ||
      session.address ||
      "unknown";

    if (campaignUpdateRateLimiter.isRateLimited(identifier)) {
      return NextResponse.json(
        {
          error: "Too many update requests. Please try again later.",
          retryAfter: Math.ceil(
            campaignUpdateRateLimiter.config.windowMs / 1000
          ),
        },
        {
          status: 429,
          headers: {
            "Retry-After": Math.ceil(
              campaignUpdateRateLimiter.config.windowMs / 1000
            ).toString(),
          },
        }
      );
    }

    const url = new URL(req.url);
    const campaignId = url.searchParams.get("campaignId");

    if (!campaignId || !ObjectId.isValid(campaignId)) {
      return NextResponse.json(
        { error: "Invalid campaign ID" },
        { status: 400 }
      );
    }

    const formData = await req.formData();
    if (!formData) {
      return NextResponse.json(
        { error: "Campaign data is required" },
        { status: 400 }
      );
    }

    // Validate Turnstile token for bot protection
    const turnstileToken = formData.get("turnstileToken");
    if (!turnstileToken) {
      console.log("Missing Turnstile token in campaign update request");
      return NextResponse.json(
        {
          error:
            "Security verification required. Please complete the verification and try again.",
        },
        { status: 400 }
      );
    }

    // Verify Turnstile token with Cloudflare
    const clientIp = getClientIp(req);
    const isTurnstileValid = await verifyTurnstileToken(
      turnstileToken as string,
      clientIp
    );

    if (!isTurnstileValid) {
      console.log("Invalid Turnstile token in campaign update request");
      return NextResponse.json(
        {
          error:
            "Security verification failed. Please refresh the page and try again.",
        },
        { status: 403 }
      );
    }

    console.log("Turnstile verification successful for campaign update");

    const db = client.db("hexbox_poc");

    // CRITICAL FIX: Add ownership validation
    const existingCampaign = await db.collection("campaigns").findOne({
      _id: new ObjectId(campaignId),
      user_id: session.address, // Only allow campaign owner to update
    });

    if (!existingCampaign) {
      return NextResponse.json(
        {
          error: "Campaign not found or you don't have permission to update it",
        },
        { status: 404 }
      );
    }

    // Input validation and sanitization
    const title = (formData.get("title") as string)?.trim();
    const email = (formData.get("email") as string)?.trim();
    const phoneNumber = (formData.get("phoneNumber") as string)?.trim();
    const description = (formData.get("description") as string)?.trim();
    const location = (formData.get("location") as string)?.trim();
    const rawFundsManagement = formData.get("funds_management");

    // Validate required fields
    if (
      !title ||
      !email ||
      !phoneNumber ||
      !description ||
      !location ||
      !rawFundsManagement
    ) {
      return NextResponse.json(
        { error: "All required fields must be provided" },
        { status: 400 }
      );
    }

    // Handle funds_management: convert to array format and append new entry if changed
    let fundsManagementArray: Array<{ text: string; timestamp: number }> = [];
    const existingFundsManagement = existingCampaign.funds_management;

    // Normalize existing funds_management to array format
    if (Array.isArray(existingFundsManagement)) {
      fundsManagementArray = [...existingFundsManagement];
    } else if (
      typeof existingFundsManagement === "string" &&
      existingFundsManagement.trim()
    ) {
      // Convert legacy string format to array
      // Use campaign creation timestamp if available, otherwise current time
      const legacyTimestamp = existingCampaign.timestamp || Date.now();
      fundsManagementArray = [
        {
          text: existingFundsManagement.trim(),
          timestamp: legacyTimestamp,
        },
      ];
    }

    // Process new funds_management value
    let newFundsManagementText = "";
    if (typeof rawFundsManagement === "string") {
      newFundsManagementText = rawFundsManagement.trim();
    } else if (Array.isArray(rawFundsManagement)) {
      // If it's already an array, get the latest entry
      const latestEntry = rawFundsManagement[rawFundsManagement.length - 1];
      newFundsManagementText = latestEntry?.text || "";
    }

    // Only append if the text has changed
    const currentText =
      fundsManagementArray.length > 0
        ? fundsManagementArray[fundsManagementArray.length - 1].text
        : "";

    if (newFundsManagementText && newFundsManagementText !== currentText) {
      fundsManagementArray.push({
        text: newFundsManagementText,
        timestamp: Date.now(),
      });
    } else if (!newFundsManagementText) {
      return NextResponse.json(
        { error: "Funds management description is required" },
        { status: 400 }
      );
    }

    // Validate character limit
    if (newFundsManagementText.length > 1000) {
      return NextResponse.json(
        {
          error:
            "Funds management description exceeds maximum of 1000 characters",
        },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    let updatedFields: any = {};

    updatedFields.title = title;
    updatedFields.email = email;
    updatedFields.phoneNumber = phoneNumber;
    updatedFields.description = description;
    updatedFields.location = location;
    updatedFields.funds_management = fundsManagementArray;

    const oneLiner = (formData.get("one_liner") as string)?.trim();
    if (oneLiner) {
      updatedFields.one_liner = oneLiner;
    }

    const productOrService = formData.get("product_or_service");
    if (productOrService) {
      updatedFields.product_or_service = productOrService as string;
    }

    const walletAddress = (formData.get("wallet_address") as string)?.trim();
    if (walletAddress) {
      // Basic Ethereum address validation
      if (!/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
        return NextResponse.json(
          { error: "Invalid wallet address format" },
          { status: 400 }
        );
      }
      updatedFields.wallet_address = walletAddress;
    }

    // Note: fund_amount, funding_type, and deadline are not updatable
    // They remain unchanged from the existing campaign

    const socialLinksStr = formData.get("social_links") as string;
    if (socialLinksStr) {
      try {
        const socialLinks = JSON.parse(socialLinksStr);
        // Validate social links structure
        if (typeof socialLinks === "object" && socialLinks !== null) {
          updatedFields.social_links = socialLinks;
        } else {
          throw new Error("Invalid social links format");
        }
      } catch (e) {
        console.error("Error parsing social links:", e);
        updatedFields.social_links = existingCampaign.social_links;
      }
    }

    const logoFile = formData.get("logo") as File;
    if (logoFile && logoFile instanceof File) {
      // Validate file type and size
      const allowedTypes = [
        "image/jpeg",
        "image/png",
        "image/gif",
        "image/webp",
      ];
      const maxSize = 5 * 1024 * 1024; // 5MB

      if (!allowedTypes.includes(logoFile.type)) {
        return NextResponse.json(
          {
            error:
              "Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed",
          },
          { status: 400 }
        );
      }

      if (logoFile.size > maxSize) {
        return NextResponse.json(
          { error: "File size too large. Maximum size is 5MB" },
          { status: 400 }
        );
      }

      const newLogoFileName = await uploadImageToR2(logoFile);
      updatedFields.logo = newLogoFileName;
    } else {
      updatedFields.logo = existingCampaign.logo;
    }

    console.log("Updating campaign with fields:", {
      ...updatedFields,
      email: "[REDACTED]",
      phoneNumber: "[REDACTED]",
      wallet_address: updatedFields.wallet_address
        ? `${updatedFields.wallet_address.substring(
            0,
            6
          )}...${updatedFields.wallet_address.substring(38)}`
        : "[REDACTED]",
    });

    const result = await db
      .collection("campaigns")
      .updateOne({ _id: new ObjectId(campaignId) }, { $set: updatedFields });

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Update failed" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: "Campaign updated successfully",
    });
  } catch (error) {
    console.error("Error updating campaign:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
