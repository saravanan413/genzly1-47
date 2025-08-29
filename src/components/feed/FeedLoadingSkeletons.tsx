
import { Skeleton } from '@/components/ui/skeleton';

const FeedLoadingSkeletons = () => {
  return (
    <div className="space-y-8">
      {Array.from({ length: 3 }).map((_, index) => (
        <div key={index} className="bg-card dark:bg-card border dark:border-border rounded-2xl shadow-sm overflow-hidden w-full">
          <div className="p-4 flex items-center space-x-3 border-b border-gray-100 dark:border-border">
            <Skeleton className="w-12 h-12 rounded-full" />
            <Skeleton className="w-32 h-4" />
          </div>
          <Skeleton className="w-full aspect-square" />
          <div className="p-5 space-y-3">
            <Skeleton className="w-24 h-4" />
            <Skeleton className="w-full h-4" />
            <Skeleton className="w-3/4 h-4" />
          </div>
        </div>
      ))}
    </div>
  );
};

export default FeedLoadingSkeletons;
