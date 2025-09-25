import { Wifi, WifiOff, Signal, AlertTriangle, Smartphone } from 'lucide-react';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { Badge } from './badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './tooltip';

interface NetworkStatusIndicatorProps {
  showDetails?: boolean;
  className?: string;
}

export const NetworkStatusIndicator = ({ showDetails = false, className = "" }: NetworkStatusIndicatorProps) => {
  const { networkInfo, formatConnectionSpeed, getConnectionStatus } = useNetworkStatus();
  const status = getConnectionStatus();

  const getStatusColor = () => {
    switch (status) {
      case 'excellent': return 'bg-green-500';
      case 'good': return 'bg-blue-500';
      case 'fair': return 'bg-yellow-500';
      case 'poor': return 'bg-orange-500';
      case 'offline': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusIcon = () => {
    if (!networkInfo.isOnline) return <WifiOff className="h-4 w-4" />;
    
    switch (status) {
      case 'excellent':
      case 'good': return <Wifi className="h-4 w-4" />;
      case 'fair': return <Signal className="h-4 w-4" />;
      case 'poor': return <AlertTriangle className="h-4 w-4" />;
      default: return <Signal className="h-4 w-4" />;
    }
  };

  const getStatusText = () => {
    if (!networkInfo.isOnline) return 'Offline';
    
    switch (status) {
      case 'excellent': return 'Excellent';
      case 'good': return 'Good';
      case 'fair': return 'Fair';
      case 'poor': return 'Poor';
      default: return 'Unknown';
    }
  };

  const getDetailedInfo = () => {
    const { connectionType, effectiveType, isMeteredConnection, downlink } = networkInfo;
    
    return (
      <div className="space-y-1 text-sm">
        <div>Status: {getStatusText()}</div>
        <div>Speed: {formatConnectionSpeed()}</div>
        <div>Type: {connectionType}</div>
        {effectiveType !== 'unknown' && <div>Quality: {effectiveType}</div>}
        {isMeteredConnection && (
          <div className="flex items-center gap-1 text-orange-600">
            <Smartphone className="h-3 w-3" />
            <span>Metered Connection</span>
          </div>
        )}
      </div>
    );
  };

  if (!showDetails) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className={`flex items-center gap-1 ${className}`}>
              <div className={`w-2 h-2 rounded-full ${getStatusColor()}`} />
            </div>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            {getDetailedInfo()}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <Badge variant="outline" className={`flex items-center gap-2 ${className}`}>
      {getStatusIcon()}
      <span>{getStatusText()}</span>
      {networkInfo.isMeteredConnection && <Smartphone className="h-3 w-3 text-orange-500" />}
    </Badge>
  );
};