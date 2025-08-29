
import React, { useState, useEffect } from 'react';
import { ArrowLeft, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { collection, query, limit, getDocs } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { UserProfile } from '../../services/firestoreService';
import { useAuth } from '../../contexts/AuthContext';
import { logger } from '../../utils/logger';

interface ShareToFollowersProps {
  media: { type: 'image' | 'video', data: string, file: File };
  onBack: () => void;
  onShare: (selectedUsers: string[], caption: string) => void;
  loading?: boolean;
}

const ShareToFollowers: React.FC<ShareToFollowersProps> = ({ 
  media, 
  onBack, 
  onShare, 
  loading = false 
}) => {
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [caption, setCaption] = useState('');
  const [followers, setFollowers] = useState<UserProfile[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const { currentUser } = useAuth();

  useEffect(() => {
    fetchFollowers();
  }, []);

  const fetchFollowers = async () => {
    setLoadingUsers(true);
    try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, limit(50));
      const snapshot = await getDocs(q);
      const usersData = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(user => user.id !== currentUser?.uid) as UserProfile[];
      setFollowers(usersData);
      logger.debug('Fetched followers for sharing', { count: usersData.length });
    } catch (error) {
      logger.error('Failed to fetch followers', error);
    }
    setLoadingUsers(false);
  };

  const handleUserSelect = (userId: string, checked: boolean) => {
    if (checked) {
      setSelectedUsers(prev => [...prev, userId]);
    } else {
      setSelectedUsers(prev => prev.filter(id => id !== userId));
    }
  };

  const handleShare = () => {
    if (selectedUsers.length === 0) return;
    onShare(selectedUsers, caption);
  };

  return (
    <div className="fixed inset-0 bg-background z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft size={24} />
        </Button>
        <h1 className="text-lg font-semibold">Share to</h1>
        <div className="w-10" />
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4">
          {/* Media Preview */}
          <div className="mb-4 rounded-lg overflow-hidden bg-muted max-w-[200px] mx-auto">
            {media.type === 'image' ? (
              <img 
                src={media.data} 
                alt="Preview" 
                className="w-full h-auto object-cover"
              />
            ) : (
              <video 
                src={media.data} 
                className="w-full h-auto object-cover"
                muted
              />
            )}
          </div>

          {/* Caption Input */}
          <div className="mb-6">
            <Textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Add a caption..."
              className="min-h-[80px] resize-none"
              maxLength={280}
            />
            <div className="text-right text-sm text-muted-foreground mt-1">
              {caption.length}/280
            </div>
          </div>

          {/* Users List */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-muted-foreground">Send to:</h3>
            
            {loadingUsers ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              </div>
            ) : (
              followers.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50"
                >
                  <div className="flex items-center space-x-3">
                    <Checkbox
                      checked={selectedUsers.includes(user.id)}
                      onCheckedChange={(checked) => handleUserSelect(user.id, checked as boolean)}
                    />
                    <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-400 to-pink-400 p-0.5">
                      {user.avatar ? (
                        <img
                          src={user.avatar}
                          alt={user.displayName || user.username || 'User'}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full rounded-full bg-muted flex items-center justify-center">
                          <span className="text-muted-foreground font-medium">
                            {user.username ? user.username.charAt(0).toUpperCase() : '?'}
                          </span>
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{user.displayName || user.username || 'Unknown User'}</p>
                      <p className="text-xs text-muted-foreground">
                        @{user.username}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Send Button */}
      {selectedUsers.length > 0 && (
        <div className="p-4 border-t bg-background">
          <Button
            onClick={handleShare}
            disabled={loading || selectedUsers.length === 0}
            className="w-full"
            size="lg"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full w-4 h-4 border-b-2 border-white mr-2"></div>
                Sending...
              </>
            ) : (
              <>
                <Send size={18} className="mr-2" />
                Send to {selectedUsers.length} {selectedUsers.length === 1 ? 'person' : 'people'}
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
};

export default ShareToFollowers;
