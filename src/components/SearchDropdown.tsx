
import React from 'react';
import { UserProfile } from '../services/firestoreService';

interface SearchDropdownProps {
  isVisible: boolean;
  loading: boolean;
  users: UserProfile[];
  query: string;
  onUserClick: (userId: string) => void;
}

const SearchDropdown: React.FC<SearchDropdownProps> = ({
  isVisible,
  loading,
  users,
  query,
  onUserClick
}) => {
  if (!isVisible || !query.trim()) {
    return null;
  }

  return (
    <div className="absolute top-full left-0 right-0 mt-1 bg-background border border-border rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto">
      {loading ? (
        <div className="p-4 text-center text-muted-foreground">
          <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          Searching...
        </div>
      ) : users.length > 0 ? (
        <div className="py-2">
          {users.map((user) => (
            <button
              key={user.id}
              className="w-full px-4 py-3 hover:bg-muted text-left flex items-center space-x-3 transition-colors"
              onClick={() => onUserClick(user.id)}
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-400 to-pink-400 p-0.5 flex-shrink-0">
                {user.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.username}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full rounded-full bg-muted flex items-center justify-center">
                    <span className="text-xs font-medium text-muted-foreground">
                      {user.username ? user.username.charAt(0).toUpperCase() : '?'}
                    </span>
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {user.username}
                </p>
                {user.displayName && user.displayName !== user.username && (
                  <p className="text-xs text-muted-foreground truncate">
                    {user.displayName}
                  </p>
                )}
              </div>
            </button>
          ))}
        </div>
      ) : (
        <div className="p-4 text-center text-muted-foreground">
          <p className="text-sm">No users found</p>
        </div>
      )}
    </div>
  );
};

export default SearchDropdown;
