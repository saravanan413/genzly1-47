
import React from "react";
import { Image, Video } from "lucide-react";

interface SharedContentCardProps {
  content: {
    type: "post" | "reel" | string;
    meta?: any;
    postId?: number;
  };
  onClick?: (content: any) => void;
}

const PLACEHOLDER_IMAGE =
  "https://images.unsplash.com/photo-1518770660439-4636190af475?w=400&h=400&fit=crop";

const SharedContentCard: React.FC<SharedContentCardProps> = ({
  content,
  onClick,
}) => {
  if (!content) return null;

  if (content.type === "reel" || content.type === "post") {
    const meta = content.meta || {};

    let image, isReel = false;
    if (content.type === "post") {
      image = meta.image || PLACEHOLDER_IMAGE;
      isReel = false;
    } else if (content.type === "reel") {
      image = meta.thumbnail || meta.image || PLACEHOLDER_IMAGE;
      isReel = true;
    } else {
      image = PLACEHOLDER_IMAGE;
    }

    const owner = meta.owner || {};
    const avatar = owner.avatar || meta.avatar || PLACEHOLDER_IMAGE;
    const name = owner.name || meta.name || "Unknown";
    const username =
      owner.username || meta.username || (meta.ownerId ? `user${meta.ownerId}` : "");

    const isVerified = meta.isVerified || meta.verified || false;
    const caption =
      meta.caption && typeof meta.caption === "string" ? meta.caption : "";

    // Unlike before, now the MAIN preview is clickable
    return (
      <div
        className="relative bg-[#17181a] rounded-2xl shadow border border-gray-800 p-0 min-w-[250px] max-w-[340px] overflow-hidden flex"
        style={{ width: 320 }}
      >
        <div className="flex-1">
          {/* Owner info bar at top */}
          <div className="flex items-center gap-2 px-3 pt-3 pb-1">
            <div className="w-7 h-7 rounded-full bg-gradient-to-r from-purple-400 to-pink-400 p-0.5 flex-shrink-0">
              <img
                src={avatar}
                alt={name}
                className="w-full h-full rounded-full object-cover"
                draggable={false}
              />
            </div>
            <span className="font-semibold text-sm text-white leading-tight max-w-[120px] truncate">{username}</span>
            {isVerified && (
              <span className="ml-0.5">
                <svg width={16} height={16} viewBox="0 0 16 16" fill="none">
                  <circle cx="8" cy="8" r="8" fill="#3797F0"/>
                  <path d="M6.7 10.3l3.2-3.2-.8-.8-2.4 2.4-1-1-.8.8 1.8 1.8z" fill="#fff"/>
                </svg>
              </span>
            )}
          </div>
          {/* Image Preview (Reel or Post) */}
          <div
            className="relative aspect-[3/4] w-full bg-black flex items-center justify-center overflow-hidden transition ring-0 focus-visible:ring-2 focus-visible:ring-blue-400 cursor-pointer group hover:ring-2 hover:ring-blue-500"
            tabIndex={0}
            role="button"
            onClick={() => onClick?.(content)}
            onKeyPress={e => e.key === "Enter" && onClick?.(content)}
            aria-label={`Open shared ${content.type}`}
            style={{ borderRadius: "1.3rem" }}
          >
            <img
              src={image}
              alt="shared preview"
              className="object-cover w-full h-full"
              draggable={false}
              style={{ borderRadius: "1.3rem" }}
            />
            {/* Overlay play icon for reels */}
            {isReel && (
              <span className="absolute inset-0 flex items-center justify-center z-10">
                <Video className="w-16 h-16 text-white opacity-80 drop-shadow-xl" />
              </span>
            )}
            {!isReel && (
              <span className="absolute bottom-1 left-1.5 z-10 bg-black/60 rounded-full p-1.5">
                <Image className="w-6 h-6 text-white opacity-85" />
              </span>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent pointer-events-none"/>
          </div>
          {/* Caption below preview */}
          {caption && (
            <div className="px-3 pt-2 pb-3">
              <span className="block text-gray-200 text-xs line-clamp-2">{caption}</span>
            </div>
          )}
        </div>
        {/* Vertical action icons */}
        <div className="flex flex-col items-center gap-3 py-4 pr-3 pl-2">
          <button
            type="button"
            className="flex items-center justify-center p-0 w-8 h-8 rounded-full transition-colors hover:bg-white/10"
            style={{ background: "none" }}
            // prevent click from bubbling up
            onClick={e => { e.stopPropagation(); onClick?.(content); }}
            tabIndex={-1}
            aria-label="Open shared content"
          >
            {/* Share arrow icon */}
            <svg width="22" height="22" viewBox="0 0 24 24" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
          </button>
          <button
            type="button"
            className="flex items-center justify-center p-0 w-8 h-8 rounded-full transition-colors hover:bg-white/10"
            style={{ background: "none" }}
            // prevent click from bubbling up
            onClick={e => e.stopPropagation()}
            tabIndex={-1}
            aria-label="Bookmark"
          >
            {/* Bookmark icon */}
            <svg width="22" height="22" viewBox="0 0 24 24" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg>
          </button>
        </div>
      </div>
    );
  }

  // Fallback
  return (
    <div className="rounded-xl border bg-gray-900 text-gray-400 px-4 py-3 text-sm flex items-center gap-2 max-w-xs">
      <Image className="w-5 h-5 flex-shrink-0" />
      <span>Shared something</span>
    </div>
  );
};

export default SharedContentCard;

