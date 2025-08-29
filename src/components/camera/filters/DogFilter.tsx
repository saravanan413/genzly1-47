
import React from 'react';

interface DogFilterProps {
  landmarks: any[];
  canvasWidth: number;
  canvasHeight: number;
}

export const DogFilter: React.FC<DogFilterProps> = ({
  landmarks,
  canvasWidth,
  canvasHeight
}) => {
  // This component is now handled by FilterManager
  return null;
};
