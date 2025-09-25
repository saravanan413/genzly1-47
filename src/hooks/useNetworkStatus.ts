import { useState, useEffect } from 'react';

export interface NetworkInfo {
  isOnline: boolean;
  connectionType: 'wifi' | 'cellular' | 'ethernet' | 'unknown';
  effectiveType: 'slow-2g' | '2g' | '3g' | '4g' | 'unknown';
  downlink: number;
  rtt: number;
  saveData: boolean;
  isSlowConnection: boolean;
  isMeteredConnection: boolean;
}

export interface UploadEstimate {
  estimatedTimeSeconds: number;
  recommendProceed: boolean;
  warningMessage?: string;
  dataUsageMB: number;
}

export const useNetworkStatus = () => {
  const [networkInfo, setNetworkInfo] = useState<NetworkInfo>({
    isOnline: navigator.onLine,
    connectionType: 'unknown',
    effectiveType: 'unknown',
    downlink: 0,
    rtt: 0,
    saveData: false,
    isSlowConnection: false,
    isMeteredConnection: false,
  });

  const updateNetworkInfo = () => {
    const connection = (navigator as any).connection || 
                      (navigator as any).mozConnection || 
                      (navigator as any).webkitConnection;
    
    const isOnline = navigator.onLine;
    let connectionType: NetworkInfo['connectionType'] = 'unknown';
    let effectiveType: NetworkInfo['effectiveType'] = 'unknown';
    let downlink = 0;
    let rtt = 0;
    let saveData = false;

    if (connection) {
      // Map connection type
      if (connection.type === 'wifi') connectionType = 'wifi';
      else if (connection.type === 'cellular') connectionType = 'cellular';
      else if (connection.type === 'ethernet') connectionType = 'ethernet';
      
      // Get effective connection type
      if (connection.effectiveType) {
        effectiveType = connection.effectiveType;
      }
      
      downlink = connection.downlink || 0;
      rtt = connection.rtt || 0;
      saveData = connection.saveData || false;
    }

    const isSlowConnection = effectiveType === 'slow-2g' || effectiveType === '2g' || 
                            (downlink > 0 && downlink < 1);
    const isMeteredConnection = connectionType === 'cellular' || saveData;

    setNetworkInfo({
      isOnline,
      connectionType,
      effectiveType,
      downlink,
      rtt,
      saveData,
      isSlowConnection,
      isMeteredConnection,
    });
  };

  useEffect(() => {
    updateNetworkInfo();

    const handleOnline = () => updateNetworkInfo();
    const handleOffline = () => updateNetworkInfo();
    const handleConnectionChange = () => updateNetworkInfo();

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const connection = (navigator as any).connection;
    if (connection) {
      connection.addEventListener('change', handleConnectionChange);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (connection) {
        connection.removeEventListener('change', handleConnectionChange);
      }
    };
  }, []);

  const estimateUpload = (fileSizeMB: number): UploadEstimate => {
    const { downlink, isSlowConnection, isMeteredConnection, effectiveType } = networkInfo;
    
    // Estimate speed in Mbps (conservative estimates)
    let speedMbps = downlink;
    if (speedMbps <= 0) {
      // Fallback estimates based on connection type
      switch (effectiveType) {
        case 'slow-2g': speedMbps = 0.05; break;
        case '2g': speedMbps = 0.1; break;
        case '3g': speedMbps = 1; break;
        case '4g': speedMbps = 10; break;
        default: speedMbps = 2; break;
      }
    }

    // Convert to MB/s (account for upload being typically slower than download)
    const uploadSpeedMBps = (speedMbps * 0.125) * 0.6; // 60% of download speed
    const estimatedTimeSeconds = fileSizeMB / uploadSpeedMBps;

    let warningMessage: string | undefined;
    let recommendProceed = true;

    if (isSlowConnection) {
      warningMessage = `Slow connection detected. Upload may take ${Math.ceil(estimatedTimeSeconds / 60)} minutes.`;
      recommendProceed = fileSizeMB < 5; // Only recommend small files on slow connections
    } else if (isMeteredConnection && fileSizeMB > 10) {
      warningMessage = `You're on a metered connection. This upload will use ${fileSizeMB.toFixed(1)}MB of data.`;
    } else if (estimatedTimeSeconds > 300) { // More than 5 minutes
      warningMessage = `Large file upload. Estimated time: ${Math.ceil(estimatedTimeSeconds / 60)} minutes.`;
    }

    return {
      estimatedTimeSeconds,
      recommendProceed,
      warningMessage,
      dataUsageMB: fileSizeMB,
    };
  };

  const formatConnectionSpeed = (): string => {
    const { downlink, effectiveType } = networkInfo;
    if (downlink > 0) {
      return `${downlink.toFixed(1)} Mbps`;
    }
    switch (effectiveType) {
      case 'slow-2g': return 'Very Slow';
      case '2g': return 'Slow';
      case '3g': return 'Moderate';
      case '4g': return 'Fast';
      default: return 'Unknown';
    }
  };

  const getConnectionStatus = (): 'excellent' | 'good' | 'fair' | 'poor' | 'offline' => {
    if (!networkInfo.isOnline) return 'offline';
    
    const { downlink, effectiveType } = networkInfo;
    if (downlink >= 10 || effectiveType === '4g') return 'excellent';
    if (downlink >= 5 || effectiveType === '3g') return 'good';
    if (downlink >= 1 || effectiveType === '2g') return 'fair';
    return 'poor';
  };

  return {
    networkInfo,
    estimateUpload,
    formatConnectionSpeed,
    getConnectionStatus,
    refreshNetworkInfo: updateNetworkInfo,
  };
};