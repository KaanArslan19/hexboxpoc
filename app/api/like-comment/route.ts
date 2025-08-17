import { NextRequest, NextResponse } from "next/server";
import client from "@/app/utils/mongodb";
import { ObjectId } from "mongodb";
import { getServerSideUser } from "@/app/utils/getServerSideUser";
import { CampaignBackendDetails } from "@/app/types";
import { likeRateLimiter } from "@/app/lib/auth/utils/rateLimiter";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSideUser(req);
    if (!session.isAuthenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Apply rate limiting
    const identifier = req.headers.get("x-forwarded-for") || 
                      req.headers.get("x-real-ip") ||
                      session.address ||
                      "unknown";
    
    if (likeRateLimiter.isRateLimited(identifier)) {
      return NextResponse.json(
        { 
          error: "Too many like requests. Please try again later.",
          retryAfter: Math.ceil(likeRateLimiter.config.windowMs / 1000)
        },
        { 
          status: 429,
          headers: {
            'Retry-After': Math.ceil(likeRateLimiter.config.windowMs / 1000).toString()
          }
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

    const body = await req.json();
    const { commentId, replyId } = body;

    if (!commentId) {
      return NextResponse.json(
        { error: "Comment ID is required" },
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

    const userId = session.address;

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    if (replyId) {
      // liking/unliking a reply
      const comment = existingCampaign.comments?.find(
        (c: any) => c.id === commentId
      );
      if (!comment) {
        return NextResponse.json(
          { error: "Comment not found" },
          { status: 404 }
        );
      }

      const reply = comment.replies?.find((r: any) => r.id === replyId);
      if (!reply) {
        return NextResponse.json({ error: "Reply not found" }, { status: 404 });
      }

      const hasLiked = reply.likedBy?.includes(userId) || false;

      if (hasLiked) {
        // Unlike the reply
        await db.collection<CampaignBackendDetails>("campaigns").updateOne(
          {
            _id: new ObjectId(campaignId),
            "comments.id": commentId,
            "comments.replies.id": replyId,
          },
          {
            $pull: {
              "comments.$[comment].replies.$[reply].likedBy": userId as string,
            },
            $inc: { "comments.$[comment].replies.$[reply].likes": -1 },
          },
          {
            arrayFilters: [
              { "comment.id": commentId },
              { "reply.id": replyId },
            ],
          }
        );
      } else {
        // Like the reply
        await db.collection("campaigns").updateOne(
          {
            _id: new ObjectId(campaignId),
            "comments.id": commentId,
            "comments.replies.id": replyId,
          },
          {
            $addToSet: {
              "comments.$[comment].replies.$[reply].likedBy": userId as string,
            },
            $inc: { "comments.$[comment].replies.$[reply].likes": 1 },
          },
          {
            arrayFilters: [
              { "comment.id": commentId },
              { "reply.id": replyId },
            ],
          }
        );
      }

      return NextResponse.json({
        success: true,
        message: hasLiked ? "Reply unliked" : "Reply liked",
      });
    } else {
      // Liking/unliking a comment
      const comment = existingCampaign.comments?.find(
        (c: any) => c.id === commentId
      );
      if (!comment) {
        return NextResponse.json(
          { error: "Comment not found" },
          { status: 404 }
        );
      }

      const hasLiked = comment.likedBy?.includes(userId) || false;

      if (hasLiked) {
        // Unlike the comment
        await db.collection<CampaignBackendDetails>("campaigns").updateOne(
          {
            _id: new ObjectId(campaignId),
            "comments.id": commentId,
          },
          {
            $pull: { "comments.$.likedBy": userId as string },
            $inc: { "comments.$.likes": -1 },
          }
        );
      } else {
        // Like the comment
        await db.collection("campaigns").updateOne(
          {
            _id: new ObjectId(campaignId),
            "comments.id": commentId,
          },
          {
            $addToSet: { "comments.$.likedBy": userId as string },
            $inc: { "comments.$.likes": 1 },
          }
        );
      }

      return NextResponse.json({
        success: true,
        message: hasLiked ? "Comment unliked" : "Comment liked",
      });
    }
  } catch (error) {
    console.error("Error liking comment:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
