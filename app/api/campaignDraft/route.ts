import { NextRequest, NextResponse } from "next/server";
import client from "@/app/utils/mongodb";
import { getServerSideUser } from "@/app/utils/getServerSideUser";
import { MongoClient } from "mongodb";

// GET: Fetch user's draft
export const GET = async (req: NextRequest) => {
  try {
    const session = await getServerSideUser(req);
    
    if (!session.isAuthenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const userId = session.address;
    
    // Connect to MongoDB
    const mongoClient = client as MongoClient;
    const db = mongoClient.db("hexbox_poc");
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
    const session = await getServerSideUser(req);
    
    if (!session.isAuthenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const userId = session.address;
    const body = await req.json();
    const { formData } = body;
    
    // Connect to MongoDB
    const mongoClient = client as MongoClient;
    const db = mongoClient.db("hexbox_poc");
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
    const session = await getServerSideUser(req);
    
    if (!session.isAuthenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const userId = session.address;
    
    // Connect to MongoDB
    const mongoClient = client as MongoClient;
    const db = mongoClient.db("hexbox_poc");
    await db.collection("campaignDrafts").deleteOne({ userId });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting draft:", error);
    // Even if there's no draft to delete, we'll return success
    return NextResponse.json({ success: true });
  }
};
