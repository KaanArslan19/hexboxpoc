import { NextRequest, NextResponse } from "next/server";
import client from "@/app/utils/mongodb";
import { ObjectId } from "mongodb";
import { getServerSideUser } from "@/app/utils/getServerSideUser";
import { CampaignBackendDetails } from "@/app/types";
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSideUser(req);
    if (!session.isAuthenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(req.url);
    const campaignId = url.searchParams.get("campaignId");

    if (!campaignId || !ObjectId.isValid(campaignId)) {
      return NextResponse.json(
        { error: "Invalid campaign ID" },
        { status: 400 }
      );
    }

    const body = await req.json();
    const { content, parentCommentId } = body;

    if (!content || content.trim().length === 0) {
      return NextResponse.json(
        { error: "Comment content is required" },
        { status: 400 }
      );
    }

    const db = client.db("hexbox_poc");

    // campaign check
    const existingCampaign = await db
      .collection("campaigns")
      .findOne({ _id: new ObjectId(campaignId) });

    if (!existingCampaign) {
      return NextResponse.json(
        { error: "Campaign not found" },
        { status: 404 }
      );
    }

    // backer check
    const userId = session.address;

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    const isBacker =
      existingCampaign.backers?.some(
        (backer: any) => backer.userId === userId
      ) || false;

    const isCreator = existingCampaign.user_id === userId;

    const timestamp = new Date();

    if (parentCommentId) {
      // Adding a reply to an existing comment
      const newReply = {
        id: new ObjectId().toString(),
        author: {
          name: session.address,
          userId: userId,
          isCreator: isCreator,
          isBacker: isBacker,
        },
        content: content.trim(),
        timestamp: timestamp,
        likes: 0,
        isLiked: false,
      };

      const result = await db
        .collection<CampaignBackendDetails>("campaigns")
        .updateOne(
          {
            _id: new ObjectId(campaignId),
            "comments.id": parentCommentId,
          },
          {
            $push: { "comments.$.replies": newReply },
          }
        );

      if (result.matchedCount === 0) {
        return NextResponse.json(
          { error: "Parent comment not found" },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        message: "Reply added successfully",
        reply: newReply,
      });
    } else {
      // Adding a new top-level comment
      const newComment = {
        id: new ObjectId().toString(),
        author: {
          name: session.address,
          userId: userId,
          isCreator: isCreator,
          isBacker: isBacker,
        },
        content: content.trim(),
        timestamp: timestamp,
        likes: 0,
        isLiked: false,
        replies: [],
        isExpanded: false,
      };

      const result = await db
        .collection<CampaignBackendDetails>("campaigns")
        .updateOne(
          { _id: new ObjectId(campaignId) },
          {
            $push: { comments: newComment },
          }
        );

      if (result.matchedCount === 0) {
        return NextResponse.json(
          { error: "Failed to add comment" },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: "Comment added successfully",
        comment: newComment,
      });
    }
  } catch (error) {
    console.error("Error adding comment:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
