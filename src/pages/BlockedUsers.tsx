
import React, { useState, useEffect } from 'react';
import { ArrowLeft, UserX } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { unblockUser } from '../services/privacy/privacyService';
import Layout from '../components/Layout';

interface BlockedUser {
  id: string;
  userId: string;
  username: string;
  displayName: string;
  avatar?: string;
  blockedAt: any;
}

const BlockedUsers: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [unblocking, setUnblocking] = useState<string | null>(null);

  useEffect(() => {
    if (!currentUser) {
      setLoading(false);
      return;
    }

    const unsubscribe = onSnapshot(
      collection(db, 'users', currentUser.uid, 'blockedUsers'),
      (snapshot) => {
        console.log('Blocked users snapshot received, docs:', snapshot.size);
        
        const blockedData = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            userId: data.userId || data.blockedUserId || doc.id,
            username: data.username || data.blockedUserInfo?.username || 'Unknown User',
            displayName: data.displayName || data.blockedUserInfo?.displayName || 'Unknown User',
            avatar: data.avatar || data.blockedUserInfo?.avatar,
            blockedAt: data.blockedAt || data.timestamp
          } as BlockedUser;
        });
        
        // Sort by blocked date (newest first)
        blockedData.sort((a, b) => {
          const aTime = a.blockedAt?.toMillis?.() || 0;
          const bTime = b.blockedAt?.toMillis?.() || 0;
          return bTime - aTime;
        });
        
        setBlockedUsers(blockedData);
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching blocked users:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [currentUser]);

  const handleUnblock = async (blockedUserId: string) => {
    if (!currentUser) return;

    setUnblocking(blockedUserId);
    try {
      const result = await unblockUser(currentUser.uid, blockedUserId);
      
      if (result.success) {
        toast({
          title: "User unblocked",
          description: result.message
        });
      } else {
        toast({
          title: "Error",
          description: result.message,
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error unblocking user:', error);
      toast({
        title: "Error",
        description: "Failed to unblock user. Please try again.",
        variant: "destructive"
      });
    } finally {
      setUnblocking(null);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen bg-background">
          <div className="sticky top-0 bg-background border-b border-border p-4 flex items-center">
            <button onClick={() => navigate('/settings')} className="mr-4">
              <ArrowLeft className="w-6 h-6" />
            </button>
            <h1 className="text-lg font-semibold">Blocked Accounts</h1>
          </div>
          <div className="p-4 space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center space-x-3 animate-pulse">
                <div className="w-12 h-12 bg-muted rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-muted rounded w-24 mb-2"></div>
                  <div className="h-3 bg-muted rounded w-32"></div>
                </div>
                <div className="w-20 h-8 bg-muted rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-background">
        <div className="sticky top-0 bg-background border-b border-border p-4 flex items-center">
          <button onClick={() => navigate('/settings')} className="mr-4">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-lg font-semibold">Blocked Accounts</h1>
        </div>

        <div className="p-4">
          {blockedUsers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <UserX className="w-16 h-16 text-muted-foreground mb-4" />
              <h2 className="text-xl font-semibold mb-2">No blocked users</h2>
              <p className="text-muted-foreground">Users you block will appear here.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {blockedUsers.map((blockedUser) => (
                <div key={blockedUser.id} className="flex items-center space-x-3 p-3 bg-card rounded-lg border border-border">
                  <div className="w-12 h-12 bg-muted rounded-full overflow-hidden">
                    {blockedUser.avatar ? (
                      <img
                        src={blockedUser.avatar}
                        alt={blockedUser.username}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src = '/placeholder.svg';
                        }}
                      />
                    ) : (
                      <div className="w-full h-full bg-muted flex items-center justify-center">
                        <UserX className="w-6 h-6 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold">{blockedUser.username}</h3>
                    <p className="text-sm text-muted-foreground">{blockedUser.displayName}</p>
                    {blockedUser.blockedAt && (
                      <p className="text-xs text-muted-foreground">
                        Blocked {blockedUser.blockedAt.toDate?.()?.toLocaleDateString() || 'recently'}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => handleUnblock(blockedUser.id)}
                    disabled={unblocking === blockedUser.id}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
                  >
                    {unblocking === blockedUser.id ? 'Unblocking...' : 'Unblock'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default BlockedUsers;
