
import React, { useEffect, useRef, useState } from 'react';
import * as tf from '@tensorflow/tfjs';
import * as facemesh from '@tensorflow-models/facemesh';

interface ARFilterEngineProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  activeFilter: string;
  onModelReady: (isReady: boolean) => void;
}

interface FilterAsset {
  dogNose: HTMLImageElement;
  dogEars: HTMLImageElement;
}

export const ARFilterEngine: React.FC<ARFilterEngineProps> = ({
  videoRef,
  activeFilter,
  onModelReady
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [model, setModel] = useState<facemesh.FaceMesh | null>(null);
  const [assets, setAssets] = useState<FilterAsset | null>(null);
  const animationFrameRef = useRef<number>();

  useEffect(() => {
    initializeModel();
    loadAssets();
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (model && videoRef.current && assets) {
      startDetection();
    }
  }, [model, activeFilter, assets]);

  const initializeModel = async () => {
    try {
      await tf.ready();
      console.log('TensorFlow.js loaded');
      
      const faceMeshModel = await facemesh.load();
      setModel(faceMeshModel);
      onModelReady(true);
      console.log('FaceMesh model loaded');
    } catch (error) {
      console.error('Error loading face detection model:', error);
      onModelReady(false);
    }
  };

  const loadAssets = () => {
    const dogNose = new Image();
    const dogEars = new Image();
    
    dogNose.crossOrigin = 'anonymous';
    dogEars.crossOrigin = 'anonymous';
    
    dogNose.src = 'https://i.imgur.com/VJmA0Xh.png';
    dogEars.src = 'https://i.imgur.com/oQ7zLSr.png';
    
    Promise.all([
      new Promise((resolve) => { dogNose.onload = resolve; }),
      new Promise((resolve) => { dogEars.onload = resolve; })
    ]).then(() => {
      setAssets({ dogNose, dogEars });
      console.log('Filter assets loaded');
    }).catch(error => {
      console.error('Error loading filter assets:', error);
    });
  };

  const startDetection = async () => {
    if (!model || !videoRef.current || !canvasRef.current || !assets) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (!ctx) return;

    const detect = async () => {
      if (video.readyState === 4) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        try {
          // Fix: Pass video element directly, not as object with input property
          const predictions = await model.estimateFaces(video);
          
          // Clear canvas
          ctx.clearRect(0, 0, canvas.width, canvas.height);

          if (predictions.length > 0 && activeFilter === 'dog') {
            renderDogFilter(ctx, predictions[0], assets);
          }
        } catch (error) {
          console.error('Face detection error:', error);
        }
      }

      animationFrameRef.current = requestAnimationFrame(detect);
    };

    detect();
  };

  const renderDogFilter = (
    ctx: CanvasRenderingContext2D,
    face: any,
    assets: FilterAsset
  ) => {
    if (!face.scaledMesh) return;

    const keypoints = face.scaledMesh;
    
    // Key facial landmarks
    const noseTip = keypoints[4]; // nose tip
    const leftTemple = keypoints[127]; // approximate left temple
    const rightTemple = keypoints[356]; // approximate right temple
    
    // Calculate face dimensions for proper scaling
    const leftEye = keypoints[33];
    const rightEye = keypoints[263];
    const eyeDistance = Math.sqrt(
      Math.pow(rightEye[0] - leftEye[0], 2) + 
      Math.pow(rightEye[1] - leftEye[1], 2)
    );
    
    // Scale based on face size
    const noseSize = eyeDistance * 0.4;
    const earSize = eyeDistance * 0.6;
    
    // Draw dog nose
    ctx.drawImage(
      assets.dogNose,
      noseTip[0] - noseSize / 2,
      noseTip[1] - noseSize / 2,
      noseSize,
      noseSize
    );
    
    // Draw dog ears
    ctx.drawImage(
      assets.dogEars,
      leftTemple[0] - earSize / 2,
      leftTemple[1] - earSize * 1.2,
      earSize,
      earSize
    );
    
    ctx.drawImage(
      assets.dogEars,
      rightTemple[0] - earSize / 2,
      rightTemple[1] - earSize * 1.2,
      earSize,
      earSize
    );
  };

  if (activeFilter === 'normal') {
    return null;
  }

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full object-cover pointer-events-none z-10"
      style={{
        transform: videoRef.current?.style.transform || ''
      }}
    />
  );
};
