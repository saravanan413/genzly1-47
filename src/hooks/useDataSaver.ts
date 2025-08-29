
import { useState, useEffect, createContext, useContext } from 'react';

interface DataSaverContextType {
  dataSaverEnabled: boolean;
  setDataSaverEnabled: (enabled: boolean) => void;
  shouldLoadImage: (imageSize?: 'small' | 'medium' | 'large') => boolean;
  getImageQuality: () => number;
}

const DataSaverContext = createContext<DataSaverContextType | undefined>(undefined);

export const useDataSaver = () => {
  const context = useContext(DataSaverContext);
  if (!context) {
    // Fallback for when context is not available
    const [dataSaverEnabled, setDataSaverEnabled] = useState(() => {
      return localStorage.getItem('dataSaverEnabled') === 'true';
    });

    const shouldLoadImage = (imageSize?: 'small' | 'medium' | 'large') => {
      if (!dataSaverEnabled) return true;
      return imageSize === 'small';
    };

    const getImageQuality = () => dataSaverEnabled ? 60 : 80;

    return {
      dataSaverEnabled,
      setDataSaverEnabled: (enabled: boolean) => {
        setDataSaverEnabled(enabled);
        localStorage.setItem('dataSaverEnabled', enabled.toString());
      },
      shouldLoadImage,
      getImageQuality,
    };
  }
  return context;
};

export { DataSaverContext };
