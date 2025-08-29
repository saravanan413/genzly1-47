
import React from 'react';
import { Grid, Bookmark } from 'lucide-react';

interface ProfileTabsProps {
  activeTab: 'posts' | 'saved';
  onTabChange: (tab: 'posts' | 'saved') => void;
}

const ProfileTabs: React.FC<ProfileTabsProps> = ({
  activeTab,
  onTabChange
}) => {
  return (
    <div className="border-t border-gray-200 mb-4 md:mb-6">
      <div className="flex justify-center space-x-6 md:space-x-8">
        <button 
          className={`flex items-center space-x-1 py-3 border-t-2 ${
            activeTab === 'posts' 
              ? 'border-black' 
              : 'border-transparent text-muted-foreground'
          }`}
          onClick={() => onTabChange('posts')}
        >
          <Grid size={14} className="md:w-4 md:h-4" />
          <span className="text-xs md:text-sm font-semibold">POSTS</span>
        </button>
        <button 
          className={`flex items-center space-x-1 py-3 border-t-2 ${
            activeTab === 'saved' 
              ? 'border-black' 
              : 'border-transparent text-muted-foreground'
          }`}
          onClick={() => onTabChange('saved')}
        >
          <Bookmark size={14} className="md:w-4 md:h-4" />
          <span className="text-xs md:text-sm">SAVED</span>
        </button>
      </div>
    </div>
  );
};

export default ProfileTabs;
