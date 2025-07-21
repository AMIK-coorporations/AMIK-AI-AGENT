
'use client';

import React, { useRef, useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import designData from '../../public/design.json';

type Status = 'idle' | 'listening' | 'processing' | 'speaking';

interface JarvisVisualizerProps {
  className?: string;
  status: Status;
}

const JarvisVisualizer: React.FC<JarvisVisualizerProps> = ({
  className,
  status,
}) => {
  const isProcessing = status === 'processing';
  const isListening = status === 'listening';
  const isSpeaking = status === 'speaking';
  
  const rotationClass = isProcessing ? 'animate-[spin_4s_linear_infinite]' : '';
  const innerRingClass = isListening ? 'animate-[spin_6s_linear_infinite_reverse]' : '';
  const outerRingClass = isListening ? 'animate-[spin_8s_linear_infinite]' : '';
  const glowClass = isListening || isSpeaking ? 'animate-glow' : '';

  return (
    <div className={cn('relative w-full h-full', className)}>
      <svg
        viewBox="0 0 200 200"
        className="w-full h-full drop-shadow-[0_0_10px_hsl(var(--primary)/0.8)]"
      >
        <defs>
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Outer Ticks */}
        <g className={outerRingClass}>
          {Array.from({ length: 60 }).map((_, i) => (
            <line
              key={`outer-tick-${i}`}
              x1="100"
              y1="10"
              x2="100"
              y2={i % 5 === 0 ? "18" : "14"}
              stroke="hsl(var(--primary) / 0.5)"
              strokeWidth="1"
              transform={`rotate(${i * 6} 100 100)`}
            />
          ))}
        </g>
        
        {/* Inner Ticks */}
        <g className={innerRingClass}>
            {Array.from({ length: 120 }).map((_, i) => (
              <line
                key={`inner-tick-${i}`}
                x1="100"
                y1="35"
                x2="100"
                y2="38"
                stroke="hsl(var(--primary) / 0.3)"
                strokeWidth="0.5"
                transform={`rotate(${i * 3} 100 100)`}
              />
            ))}
        </g>

        {/* Concentric Rings */}
        <circle cx="100" cy="100" r="90" fill="none" stroke="hsl(var(--primary) / 0.2)" strokeWidth="1" />
        <circle cx="100" cy="100" r="85" fill="none" stroke="hsl(var(--primary) / 0.1)" strokeWidth="3" />
        <circle cx="100" cy="100" r="65" fill="none" stroke="hsl(var(--primary) / 0.3)" strokeWidth="1" />
        
        {/* Progress Arc */}
        {isSpeaking && (
            <circle
            cx="100"
            cy="100"
            r="75"
            fill="none"
            stroke="hsl(var(--accent))"
            strokeWidth="4"
            strokeDasharray="471"
            strokeDashoffset="235.5"
            transform="rotate(-90 100 100)"
            className="transition-all duration-500"
            style={{ strokeDashoffset: 100 }}
            filter="url(#glow)"
            />
        )}
        
        {/* Processing Spinners */}
        {isProcessing && (
            <>
                <circle cx="100" cy="100" r="50" fill="none" stroke="hsl(var(--primary))" strokeWidth="1.5" strokeDasharray="10 5" className="animate-[spin_2s_linear_infinite]"/>
                <circle cx="100" cy="100" r="55" fill="none" stroke="hsl(var(--accent))" strokeWidth="1" strokeDasharray="5 15" className="animate-[spin_3s_linear_infinite_reverse]"/>
            </>
        )}
        
        {/* Central Element */}
        <circle
          cx="100"
          cy="100"
          r="40"
          fill="hsl(var(--background))"
          stroke="hsl(var(--primary) / 0.5)"
          strokeWidth="1"
          className={cn("transition-all", glowClass)}
        />
        <text
          x="100"
          y="105"
          fontFamily="var(--font-naskh)"
          fontSize="18"
          textAnchor="middle"
          fill="hsl(var(--foreground))"
          className="text-glow"
        >
          {designData.app.name}
        </text>
      </svg>
    </div>
  );
};

export default JarvisVisualizer;
