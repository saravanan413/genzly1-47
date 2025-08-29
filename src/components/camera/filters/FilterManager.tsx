
import React, { useEffect, useRef, useState } from 'react';
import * as tf from '@tensorflow/tfjs';
import * as facemesh from '@tensorflow-models/facemesh';

interface FilterManagerProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  activeFilter: string;
  onFilterReady: (isReady: boolean) => void;
}

export const FilterManager: React.FC<FilterManagerProps> = ({
  videoRef,
  activeFilter,
  onFilterReady
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [model, setModel] = useState<facemesh.FaceMesh | null>(null);
  const animationFrameRef = useRef<number>();
  const [isModelLoaded, setIsModelLoaded] = useState(false);

  useEffect(() => {
    initializeModel();
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (model && videoRef.current && isModelLoaded) {
      startDetection();
    }
  }, [model, activeFilter, isModelLoaded]);

  const initializeModel = async () => {
    try {
      await tf.ready();
      const faceMeshModel = await facemesh.load();
      setModel(faceMeshModel);
      setIsModelLoaded(true);
      onFilterReady(true);
    } catch (error) {
      console.error('Error loading face detection model:', error);
      onFilterReady(false);
    }
  };

  const startDetection = async () => {
    if (!model || !videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (!ctx) return;

    const detect = async () => {
      if (video.readyState === 4) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        try {
          const predictions = await model.estimateFaces(video);
          
          // Clear canvas
          ctx.clearRect(0, 0, canvas.width, canvas.height);

          if (predictions.length > 0 && activeFilter !== 'normal') {
            // Draw filter based on active filter
            renderFilter(ctx, predictions[0], canvas.width, canvas.height);
          }
        } catch (error) {
          console.error('Face detection error:', error);
        }
      }

      animationFrameRef.current = requestAnimationFrame(detect);
    };

    detect();
  };

  const renderFilter = (
    ctx: CanvasRenderingContext2D,
    face: any,
    width: number,
    height: number
  ) => {
    switch (activeFilter) {
      case 'dog':
        renderDogFilter(ctx, face);
        break;
      case 'cat':
        renderCatFilter(ctx, face);
        break;
      case 'glasses':
        renderGlassesFilter(ctx, face);
        break;
      case 'heart':
        renderHeartFilter(ctx, face);
        break;
      case 'sparkles':
        renderSparklesFilter(ctx, face);
        break;
      case 'rainbow':
        renderRainbowFilter(ctx, face, width, height);
        break;
      default:
        break;
    }
  };

  const renderDogFilter = (ctx: CanvasRenderingContext2D, face: any) => {
    if (!face.scaledMesh) return;

    const keypoints = face.scaledMesh;
    const noseTip = keypoints[1];
    const leftEye = keypoints[33];
    const rightEye = keypoints[263];
    const forehead = keypoints[9];
    
    const eyeDistance = Math.sqrt(
      Math.pow(rightEye[0] - leftEye[0], 2) + 
      Math.pow(rightEye[1] - leftEye[1], 2)
    );
    
    const faceWidth = eyeDistance * 2.5;

    // Draw dog ears
    drawDogEars(ctx, leftEye, rightEye, forehead, faceWidth);
    
    // Draw dog nose
    drawDogNose(ctx, noseTip, faceWidth * 0.12);
    
    // Draw animated tongue
    drawDogTongue(ctx, noseTip, faceWidth * 0.08);
  };

  const renderCatFilter = (ctx: CanvasRenderingContext2D, face: any) => {
    if (!face.scaledMesh) return;

    const keypoints = face.scaledMesh;
    const noseTip = keypoints[1];
    const leftEye = keypoints[33];
    const rightEye = keypoints[263];
    const forehead = keypoints[9];
    
    const eyeDistance = Math.sqrt(
      Math.pow(rightEye[0] - leftEye[0], 2) + 
      Math.pow(rightEye[1] - leftEye[1], 2)
    );
    
    const faceWidth = eyeDistance * 2.5;

    // Draw cat ears
    ctx.fillStyle = '#FF8C00';
    const earSize = faceWidth * 0.3;
    
    // Left ear
    ctx.beginPath();
    ctx.moveTo(leftEye[0] - faceWidth * 0.25, forehead[1] - faceWidth * 0.3);
    ctx.lineTo(leftEye[0] - faceWidth * 0.05, forehead[1] - faceWidth * 0.7);
    ctx.lineTo(leftEye[0] + faceWidth * 0.15, forehead[1] - faceWidth * 0.3);
    ctx.fill();

    // Right ear
    ctx.beginPath();
    ctx.moveTo(rightEye[0] - faceWidth * 0.15, forehead[1] - faceWidth * 0.3);
    ctx.lineTo(rightEye[0] + faceWidth * 0.05, forehead[1] - faceWidth * 0.7);
    ctx.lineTo(rightEye[0] + faceWidth * 0.25, forehead[1] - faceWidth * 0.3);
    ctx.fill();

    // Draw cat nose
    ctx.fillStyle = '#FF69B4';
    ctx.beginPath();
    ctx.moveTo(noseTip[0], noseTip[1] - faceWidth * 0.04);
    ctx.lineTo(noseTip[0] - faceWidth * 0.035, noseTip[1] + faceWidth * 0.015);
    ctx.lineTo(noseTip[0] + faceWidth * 0.035, noseTip[1] + faceWidth * 0.015);
    ctx.fill();

    // Draw whiskers
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    for (let i = 0; i < 3; i++) {
      const offset = (i - 1) * faceWidth * 0.08;
      // Left whiskers
      ctx.beginPath();
      ctx.moveTo(noseTip[0] - faceWidth * 0.15, noseTip[1] + offset);
      ctx.lineTo(noseTip[0] - faceWidth * 0.4, noseTip[1] + offset);
      ctx.stroke();
      
      // Right whiskers
      ctx.beginPath();
      ctx.moveTo(noseTip[0] + faceWidth * 0.15, noseTip[1] + offset);
      ctx.lineTo(noseTip[0] + faceWidth * 0.4, noseTip[1] + offset);
      ctx.stroke();
    }
  };

  const renderGlassesFilter = (ctx: CanvasRenderingContext2D, face: any) => {
    if (!face.scaledMesh) return;

    const keypoints = face.scaledMesh;
    const leftEye = keypoints[33];
    const rightEye = keypoints[263];
    const noseBridge = keypoints[168];
    
    const eyeDistance = Math.sqrt(
      Math.pow(rightEye[0] - leftEye[0], 2) + 
      Math.pow(rightEye[1] - leftEye[1], 2)
    );
    
    const lensRadius = eyeDistance * 0.28;

    // Draw sunglasses frame
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 6;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';

    // Left lens
    ctx.beginPath();
    ctx.arc(leftEye[0], leftEye[1], lensRadius, 0, 2 * Math.PI);
    ctx.fill();
    ctx.stroke();

    // Right lens
    ctx.beginPath();
    ctx.arc(rightEye[0], rightEye[1], lensRadius, 0, 2 * Math.PI);
    ctx.fill();
    ctx.stroke();

    // Bridge
    ctx.beginPath();
    ctx.moveTo(leftEye[0] + lensRadius * 0.8, leftEye[1]);
    ctx.lineTo(rightEye[0] - lensRadius * 0.8, rightEye[1]);
    ctx.stroke();

    // Add reflection
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.beginPath();
    ctx.arc(leftEye[0] - lensRadius * 0.3, leftEye[1] - lensRadius * 0.3, lensRadius * 0.4, 0, 2 * Math.PI);
    ctx.fill();

    ctx.beginPath();
    ctx.arc(rightEye[0] - lensRadius * 0.3, rightEye[1] - lensRadius * 0.3, lensRadius * 0.4, 0, 2 * Math.PI);
    ctx.fill();
  };

  const renderHeartFilter = (ctx: CanvasRenderingContext2D, face: any) => {
    if (!face.scaledMesh) return;

    const keypoints = face.scaledMesh;
    const leftEye = keypoints[33];
    const rightEye = keypoints[263];
    
    const eyeDistance = Math.sqrt(
      Math.pow(rightEye[0] - leftEye[0], 2) + 
      Math.pow(rightEye[1] - leftEye[1], 2)
    );
    
    const heartSize = eyeDistance * 0.18;

    // Draw heart eyes
    [leftEye, rightEye].forEach(eye => {
      ctx.fillStyle = '#FF69B4';
      ctx.beginPath();
      ctx.arc(eye[0] - heartSize * 0.35, eye[1] - heartSize * 0.2, heartSize * 0.5, 0, Math.PI, false);
      ctx.arc(eye[0] + heartSize * 0.35, eye[1] - heartSize * 0.2, heartSize * 0.5, 0, Math.PI, false);
      ctx.lineTo(eye[0], eye[1] + heartSize * 0.9);
      ctx.fill();
    });
  };

  const renderSparklesFilter = (ctx: CanvasRenderingContext2D, face: any) => {
    if (!face.scaledMesh) return;

    const keypoints = face.scaledMesh;
    const time = Date.now() * 0.005;
    
    // Create sparkles around the face
    const sparklePositions = [
      { x: keypoints[10][0], y: keypoints[10][1] - 40 },
      { x: keypoints[151][0], y: keypoints[151][1] - 30 },
      { x: keypoints[234][0], y: keypoints[234][1] - 25 },
      { x: keypoints[454][0], y: keypoints[454][1] - 25 },
      { x: keypoints[10][0] - 50, y: keypoints[10][1] - 20 },
      { x: keypoints[10][0] + 50, y: keypoints[10][1] - 20 },
    ];

    sparklePositions.forEach((pos, index) => {
      const sparkleTime = time + index * 0.5;
      const opacity = (Math.sin(sparkleTime) + 1) * 0.5;
      const size = 8 + Math.sin(sparkleTime * 2) * 3;
      
      ctx.fillStyle = `rgba(255, 215, 0, ${opacity})`;
      ctx.font = `${size}px Arial`;
      ctx.textAlign = 'center';
      ctx.fillText('✨', pos.x, pos.y);
    });
  };

  const renderRainbowFilter = (ctx: CanvasRenderingContext2D, face: any, width: number, height: number) => {
    if (!face.scaledMesh) return;

    const keypoints = face.scaledMesh;
    const forehead = keypoints[9];
    
    // Create rainbow arc above the head
    const centerX = forehead[0];
    const centerY = forehead[1] - 60;
    const radius = 100;
    
    const colors = ['#FF0000', '#FF7F00', '#FFFF00', '#00FF00', '#0000FF', '#4B0082', '#9400D3'];
    
    colors.forEach((color, index) => {
      ctx.strokeStyle = color;
      ctx.lineWidth = 8;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius + index * 8, 0, Math.PI, false);
      ctx.stroke();
    });
  };

  const drawDogEars = (
    ctx: CanvasRenderingContext2D,
    leftEye: number[],
    rightEye: number[],
    forehead: number[],
    faceWidth: number
  ) => {
    const earSize = faceWidth * 0.4;
    const earOffset = faceWidth * 0.5;

    // Left ear
    ctx.fillStyle = '#8B4513';
    ctx.beginPath();
    ctx.ellipse(
      leftEye[0] - earOffset,
      forehead[1] - earSize * 0.2,
      earSize * 0.5,
      earSize * 0.9,
      -Math.PI / 6,
      0,
      2 * Math.PI
    );
    ctx.fill();

    // Right ear
    ctx.beginPath();
    ctx.ellipse(
      rightEye[0] + earOffset,
      forehead[1] - earSize * 0.2,
      earSize * 0.5,
      earSize * 0.9,
      Math.PI / 6,
      0,
      2 * Math.PI
    );
    ctx.fill();

    // Inner ear (pink)
    ctx.fillStyle = '#FFB6C1';
    ctx.beginPath();
    ctx.ellipse(
      leftEye[0] - earOffset,
      forehead[1] - earSize * 0.1,
      earSize * 0.25,
      earSize * 0.5,
      -Math.PI / 6,
      0,
      2 * Math.PI
    );
    ctx.fill();

    ctx.beginPath();
    ctx.ellipse(
      rightEye[0] + earOffset,
      forehead[1] - earSize * 0.1,
      earSize * 0.25,
      earSize * 0.5,
      Math.PI / 6,
      0,
      2 * Math.PI
    );
    ctx.fill();
  };

  const drawDogNose = (
    ctx: CanvasRenderingContext2D,
    noseTip: number[],
    size: number
  ) => {
    // Draw black nose
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.ellipse(noseTip[0], noseTip[1], size, size * 0.7, 0, 0, 2 * Math.PI);
    ctx.fill();

    // Add shine effect
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.ellipse(
      noseTip[0] - size * 0.3,
      noseTip[1] - size * 0.3,
      size * 0.25,
      size * 0.15,
      0,
      0,
      2 * Math.PI
    );
    ctx.fill();
  };

  const drawDogTongue = (
    ctx: CanvasRenderingContext2D,
    noseTip: number[],
    size: number
  ) => {
    // Animate tongue with simple bob
    const time = Date.now() * 0.003;
    const tongueY = noseTip[1] + size * 2.5 + Math.sin(time) * 3;

    ctx.fillStyle = '#FF69B4';
    ctx.beginPath();
    ctx.ellipse(
      noseTip[0],
      tongueY,
      size * 0.6,
      size * 1.2,
      0,
      0,
      2 * Math.PI
    );
    ctx.fill();

    // Tongue outline
    ctx.strokeStyle = '#FF1493';
    ctx.lineWidth = 1;
    ctx.stroke();
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
