
import React from 'react';
import { Grid, Bookmark } from 'lucide-react';

const UserProfileTabs: React.FC = () => {
  return (
    <div className="border-t border-gray-200 mb-4 md:mb-6">
      <div className="flex justify-center space-x-6 md:space-x-8">
        <button className="flex items-center space-x-1 py-3 border-t-2 border-black">
          <Grid size={14} className="md:w-4 md:h-4" />
          <span className="text-xs md:text-sm font-semibold">POSTS</span>
        </button>
        <button className="flex items-center space-x-1 py-3 text-muted-foreground">
          <Bookmark size={14} className="md:w-4 md:h-4" />
          <span className="text-xs md:text-sm">SAVED</span>
        </button>
      </div>
    </div>
  );
};

export default UserProfileTabs;
