
export interface FollowData {
  followerId: string;
  followedId: string;
  timestamp: any;
  followerInfo: {
    uid: string;
    username: string;
    displayName: string;
    avatar?: string;
  };
  followedInfo: {
    uid: string;
    username: string;
    displayName: string;
    avatar?: string;
  };
}
