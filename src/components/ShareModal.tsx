
import React, { useState, useEffect } from 'react';
import { X, Search } from 'lucide-react';
import { collection, query, limit, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';
import { UserProfile } from '../services/firestoreService';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { logger } from '../utils/logger';

interface ShareContent {
  type: string; 
  meta?: Record<string, unknown>; 
  postId?: number;
}

interface LocalChatMessage {
  id: string;
  type: string;
  sender: string;
  timestamp: string;
  seen: boolean;
  content: ShareContent;
}

function sendSharedMessageToChat(
  userIds: string[],
  content: ShareContent
) {
  try {
    userIds.forEach(uid => {
      let msgs: LocalChatMessage[] = [];
      try {
        const storedMsgs = localStorage.getItem(`chat_${uid}`);
        msgs = storedMsgs ? JSON.parse(storedMsgs) : [];
      } catch (parseError) {
        logger.warn('Failed to parse stored messages', { uid, error: parseError });
      }
      
      const newMessage: LocalChatMessage = {
        id: Date.now().toString(),
        type: 'shared',
        sender: 'me',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        seen: false,
        content,
      };
      
      msgs.push(newMessage);
      localStorage.setItem(`chat_${uid}`, JSON.stringify(msgs));
    });
  } catch (error) {
    logger.error('Failed to send shared message to chat', error);
  }
}

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  postId?: number;
  type?: string;
  meta?: Record<string, unknown>;
}

const ShareModal: React.FC<ShareModalProps> = ({ isOpen, onClose, postId, type = "post", meta }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchUsers();
    }
  }, [isOpen]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, limit(20));
      const snapshot = await getDocs(q);
      const usersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as UserProfile[];
      setUsers(usersData);
      logger.debug('Fetched users for sharing', { userCount: usersData.length });
    } catch (error) {
      logger.error('Failed to fetch users', error);
    }
    setLoading(false);
  };

  if (!isOpen) return null;

  const handleUserSelect = (userId: string, checked: boolean) => {
    if (checked) {
      setSelectedUsers(prev => [...prev, userId]);
    } else {
      setSelectedUsers(prev => prev.filter(id => id !== userId));
    }
  };

  const handleSendToSelected = () => {
    if (selectedUsers.length === 0) return;

    const shareContent: ShareContent = { 
      type: type || 'post',
      postId,
      meta: { ...meta, id: postId }
    };
    
    sendSharedMessageToChat(selectedUsers, shareContent);

    onClose();
    setSelectedUsers([]);
  };

  const filteredFollowers = users.filter(user => {
    const name = user.displayName || '';
    const username = user.username || '';
    const searchLower = searchTerm.toLowerCase();

    return name.toLowerCase().includes(searchLower) ||
           username.toLowerCase().includes(searchLower);
  });

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fade-in p-4">
      <div className="bg-background rounded-2xl w-full max-w-md max-h-[80vh] flex flex-col animate-slide-in-bottom">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-semibold">Share</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-muted rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-border">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-muted rounded-lg border-0 focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </div>

        {/* Followers List */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-4">
            <h3 className="text-sm font-medium text-muted-foreground mb-3">Following</h3>
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredFollowers.map((follower) => (
                  <div
                    key={follower.id}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center space-x-3 flex-1">
                      <Checkbox
                        checked={selectedUsers.includes(follower.id)}
                        onCheckedChange={(checked) => handleUserSelect(follower.id, checked as boolean)}
                      />
                      <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-400 to-pink-400 p-0.5">
                        {follower.avatar ? (
                          <img
                            src={follower.avatar}
                            alt={follower.displayName || follower.username || 'User'}
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full rounded-full bg-muted flex items-center justify-center">
                            <span className="text-muted-foreground font-medium">
                              {follower.username ? follower.username.charAt(0).toUpperCase() : '?'}
                            </span>
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{follower.displayName || follower.username || 'Unknown User'}</p>
                        <p className="text-xs text-muted-foreground">
                          @{follower.username}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Bottom Send Button */}
        {selectedUsers.length > 0 && (
          <div className="p-4 border-t border-border bg-background rounded-b-2xl">
            <Button
              onClick={handleSendToSelected}
              className="w-full"
              disabled={selectedUsers.length === 0}
            >
              Send to {selectedUsers.length} {selectedUsers.length === 1 ? 'person' : 'people'}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ShareModal;
