"use client";
import { FaFacebook, FaShare, FaLink } from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";
import { Popover, message } from "antd";
import { useState, useEffect } from "react";
import Head from "next/head";

interface ShareButtonProps {
  title: string;
  description: string;
  campaignId: string;
  imageUrl?: string;
  logo?: string;
}

const ShareButton: React.FC<ShareButtonProps> = ({
  title,
  description,
  campaignId,
  logo,
}) => {
  const [open, setOpen] = useState(false);
  const [shareUrl, setShareUrl] = useState("");

  useEffect(() => {
    // Set the share URL when component mounts (client-side only)
    if (typeof window !== "undefined") {
      setShareUrl(window.location.href);
    } else {
      setShareUrl(
        `${
          process.env.NEXT_PUBLIC_BASE_URL || "https://yourdomain.com"
        }/campaign?campaignId=${campaignId}`
      );
    }
  }, [campaignId]);

  const getFacebookShareUrl = () => {
    // For Facebook, we need to rely on Open Graph meta tags for proper sharing
    // The FB share dialog doesn't fully support url parameters for content
    const url = encodeURIComponent(shareUrl);
    const image = logo;
    const imageParam = image ? `&picture=${encodeURIComponent(image)}` : "";

    // The u parameter is the only reliable one, but we can add picture parameter
    return `https://www.facebook.com/sharer/sharer.php?u=${url}${imageParam}`;
  };

  const getTwitterShareUrl = () => {
    const url = encodeURIComponent(shareUrl);
    const text = encodeURIComponent(`${title} - ${description}`);
    const image = logo;
    const imageParam = image ? `&image=${encodeURIComponent(image)}` : "";

    // Twitter supports text, url, and image parameters
    return `https://twitter.com/intent/tweet?url=${url}&text=${text}${imageParam}`;
  };

  const handleShare = (platform: string) => {
    switch (platform) {
      case "facebook":
        const facebookUrl = getFacebookShareUrl();
        const fbWindow = window.open(
          facebookUrl,
          "facebook-share",
          "width=580,height=660,left=100,top=100"
        );
        if (fbWindow && fbWindow.focus) {
          fbWindow.focus();
        }
        break;
      case "twitter":
        const twitterUrl = getTwitterShareUrl();
        const twWindow = window.open(
          twitterUrl,
          "twitter-share",
          "width=550,height=420,left=100,top=100"
        );
        if (twWindow && twWindow.focus) {
          twWindow.focus();
        }
        break;
      case "copy":
        navigator.clipboard
          .writeText(shareUrl)
          .then(() => {
            message.success("Link copied to clipboard!");
            setOpen(false);
          })
          .catch((err) => {
            message.error("Failed to copy link");
            console.error("Could not copy text: ", err);
          });
        break;
      default:
        if (navigator.share) {
          navigator
            .share({
              title: title,
              text: description,
              url: shareUrl,
            })
            .then(() => setOpen(false))
            .catch((err) => console.error("Error sharing:", err));
        }
    }
  };

  return (
    <Popover
      content={
        <div className="flex flex-col gap-2 py-1">
          <button
            onClick={() => handleShare("facebook")}
            className="flex items-center gap-2 hover:bg-gray-100 px-4 py-2 rounded-md transition-colors w-full"
          >
            <FaFacebook className="text-[#1877F2]" />
            <span>Share on Facebook</span>
          </button>
          <button
            onClick={() => handleShare("twitter")}
            className="flex items-center gap-2 hover:bg-gray-100 px-4 py-2 rounded-md transition-colors w-full"
          >
            <FaXTwitter className="text-black" />
            <span>Share on X</span>
          </button>
          <button
            onClick={() => handleShare("copy")}
            className="flex items-center gap-2 hover:bg-gray-100 px-4 py-2 rounded-md transition-colors w-full"
          >
            <FaLink className="text-gray-600" />
            <span>Copy Link</span>
          </button>
        </div>
      }
      trigger="click"
      placement="bottomRight"
      open={open}
      onOpenChange={setOpen}
    >
      <button className="flex items-center gap-2 bg-blueColor hover:bg-blueColor/80 text-white rounded-lg py-2 px-4 transition-colors">
        <FaShare className="text-sm" />
        <span>Share</span>
      </button>
    </Popover>
  );
};

export default ShareButton;
