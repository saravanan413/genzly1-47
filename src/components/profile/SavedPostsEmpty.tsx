
import React from 'react';
import { Bookmark } from 'lucide-react';

const SavedPostsEmpty: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
      <Bookmark size={44} className="mb-3 opacity-40" />
      <span className="text-md md:text-lg font-semibold mb-2">Saved Posts</span>
      <span className="text-xs md:text-sm text-center">Posts you save will appear here.<br />You haven't saved any posts yet.</span>
    </div>
  );
};

export default SavedPostsEmpty;
