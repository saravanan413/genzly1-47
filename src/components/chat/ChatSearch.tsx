
import React from 'react';
import { Search } from 'lucide-react';

interface ChatSearchProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

const ChatSearch: React.FC<ChatSearchProps> = ({ searchQuery, onSearchChange }) => {
  return (
    <div className="relative mb-6">
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500" size={20} />
      <input
        type="text"
        placeholder="Search messages..."
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        className="w-full pl-10 pr-4 py-3 bg-gray-100 dark:bg-gray-800 text-foreground dark:text-white placeholder-gray-500 dark:placeholder-gray-400 rounded-xl border-0 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-200"
      />
    </div>
  );
};

export default ChatSearch;
