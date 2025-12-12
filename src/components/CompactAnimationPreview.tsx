/**
 * Compact Animation Preview Component
 * Shows a small animation preview with play controls, fps, and keyboard navigation
 */
import React, { useEffect, useRef, useState } from 'react';
import { Play, Pause, ChevronLeft, ChevronRight } from 'lucide-react';
import { extractFrames } from '../utils/imageUtils';
import { cn } from '../utils';

interface CompactAnimationPreviewProps {
  imageSrc: string | null;
  rows: number;
  cols: number;
  fps: number;
  setFps: (fps: number) => void;
  backgroundColor?: string;
}

export const CompactAnimationPreview: React.FC<CompactAnimationPreviewProps> = ({
  imageSrc,
  rows,
  cols,
  fps,
  setFps,
  backgroundColor = '#ffffff'
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentFrame, setCurrentFrame] = useState(0);
  const [frames, setFrames] = useState<HTMLCanvasElement[]>([]);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  const lastFrameTimeRef = useRef<number>(0);

  // Extract frames from sprite sheet
  useEffect(() => {
    if (!imageSrc) {
      setFrames([]);
      return;
    }

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = imageSrc;
    
    img.onload = () => {
      const extractedFrames = extractFrames(img, rows, cols, rows * cols, backgroundColor === 'transparent');
      setFrames(extractedFrames);
      if (extractedFrames.length > 0) {
        setCurrentFrame(0);
      }
    };
  }, [imageSrc, rows, cols, backgroundColor]);

  // Animation loop
  useEffect(() => {
    if (!isPlaying || frames.length === 0) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
      return;
    }

    const animate = (timestamp: number) => {
      const frameDelay = 1000 / fps;
      
      if (timestamp - lastFrameTimeRef.current >= frameDelay) {
        setCurrentFrame((prev) => (prev + 1) % frames.length);
        lastFrameTimeRef.current = timestamp;
      }
      
      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying, frames.length, fps]);

  // Render current frame
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || frames.length === 0 || !frames[currentFrame]) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const frame = frames[currentFrame];
    canvas.width = frame.width;
    canvas.height = frame.height;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(frame, 0, 0);
  }, [currentFrame, frames]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (frames.length === 0) return;
      
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setIsPlaying(false);
        setCurrentFrame((prev) => (prev - 1 + frames.length) % frames.length);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        setIsPlaying(false);
        setCurrentFrame((prev) => (prev + 1) % frames.length);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [frames.length]);

  if (!imageSrc || frames.length === 0) {
    return null;
  }

  return (
    <div className="bg-slate-100 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-lg p-3 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
          Animation Preview
        </span>
        <span className="text-xs text-slate-500 dark:text-slate-500 font-mono">
          {currentFrame + 1} / {frames.length}
        </span>
      </div>
      
      <div className="flex items-center gap-3">
        {/* Canvas Preview */}
        <div className="flex-1 flex items-center justify-center bg-white dark:bg-slate-950 rounded border border-slate-200 dark:border-slate-800 overflow-hidden" style={{ minHeight: '80px' }}>
          <canvas
            ref={canvasRef}
            className="max-w-full max-h-[80px] object-contain"
            style={{ imageRendering: 'pixelated' }}
          />
        </div>

        {/* Controls */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-1">
            <button
              onClick={() => {
                setIsPlaying(false);
                setCurrentFrame((prev) => (prev - 1 + frames.length) % frames.length);
              }}
              className="p-1.5 rounded bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
              title="Previous frame (←)"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className={cn(
                "p-1.5 rounded transition-colors",
                isPlaying
                  ? "bg-orange-500 text-white hover:bg-orange-600"
                  : "bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300"
              )}
              title={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? (
                <Pause className="w-3.5 h-3.5 fill-current" />
              ) : (
                <Play className="w-3.5 h-3.5 fill-current" />
              )}
            </button>
            
            <button
              onClick={() => {
                setIsPlaying(false);
                setCurrentFrame((prev) => (prev + 1) % frames.length);
              }}
              className="p-1.5 rounded bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
              title="Next frame (→)"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* FPS Control */}
          <div className="flex items-center gap-2">
            <label className="text-[10px] text-slate-500 dark:text-slate-400 font-mono w-8">
              {fps} FPS
            </label>
            <input
              type="range"
              min="1"
              max="24"
              value={fps}
              onChange={(e) => setFps(parseInt(e.target.value))}
              className="flex-1 h-1 bg-slate-300 dark:bg-slate-700 rounded-full accent-orange-500 cursor-pointer"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

