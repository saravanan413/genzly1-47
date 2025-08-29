
export interface ReelUser {
  name: string;
  avatar: string;
  isFollowing: boolean;
}

export interface Reel {
  id: number;
  user: ReelUser;
  videoUrl: string;
  videoThumbnail: string;
  caption: string;
  likes: number;
  comments: number;
  shares: number;
  music: string;
  isLiked: boolean;
  isSaved: boolean;
}
