
import React from "react";

interface ProfileShareCardProps {
  username: string;
  name: string;
  avatar?: string;
  onClick?: () => void;
}

const ProfileShareCard: React.FC<ProfileShareCardProps> = ({
  username,
  name,
  avatar,
  onClick,
}) => {
  return (
    <div
      onClick={onClick}
      className="flex items-center rounded-xl bg-blue-50 cursor-pointer px-3 py-3 shadow border border-blue-200 transition hover:bg-blue-100 min-w-[220px] max-w-xs"
    >
      <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-r from-purple-400 to-pink-400 p-0.5 mr-3">
        {avatar ? (
          <img
            src={avatar}
            alt={name}
            className="w-full h-full object-cover rounded-full"
          />
        ) : (
          <div className="w-full h-full rounded-full bg-gray-300 flex items-center justify-center">
            <span className="text-gray-700 font-medium">
              {name?.charAt(0).toUpperCase() || "?"}
            </span>
          </div>
        )}
      </div>
      <div className="flex flex-col min-w-0">
        <span className="font-semibold truncate">{name}</span>
        <span className="text-xs text-blue-600 truncate">@{username}</span>
        <span className="text-xs text-blue-400 font-medium">Profile</span>
      </div>
    </div>
  );
};

export default ProfileShareCard;
