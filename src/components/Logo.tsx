
import React from 'react';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const Logo = ({ className = '', size = 'md' }: LogoProps) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16'
  };

  return (
    <div className={`relative ${sizeClasses[size]} ${className}`}>
      <svg
        viewBox="0 0 200 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
      >
        {/* Outer gradient ring */}
        <defs>
          <linearGradient id="ringGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FF6B35" />
            <stop offset="50%" stopColor="#FF1744" />
            <stop offset="100%" stopColor="#E91E63" />
          </linearGradient>
          <linearGradient id="sparkGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFB347" />
            <stop offset="100%" stopColor="#FFA000" />
          </linearGradient>
        </defs>
        
        {/* Main circular ring */}
        <path
          d="M100 20 C140 20, 180 60, 180 100 C180 140, 140 180, 100 180 C60 180, 20 140, 20 100 C20 80, 30 60, 45 45"
          stroke="url(#ringGradient)"
          strokeWidth="12"
          fill="none"
          strokeLinecap="round"
        />
        
        {/* Inner ring accent */}
        <path
          d="M100 35 C130 35, 165 70, 165 100 C165 130, 130 165, 100 165"
          stroke="url(#ringGradient)"
          strokeWidth="8"
          fill="none"
          strokeLinecap="round"
          opacity="0.6"
        />
        
        {/* Sparkle/star element */}
        <path
          d="M160 45 L165 55 L175 55 L167 62 L170 72 L160 67 L150 72 L153 62 L145 55 L155 55 Z"
          fill="url(#sparkGradient)"
        />
        
        {/* GZ Text */}
        <text
          x="100"
          y="115"
          textAnchor="middle"
          className="fill-current text-foreground dark:text-foreground font-bold"
          style={{ fontSize: '48px', fontFamily: 'system-ui, sans-serif' }}
        >
          GZ
        </text>
      </svg>
    </div>
  );
};

export default Logo;
