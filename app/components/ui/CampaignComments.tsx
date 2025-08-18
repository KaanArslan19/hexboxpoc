"use client";
import React, { useState, useEffect } from "react";
import { Heart, Reply, Flag, MoreHorizontal, Send, User } from "lucide-react";
import CustomButton from "./CustomButton";
import { apiFetch } from "@/app/utils/api-client";
import useIsAuth from "@/app/lib/auth/hooks/useIsAuth";

interface Comment {
  id: string;
  author: {
    name: string;
    userId: string;
    isCreator: boolean;
    isBacker: boolean;
  };
  content: string;
  timestamp: string | Date;
  likes: number;
  likedBy?: string[];
  replies: Reply[];
  isExpanded: boolean;
}

interface Reply {
  id: string;
  author: {
    name: string;
    userId: string;
    isCreator: boolean;
    isBacker: boolean;
  };
  content: string;
  timestamp: string | Date;
  likes: number;
  likedBy?: string[];
}

interface CampaignCommentsProps {
  campaignId: string;
  commentsProp?: Comment[];
  currentUserId: string;
}

const CampaignComments: React.FC<CampaignCommentsProps> = ({
  campaignId,
  currentUserId,
  commentsProp,
}) => {
  const { isAuth } = useIsAuth();
  const [newComment, setNewComment] = useState("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "most-liked">(
    "newest"
  );
  const [comments, setComments] = useState<Comment[]>(commentsProp || []);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);

  // Format timestamp to relative time
  const formatTimestamp = (timestamp: string | Date) => {
    const date =
      typeof timestamp === "string" ? new Date(timestamp) : timestamp;
    const now = new Date();
    const diffInMinutes = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60)
    );

    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  // Sort comments based on selected criteria
  const sortedComments = [...comments].sort((a, b) => {
    switch (sortBy) {
      case "oldest":
        return (
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        );
      case "most-liked":
        return b.likes - a.likes;
      case "newest":
      default:
        return (
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
    }
  });

  const handleLike = async (commentId: string, replyId?: string) => {
    if (!currentUserId) {
      alert("Please log in to like comments");
      return;
    }

    try {
      const response = await apiFetch(
        `/api/like-comment?campaignId=${campaignId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ commentId, replyId }),
        }
      );

      if (response.ok) {
        // Update local state optimistically
        setComments((prev) =>
          prev.map((comment) => {
            if (comment.id === commentId) {
              if (replyId) {
                const updatedReplies = comment.replies.map((reply) => {
                  if (reply.id === replyId) {
                    const hasLiked =
                      reply.likedBy?.includes(currentUserId) || false;
                    return {
                      ...reply,
                      likes: hasLiked ? reply.likes - 1 : reply.likes + 1,
                      likedBy: hasLiked
                        ? reply.likedBy?.filter((id) => id !== currentUserId) ||
                          []
                        : [...(reply.likedBy || []), currentUserId],
                    };
                  }
                  return reply;
                });
                return { ...comment, replies: updatedReplies };
              } else {
                const hasLiked =
                  comment.likedBy?.includes(currentUserId) || false;
                return {
                  ...comment,
                  likes: hasLiked ? comment.likes - 1 : comment.likes + 1,
                  likedBy: hasLiked
                    ? comment.likedBy?.filter((id) => id !== currentUserId) ||
                      []
                    : [...(comment.likedBy || []), currentUserId],
                };
              }
            }
            return comment;
          })
        );
      } else {
        const error = await response.json();
        alert(error.error || "Failed to like comment");
      }
    } catch (error) {
      console.error("Error liking comment:", error);
      alert("Failed to like comment");
    }
  };

  const handleReply = async (commentId: string) => {
    if (!replyText.trim()) return;
    if (!currentUserId) {
      alert("Please log in to reply");
      return;
    }

    setIsSubmittingReply(true);
    try {
      const response = await apiFetch(
        `/api/add-comment?campaignId=${campaignId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            content: replyText,
            parentCommentId: commentId,
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();

        // Update local state with new reply
        setComments((prev) =>
          prev.map((comment) =>
            comment.id === commentId
              ? {
                  ...comment,
                  replies: [...comment.replies, data.reply],
                  isExpanded: true,
                }
              : comment
          )
        );

        setReplyText("");
        setReplyingTo(null);
      } else {
        const error = await response.json();
        alert(error.error || "Failed to add reply");
      }
    } catch (error) {
      console.error("Error adding reply:", error);
      alert("Failed to add reply");
    } finally {
      setIsSubmittingReply(false);
    }
  };

  const handleNewComment = async () => {
    if (!newComment.trim()) return;
    if (!currentUserId) {
      alert("Please log in to comment");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await apiFetch(
        `/api/add-comment?campaignId=${campaignId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            content: newComment,
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();

        // Add new comment to the beginning of the list
        setComments((prev) => [data.comment, ...prev]);
        setNewComment("");
      } else {
        const error = await response.json();
        console.log(error, "error");
        alert(error.error || "Failed to add comment");
      }
    } catch (error) {
      console.error("Error adding comment:", error);
      alert("Failed to add comment");
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleReplies = (commentId: string) => {
    setComments((prev) =>
      prev.map((comment) =>
        comment.id === commentId
          ? { ...comment, isExpanded: !comment.isExpanded }
          : comment
      )
    );
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Comments</h2>
          <p className="text-gray-600 mt-1">{comments.length} comments</p>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">Sort by:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="most-liked">Most liked</option>
          </select>
        </div>
      </div>

      {/* New Comment Form - Only show to authenticated users */}
      {isAuth && (
        <div className="mb-8">
          <div className="flex gap-3">
            <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
              <User size={20} className="text-gray-500" />
            </div>
            <div className="flex-1">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Leave a comment for the creator..."
                className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blueColor/30 focus:border-transparent"
                rows={3}
                disabled={!currentUserId || isSubmitting}
                maxLength={500}
              />
              <div className="flex justify-between items-center mt-2">
                <span className="text-sm text-gray-500">
                  {newComment.length > 0 && `${newComment.length}/500 characters`}
                </span>
                <button
                  onClick={handleNewComment}
                  disabled={!newComment.trim() || !currentUserId || isSubmitting}
                  className="flex items-center gap-2 px-4 py-2 bg-blueColor text-white rounded-lg hover:bg-blueColor/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Send size={16} />
                  {isSubmitting ? "Posting..." : "Post Comment"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Login prompt for unauthenticated users */}
      {!isAuth && (
        <div className="mb-8 p-4 bg-gray-50 rounded-lg text-center">
          <p className="text-gray-600 mb-2">Want to join the conversation?</p>
          <p className="text-sm text-gray-500">Please connect your wallet to comment, like, and reply.</p>
        </div>
      )}

      {/* Comments List */}
      <div className="space-y-6">
        {sortedComments.map((comment) => {
          const isLikedByUser =
            comment.likedBy?.includes(currentUserId || "") || false;

          return (
            <div
              key={comment.id}
              className="border-b border-gray-200 pb-6 last:border-b-0"
            >
              <div className="flex gap-3">
                <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                  <User size={20} className="text-gray-500" />
                </div>

                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-semibold text-gray-900">
                      {comment.author.name}
                    </span>
                    {comment.author.isCreator && (
                      <span className="px-2 py-1 bg-blue-100 text-blueColorDull text-xs rounded-full">
                        Creator
                      </span>
                    )}
                    {comment.author.isBacker && (
                      <span className="px-2 py-1 bg-green-100 text-orangeColorDull text-xs rounded-full">
                        Backer
                      </span>
                    )}
                    <span className="text-gray-500 text-sm">•</span>
                    <span className="text-gray-500 text-sm">
                      {formatTimestamp(comment.timestamp)}
                    </span>
                  </div>

                  <p className="text-gray-800 mb-3 leading-relaxed">
                    {comment.content}
                  </p>

                  <div className="flex items-center gap-4">
                    {/* Like button - show to all users but only functional for authenticated */}
                    {isAuth ? (
                      <button
                        onClick={() => handleLike(comment.id)}
                        disabled={!currentUserId}
                        className={`flex items-center gap-1 px-2 py-1 rounded-md transition-colors ${
                          isLikedByUser
                            ? "text-redColor bg-red-50 hover:bg-red-100"
                            : "text-gray-600 hover:bg-gray-100"
                        }`}
                      >
                        <Heart
                          size={16}
                          fill={isLikedByUser ? "currentColor" : "none"}
                        />
                        <span className="text-sm">{comment.likes}</span>
                      </button>
                    ) : (
                      <div className="flex items-center gap-1 px-2 py-1 text-gray-400">
                        <Heart size={16} fill="none" />
                        <span className="text-sm">{comment.likes}</span>
                      </div>
                    )}

                    {/* Reply button - only show to authenticated users */}
                    {isAuth && (
                      <button
                        onClick={() =>
                          setReplyingTo(
                            replyingTo === comment.id ? null : comment.id
                          )
                        }
                        disabled={!currentUserId}
                        className="flex items-center gap-1 px-2 py-1 text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
                      >
                        <Reply size={16} />
                        <span className="text-sm">Reply</span>
                      </button>
                    )}

                    {/* Report and More options - only show to authenticated users */}
                    {isAuth && (
                      <>
                        <button className="p-1 text-gray-400 hover:text-gray-600 transition-colors">
                          <Flag size={16} />
                        </button>

                        <button className="p-1 text-gray-400 hover:text-gray-600 transition-colors">
                          <MoreHorizontal size={16} />
                        </button>
                      </>
                    )}
                  </div>

                  {/* Reply Form - only show to authenticated users */}
                  {isAuth && replyingTo === comment.id && (
                    <div className="mt-4 ml-6">
                      <div className="flex gap-3">
                        <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                          <User size={16} className="text-gray-500" />
                        </div>
                        <div className="flex-1">
                          <textarea
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            placeholder={`Reply to ${comment.author.name}...`}
                            className="w-full p-2 border border-gray-300 rounded-md resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                            rows={2}
                            disabled={isSubmittingReply}
                            maxLength={500}
                          />
                          <div className="flex justify-between items-center mt-2">
                            <span className="text-sm text-gray-500">
                              {replyText.length > 0 &&
                                `${replyText.length}/500 characters`}
                            </span>
                            <div className="flex gap-2">
                              <button
                                onClick={() => setReplyingTo(null)}
                                disabled={isSubmittingReply}
                                className="px-3 py-1 text-gray-600 hover:bg-gray-100 rounded-md text-sm transition-colors disabled:opacity-50"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={() => handleReply(comment.id)}
                                disabled={
                                  !replyText.trim() || isSubmittingReply
                                }
                                className="px-3 py-1 bg-blueColor text-white rounded-md hover:bg-blueColor/80 disabled:opacity-50 disabled:cursor-not-allowed text-sm transition-colors"
                              >
                                {isSubmittingReply ? "Replying..." : "Reply"}
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Replies */}
                  {comment.replies.length > 0 && (
                    <div className="mt-4 ml-6">
                      <CustomButton
                        onClick={() => toggleReplies(comment.id)}
                        className="text-blueColor hover:text-blueColor/80 text-sm font-medium mb-3 transition-colors"
                      >
                        {comment.isExpanded ? "Hide" : "Show"}{" "}
                        {comment.replies.length}{" "}
                        {comment.replies.length === 1 ? "reply" : "replies"}
                      </CustomButton>

                      {comment.isExpanded && (
                        <div className="space-y-4">
                          {comment.replies.map((reply) => {
                            const isReplyLikedByUser =
                              reply.likedBy?.includes(currentUserId || "") ||
                              false;

                            return (
                              <div key={reply.id} className="flex gap-3">
                                <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                                  <User size={16} className="text-gray-500" />
                                </div>
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="font-medium text-gray-900 text-sm">
                                      {reply.author.name}
                                    </span>
                                    {reply.author.isCreator && (
                                      <span className="px-2 py-0.5 bg-blue-100 text-blueColorDull text-xs rounded-full">
                                        Creator
                                      </span>
                                    )}
                                    {reply.author.isBacker && (
                                      <span className="px-2 py-0.5 bg-green-100 text-orangeColorDull text-xs rounded-full">
                                        Backer
                                      </span>
                                    )}
                                    <span className="text-gray-500 text-xs">
                                      •
                                    </span>
                                    <span className="text-gray-500 text-xs">
                                      {formatTimestamp(reply.timestamp)}
                                    </span>
                                  </div>

                                  <p className="text-gray-800 text-sm mb-2 leading-relaxed">
                                    {reply.content}
                                  </p>

                                  <div className="flex items-center gap-3">
                                    {/* Reply like button - show to all users but only functional for authenticated */}
                                    {isAuth ? (
                                      <button
                                        onClick={() =>
                                          handleLike(comment.id, reply.id)
                                        }
                                        disabled={!currentUserId}
                                        className={`flex items-center gap-1 px-2 py-1 rounded-md transition-colors text-xs ${
                                          isReplyLikedByUser
                                            ? "text-red-600 bg-red-50 hover:bg-red-100"
                                            : "text-gray-600 hover:bg-gray-100"
                                        }`}
                                      >
                                        <Heart
                                          size={14}
                                          fill={
                                            isReplyLikedByUser
                                              ? "currentColor"
                                              : "none"
                                          }
                                        />
                                        <span>{reply.likes}</span>
                                      </button>
                                    ) : (
                                      <div className="flex items-center gap-1 px-2 py-1 text-gray-400 text-xs">
                                        <Heart size={14} fill="none" />
                                        <span>{reply.likes}</span>
                                      </div>
                                    )}

                                    {/* Report button - only show to authenticated users */}
                                    {isAuth && (
                                      <button className="p-1 text-gray-400 hover:text-gray-600 transition-colors">
                                        <Flag size={14} />
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {comments.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <p>No comments yet. Be the first to comment!</p>
        </div>
      )}

      {comments.length > 0 && (
        <div className="text-center mt-8">
          <button className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
            Load more comments
          </button>
        </div>
      )}
    </div>
  );
};

export default CampaignComments;
