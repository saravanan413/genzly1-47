
export interface ChatMessage {
  id: string;
  text: string;
  senderId: string;
  receiverId: string;
  timestamp: any;
  status: 'sending' | 'sent' | 'delivered' | 'seen';
  delivered: boolean;
  seen: boolean;
  type: 'text' | 'voice' | 'image' | 'video';
  mediaURL?: string;
}

export interface ChatPreview {
  chatId: string;
  otherUser: {
    id: string;
    username: string;
    displayName: string;
    avatar?: string;
  };
  lastMessage: {
    text: string;
    timestamp: any;
    senderId: string;
    seen: boolean;
  };
  unreadCount: number;
}
