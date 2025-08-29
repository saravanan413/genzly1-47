
import React, { useState, useEffect } from "react";
import { X, Search } from "lucide-react";
import { collection, query, limit, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';
import { UserProfile } from '../services/firestoreService';
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";

interface DmShareSheetProps {
  isOpen: boolean;
  onClose: () => void;
  content: { 
    type: "post" | "reel" | "profile"; 
    meta?: Record<string, unknown>; 
    postId?: number 
  };
}

interface LocalChatMessage {
  id: string;
  type: string;
  sender: string;
  timestamp: string;
  seen: boolean;
  content: Record<string, unknown>;
}

function sendDmShare(userIds: string[], content: Record<string, unknown>): void {
  userIds.forEach((uid) => {
    let msgs: LocalChatMessage[] = [];
    try {
      const storedMsgs = localStorage.getItem(`chat_${uid}`);
      msgs = storedMsgs ? JSON.parse(storedMsgs) : [];
    } catch {
      // If parsing fails, start with empty array
    }
    
    const newMessage: LocalChatMessage = {
      id: Date.now().toString(),
      type: "shared",
      sender: "me",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      seen: false,
      content,
    };
    
    msgs.push(newMessage);
    localStorage.setItem(`chat_${uid}`, JSON.stringify(msgs));
  });
}

const DmShareSheet: React.FC<DmShareSheetProps> = ({ isOpen, onClose, content }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
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
    } catch (error) {
      // Silent error handling - users array remains empty
    }
    setLoading(false);
  };

  if (!isOpen) return null;

  const filtered = users.filter(
    u =>
      (u.displayName && u.displayName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (u.username && u.username.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleSelect = (id: string, checked: boolean) => {
    setSelected((prev) => checked ? [...prev, id] : prev.filter(x => x !== id));
  };

  const handleSend = () => {
    sendDmShare(selected, content);
    setSelected([]);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-background rounded-2xl w-full max-w-md shadow flex flex-col max-h-[80vh] animate-slide-in-bottom">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-semibold">Share</h2>
          <button className="p-1 hover:bg-muted rounded-full" onClick={onClose}><X size={20} /></button>
        </div>
        <div className="p-4 border-b border-border">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-muted rounded-lg border-0 focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map(u => (
                <div key={u.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <Checkbox
                      checked={selected.includes(u.id)}
                      onCheckedChange={checked => handleSelect(u.id, checked as boolean)}
                    />
                    <div className="w-11 h-11 rounded-full bg-gradient-to-r from-purple-400 to-pink-400 p-0.5">
                      {u.avatar ? (
                        <img src={u.avatar} alt={u.displayName || u.username} className="w-full h-full rounded-full object-cover" />
                      ) : (
                        <div className="w-full h-full rounded-full bg-muted flex items-center justify-center">
                          <span className="text-sm font-medium text-muted-foreground">
                            {u.username ? u.username.charAt(0).toUpperCase() : '?'}
                          </span>
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="font-medium text-sm">{u.displayName || u.username}</div>
                      <div className="text-xs text-muted-foreground">@{u.username}</div>
                    </div>
                  </div>
                </div>
              ))}
              {filtered.length === 0 && !loading && <div className="text-xs text-muted-foreground py-8 text-center">No users found.</div>}
            </div>
          )}
        </div>
        {selected.length > 0 && (
          <div className="p-4 border-t border-border">
            <Button className="w-full" onClick={handleSend}>Send to {selected.length} {selected.length === 1 ? "person" : "people"}</Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default DmShareSheet;
