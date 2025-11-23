import { NextRequest, NextResponse } from "next/server";
import client from "@/app/utils/mongodb";
import { getServerSideUser } from "@/app/utils/getServerSideUser";
import { MongoClient } from "mongodb";
import * as Yup from "yup";
import { campaignDraftValidationSchema } from "@/app/lib/validation/campaignDraftValidation";
import { validateRequestSize } from "@/app/lib/middleware/requestSizeLimit";
import { campaignDraftRateLimiter } from "@/app/lib/auth/utils/rateLimiter";

// GET: Fetch user's draft
export const GET = async (req: NextRequest) => {
  try {
    // Rate limiting
    const identifier = req.headers.get("x-forwarded-for") || 
                      req.headers.get("x-real-ip") ||
                      "unknown";
    
    if (campaignDraftRateLimiter.isRateLimited(identifier)) {
      return NextResponse.json(
        { 
          error: "Too many requests. Please try again later.",
          retryAfter: Math.ceil(campaignDraftRateLimiter.config.windowMs / 1000)
        },
        { 
          status: 429,
          headers: {
            'Retry-After': Math.ceil(campaignDraftRateLimiter.config.windowMs / 1000).toString()
          }
        }
      );
    }
    
    // Validate request size
    const sizeError = validateRequestSize(req);
    if (sizeError) return sizeError;
    
    const session = await getServerSideUser(req);
    
    if (!session.isAuthenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const userId = session.address;
    
    // Connect to MongoDB
    const mongoClient = client as MongoClient;
    const db = mongoClient.db(process.env.HEXBOX_DB);
    const draft = await db.collection("campaignDrafts").findOne({ userId });

    console.log("Draft fetched successfully:", draft);
    
    return NextResponse.json({ formData: draft?.formData || null });
  } catch (error) {
    console.error("Error fetching draft:", error);
    return NextResponse.json({ error: "Failed to load draft" }, { status: 500 });
  }
};



// PUT: Save/update draft
export const PUT = async (req: NextRequest) => {
  try {
    // Rate limiting
    const identifier = req.headers.get("x-forwarded-for") || 
                      req.headers.get("x-real-ip") ||
                      "unknown";
    
    if (campaignDraftRateLimiter.isRateLimited(identifier)) {
      return NextResponse.json(
        { 
          error: "Too many requests. Please try again later.",
          retryAfter: Math.ceil(campaignDraftRateLimiter.config.windowMs / 1000)
        },
        { 
          status: 429,
          headers: {
            'Retry-After': Math.ceil(campaignDraftRateLimiter.config.windowMs / 1000).toString()
          }
        }
      );
    }
    
    const session = await getServerSideUser(req);
    
    if (!session.isAuthenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // Validate request size
    const sizeError = validateRequestSize(req);
    if (sizeError) return sizeError;
    
    const userId = session.address;
    const body = await req.json();
    const { formData } = body;
    
    // Validate formData structure
    if (formData !== null && formData !== undefined) {
      try {
        await campaignDraftValidationSchema.validate(formData, {
          abortEarly: false,
          stripUnknown: false
        });
      } catch (error) {
        if (error instanceof Yup.ValidationError) {
          const validationErrors = error.inner.map((err: Yup.ValidationError) => ({
            field: err.path || 'unknown',
            message: err.message
          }));
          
          return NextResponse.json({
            error: "Invalid form data",
            details: validationErrors
          }, { status: 400 });
        }
        
        // Re-throw non-validation errors
        throw error;
      }
    }
    
    // Connect to MongoDB
    const mongoClient = client as MongoClient;
    const db = mongoClient.db(process.env.HEXBOX_DB);
    const result = await db.collection("campaignDrafts").updateOne(
      { userId },
      {
        $set: {
          formData,
          updatedAt: new Date()
        }
      },
      { upsert: true }
    );

    console.log("Draft saved successfully:", result);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error saving draft:", error);
    return NextResponse.json({ error: "Failed to save draft" }, { status: 500 });
  }
};

// DELETE: Remove draft
export const DELETE = async (req: NextRequest) => {
  try {
    // Rate limiting
    const identifier = req.headers.get("x-forwarded-for") || 
                      req.headers.get("x-real-ip") ||
                      "unknown";
    
    if (campaignDraftRateLimiter.isRateLimited(identifier)) {
      return NextResponse.json(
        { 
          error: "Too many requests. Please try again later.",
          retryAfter: Math.ceil(campaignDraftRateLimiter.config.windowMs / 1000)
        },
        { 
          status: 429,
          headers: {
            'Retry-After': Math.ceil(campaignDraftRateLimiter.config.windowMs / 1000).toString()
          }
        }
      );
    }
    
    // Validate request size
    const sizeError = validateRequestSize(req);
    if (sizeError) return sizeError;
    
    const session = await getServerSideUser(req);
    
    if (!session.isAuthenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const userId = session.address;
    
    // Connect to MongoDB
    const mongoClient = client as MongoClient;
    const db = mongoClient.db(process.env.HEXBOX_DB);
    await db.collection("campaignDrafts").deleteOne({ userId });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting draft:", error);
    // Even if there's no draft to delete, we'll return success
    return NextResponse.json({ error: "Error deleting draft" }, { status: 500 });
  }
};
