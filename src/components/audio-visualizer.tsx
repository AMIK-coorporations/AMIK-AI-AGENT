'use client';

import React, { useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

type Status = 'idle' | 'listening' | 'processing' | 'speaking';

interface AudioVisualizerProps {
  analyserNode: AnalyserNode | null;
  className?: string;
  status: Status;
}

const AudioVisualizer: React.FC<AudioVisualizerProps> = ({
  analyserNode,
  className,
  status,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameIdRef = useRef<number>();
  const isSpeaking = status === 'speaking';
  const isListening = status === 'listening';
  const isProcessing = status === 'processing';

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const canvasCtx = canvas.getContext('2d');
    if (!canvasCtx) return;

    let rotation = 0;
    const draw = () => {
      animationFrameIdRef.current = requestAnimationFrame(draw);
      
      const bufferLength = analyserNode?.frequencyBinCount || 256;
      const dataArray = new Uint8Array(bufferLength);
      if (analyserNode) {
        analyserNode.getByteFrequencyData(dataArray);
      } else if (isListening) {
        // Create synthetic data for listening animation
        for (let i = 0; i < bufferLength; i++) {
            const phase = Date.now() / 200;
            dataArray[i] = 128 + Math.sin(i / 10 + phase) * 64;
        }
      }


      canvasCtx.clearRect(0, 0, canvas.width, canvas.height);
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      
      if(isProcessing) {
        canvasCtx.save();
        canvasCtx.translate(centerX, centerY);
        rotation += 0.01;
        canvasCtx.rotate(rotation);

        const radius = Math.min(centerX, centerY) * 0.7;
        const numCircles = 3;
        for (let i = 0; i < numCircles; i++) {
          canvasCtx.beginPath();
          const angle = (i / numCircles) * Math.PI * 2;
          const arcLength = Math.PI * 1.5;
          canvasCtx.arc(0, 0, radius - i * 15, angle, angle + arcLength);
          canvasCtx.strokeStyle = `hsl(var(--primary), ${0.5 + i * 0.2})`;
          canvasCtx.lineWidth = 3;
          canvasCtx.stroke();
        }
        canvasCtx.restore();
        return;
      }

      const baseRadius = isSpeaking ? 100 : isListening ? 90 : 80;
      const bars = 120;
      const barWidth = 2.5;
      
      const angleStep = (2 * Math.PI) / bars;

      for (let i = 0; i < bars; i++) {
        let barHeight = (dataArray[i] / 255) * 60;
        if(isListening) barHeight = (dataArray[i] / 255) * 30;
        
        const angle = i * angleStep - Math.PI / 2;

        const x1 = centerX + Math.cos(angle) * baseRadius;
        const y1 = centerY + Math.sin(angle) * baseRadius;
        const x2 = centerX + Math.cos(angle) * (baseRadius + barHeight);
        const y2 = centerY + Math.sin(angle) * (baseRadius + barHeight);
        
        const gradient = canvasCtx.createLinearGradient(x1, y1, x2, y2);
        gradient.addColorStop(0, `hsl(var(--accent) / ${isListening ? 0.3 : 0.5})`);
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
  }, [analyserNode, isSpeaking, isListening, isProcessing]);

  return (
    <div className={cn('absolute inset-0 flex items-center justify-center', className)}>
      <canvas ref={canvasRef} width="320" height="320" className="transition-transform duration-500 ease-in-out md:scale-125" style={{transform: isSpeaking ? 'scale(1.1)' : 'scale(1)'}} />
    </div>
  );
};

export default AudioVisualizer;
