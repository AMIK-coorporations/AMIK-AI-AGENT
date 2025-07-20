'use client';

import React, { useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface AudioVisualizerProps {
  analyserNode: AnalyserNode | null;
  className?: string;
  isSpeaking?: boolean;
}

const AudioVisualizer: React.FC<AudioVisualizerProps> = ({
  analyserNode,
  className,
  isSpeaking = false,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameIdRef = useRef<number>();

  useEffect(() => {
    if (!analyserNode || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const canvasCtx = canvas.getContext('2d');
    if (!canvasCtx) return;

    const bufferLength = analyserNode.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      animationFrameIdRef.current = requestAnimationFrame(draw);

      analyserNode.getByteFrequencyData(dataArray);

      canvasCtx.clearRect(0, 0, canvas.width, canvas.height);

      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const baseRadius = isSpeaking ? 90 : 70;
      const bars = 120;
      const barWidth = 2.5;
      
      const angleStep = (2 * Math.PI) / bars;

      for (let i = 0; i < bars; i++) {
        const barHeight = Math.pow(dataArray[i] / 255, 2) * 60;
        const angle = i * angleStep - Math.PI / 2;

        const x1 = centerX + Math.cos(angle) * baseRadius;
        const y1 = centerY + Math.sin(angle) * baseRadius;
        const x2 = centerX + Math.cos(angle) * (baseRadius + barHeight);
        const y2 = centerY + Math.sin(angle) * (baseRadius + barHeight);
        
        const gradient = canvasCtx.createLinearGradient(x1, y1, x2, y2);
        gradient.addColorStop(0, 'hsl(var(--accent) / 0.5)');
        gradient.addColorStop(1, 'hsl(var(--primary))');

        canvasCtx.strokeStyle = gradient;
        canvasCtx.lineWidth = barWidth;
        canvasCtx.lineCap = 'round';
        canvasCtx.beginPath();
        canvasCtx.moveTo(x1, y1);
        canvasCtx.lineTo(x2, y2);
        canvasCtx.stroke();
      }
    };

    draw();

    return () => {
      if(animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
    };
  }, [analyserNode, isSpeaking]);

  return (
    <div className={cn('absolute inset-0 flex items-center justify-center', className)}>
      <canvas ref={canvasRef} width="256" height="256" className="transition-transform duration-500 ease-in-out" style={{transform: isSpeaking ? 'scale(1.1)' : 'scale(1)'}} />
    </div>
  );
};

export default AudioVisualizer;
