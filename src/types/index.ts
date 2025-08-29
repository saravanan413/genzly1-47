
export interface Post {
  id: string;
  userId: string;
  username: string;
  userAvatar?: string;
  mediaURL: string;
  mediaType: 'image' | 'video';
  caption: string;
  timestamp: any;
  likes: string[];
  likeCount: number;
  comments: Comment[];
  commentCount: number;
  location?: string;
  category?: string;
  user: {
    username: string;
    displayName: string;
    avatar?: string;
  };
}

export interface Comment {
  id: string;
  userId: string;
  username: string;
  text: string;
  timestamp: Date;
}

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
  userId?: string;
  username?: string;
  userAvatar?: string;
  videoURL?: string;
  timestamp?: any;
  likeCount?: number;
  commentCount?: number;
  isFollowing?: boolean;
}
