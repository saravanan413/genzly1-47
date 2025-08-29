
interface PullToRefreshProps {
  pullDistance: number;
  refreshing: boolean;
}

const PullToRefresh = ({ pullDistance, refreshing }: PullToRefreshProps) => {
  if (pullDistance === 0 && !refreshing) return null;

  return (
    <div 
      className="flex items-center justify-center py-4 text-muted-foreground"
      style={{ 
        opacity: Math.min(1, pullDistance / 80),
        transform: `translateY(-${Math.max(0, 40 - pullDistance)}px)`
      }}
    >
      <div className={`w-6 h-6 border-2 border-primary border-t-transparent rounded-full ${refreshing ? 'animate-spin' : ''}`} />
      <span className="ml-2">
        {refreshing ? 'Refreshing...' : pullDistance > 80 ? 'Release to refresh' : 'Pull to refresh'}
      </span>
    </div>
  );
};

export default PullToRefresh;
