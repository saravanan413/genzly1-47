import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { createChatId } from '../services/chat/chatService';
import { useChatMessages } from '../hooks/useChatMessages';
import { useChatUser } from '../hooks/useChatUser';
import { useChatActions } from '../hooks/useChatActions';
import ChatHeader from '../components/chat/ChatHeader';
import MessagesList from '../components/chat/MessagesList';
import MessageInput from '../components/chat/MessageInput';
import ShareEditModal from '../components/ShareEditModal';
import { SharedContent } from '../types/chat';

interface MediaUpload {
  type: 'image' | 'video' | 'audio' | 'file';
  url: string;
  name: string;
  file?: File;
}

interface ChatHeaderUser {
  name: string;
  avatar: string;
}

interface ShareEditModalContent {
  type: 'post' | 'reel' | 'profile' | 'image' | 'video';
  url?: string;
  caption?: string;
}

const IndividualChat = () => {
  const { userId: targetUserId } = useParams();
  const { currentUser } = useAuth();
  const [newMessage, setNewMessage] = useState('');
  const [shareModalContent, setShareModalContent] = useState<ShareEditModalContent | null>(null);
  
  const chatId = currentUser && targetUserId ? createChatId(currentUser.uid, targetUserId) : '';
  
  const { chatUser } = useChatUser(targetUserId || '');
  const { displayMessages, loading } = useChatMessages(chatId, targetUserId || '');
  
  const { 
    handleSendMessage, 
    handleSendMedia, 
    sendingMessage,
    sendError 
  } = useChatActions(targetUserId || '');

  const onSendMessage = async () => {
    if (!newMessage.trim()) return;
    
    const messageText = newMessage.trim();
    
    // Clear input IMMEDIATELY for instant UX
    setNewMessage('');
    
    // Send message - real-time listener will show it
    await handleSendMessage(messageText);
  };

  const onSendMedia = async (media: MediaUpload) => {
    await handleSendMedia(media);
  };

  const handleSharedContent = (content: SharedContent) => {
    // Convert SharedContent to ShareEditModalContent
    const modalContent: ShareEditModalContent = {
      type: content.type === 'post' ? 'post' : 
            content.type === 'reel' ? 'reel' :
            content.type === 'image' ? 'image' :
            content.type === 'video' ? 'video' : 'post', // fallback
      url: content.url || content.image || '',
      caption: content.caption || ''
    };
    setShareModalContent(modalContent);
  };

  const handleShareFromModal = async (editedContent: ShareEditModalContent) => {
    if (!editedContent) return;
    
    await handleSendMedia({
      type: editedContent.type === 'reel' ? 'video' : 'image',
      url: editedContent.url || '',
      name: `${editedContent.type}: ${editedContent.caption || 'Shared content'}`
    });
    setShareModalContent(null);
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Please log in to access chat</p>
      </div>
    );
  }

  if (!targetUserId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Invalid chat</p>
      </div>
    );
  }

  const getAvatarUrl = (avatar?: string, name?: string): string => {
    return avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'User')}&background=ccc&color=333`;
  };

  const headerUser: ChatHeaderUser = {
    name: chatUser?.displayName || chatUser?.username || 'User',
    avatar: getAvatarUrl(chatUser?.avatar, chatUser?.displayName || chatUser?.username)
  };

  return (
    <div className="flex flex-col h-screen bg-background dark:bg-gray-900">
      <ChatHeader 
        user={headerUser}
        isOnline={true} 
      />
      
      <MessagesList
        messages={displayMessages}
        typingUsers={[]}
        loading={loading}
        onSharedContent={handleSharedContent}
      />
      
      <MessageInput
        newMessage={newMessage}
        onMessageChange={setNewMessage}
        onSendMessage={onSendMessage}
        onSendMedia={onSendMedia}
        disabled={sendingMessage}
        error={sendError}
      />

      {shareModalContent && (
        <ShareEditModal
          isOpen={!!shareModalContent}
          onClose={() => setShareModalContent(null)}
          content={shareModalContent}
          onShare={handleShareFromModal}
        />
      )}
    </div>
  );
};

export default IndividualChat;
