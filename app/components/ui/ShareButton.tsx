"use client";
import { FaFacebook, FaShare, FaLink } from "react-icons/fa";
import { Popover, message } from "antd";
import { useState, useEffect } from "react";
import { FaXTwitter } from "react-icons/fa6";
interface ShareButtonProps {
  title: string;
  description: string;
  campaignId: string;
}

const ShareButton: React.FC<ShareButtonProps> = ({
  title,
  description,
  campaignId,
}) => {
  const [open, setOpen] = useState(false);
  const [shareUrl, setShareUrl] = useState("");

  useEffect(() => {
    const url = new URL(window.location.origin + window.location.pathname);
    url.searchParams.set("campaignId", campaignId);
    setShareUrl(url.toString());
  }, [campaignId]);

  const getFacebookShareUrl = () => {
    return `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
      shareUrl
    )}`;
  };

  const getTwitterShareUrl = () => {
    return `https://twitter.com/intent/tweet?url=${encodeURIComponent(
      shareUrl
    )}&text=${encodeURIComponent(`${title} - ${description}`)}`;
  };

  const getWhatsAppShareUrl = () => {
    return `https://wa.me/?text=${encodeURIComponent(
      `${title} - ${description}\n${shareUrl}`
    )}`;
  };

  const getLinkedInShareUrl = () => {
    return `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
      shareUrl
    )}`;
  };

  const handleShare = (platform: string) => {
    switch (platform) {
      case "facebook":
        window.open(
          getFacebookShareUrl(),
          "facebook-share",
          "width=580,height=660"
        );
        break;
      case "twitter":
        window.open(
          getTwitterShareUrl(),
          "twitter-share",
          "width=550,height=420"
        );
        break;
      case "whatsapp":
        window.open(getWhatsAppShareUrl(), "_blank");
        break;
      case "linkedin":
        window.open(
          getLinkedInShareUrl(),
          "linkedin-share",
          "width=550,height=550"
        );
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
        <div className="flex flex-col gap-2 py-1 min-w-[200px]">
          <button
            onClick={() => handleShare("facebook")}
            className="flex items-center gap-3 hover:bg-gray-100 px-4 py-2 rounded-md transition-colors w-full text-left"
          >
            <FaFacebook className="text-[#1877F2] text-lg" />
            <span>Share on Facebook</span>
          </button>
          <button
            onClick={() => handleShare("twitter")}
            className="flex items-center gap-3 hover:bg-gray-100 px-4 py-2 rounded-md transition-colors w-full text-left"
          >
            <FaXTwitter className="text-black text-lg" />
            <span>Share on X</span>
          </button>
          <button
            onClick={() => handleShare("whatsapp")}
            className="flex items-center gap-3 hover:bg-gray-100 px-4 py-2 rounded-md transition-colors w-full text-left"
          >
            <svg
              className="w-5 h-5 text-[#25D366]"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.570-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.890-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488" />
            </svg>
            <span>Share on WhatsApp</span>
          </button>
          <button
            onClick={() => handleShare("linkedin")}
            className="flex items-center gap-3 hover:bg-gray-100 px-4 py-2 rounded-md transition-colors w-full text-left"
          >
            <svg
              className="w-5 h-5 text-[#0077B5]"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
            </svg>
            <span>Share on LinkedIn</span>
          </button>
          <button
            onClick={() => handleShare("copy")}
            className="flex items-center gap-3 hover:bg-gray-100 px-4 py-2 rounded-md transition-colors w-full text-left"
          >
            <FaLink className="text-gray-600 text-lg" />
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
