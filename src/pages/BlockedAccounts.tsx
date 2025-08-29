import React, { useState, useEffect } from 'react';
import { ArrowLeft, UserX } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { collection, onSnapshot, doc, deleteDoc } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface BlockedUser {
  id: string;
  userId: string;
  username: string;
  displayName: string;
  avatar?: string;
  blockedAt: any;
}

const BlockedAccounts: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) return;

    const unsubscribe = onSnapshot(
      collection(db, 'users', currentUser.uid, 'blockedUsers'),
      async (snapshot) => {
        const blockedData = await Promise.all(
          snapshot.docs.map(async (docSnap) => {
            const data = docSnap.data();
            return {
              id: docSnap.id,
              userId: data.userId || docSnap.id,
              username: data.username || 'Unknown User',
              displayName: data.displayName || 'Unknown User',
              avatar: data.avatar,
              blockedAt: data.blockedAt
            } as BlockedUser;
          })
        );
        
        setBlockedUsers(blockedData.sort((a, b) => b.blockedAt?.toDate() - a.blockedAt?.toDate()));
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

    try {
      await deleteDoc(doc(db, 'users', currentUser.uid, 'blockedUsers', blockedUserId));
      toast({
        title: "User unblocked",
        description: "User has been removed from your blocked list"
      });
    } catch (error) {
      console.error('Error unblocking user:', error);
      toast({
        title: "Error",
        description: "Failed to unblock user",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
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
    );
  }

  return (
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
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
                >
                  Unblock
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default BlockedAccounts;