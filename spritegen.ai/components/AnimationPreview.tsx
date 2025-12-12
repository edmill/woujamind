
import React, { useEffect, useRef, useState } from 'react';
import { GridConfig } from '../types';
import { extractFrames, createGifBlob } from '../utils/imageUtils';
import { SPRITE_ACTIONS } from '../constants';
import { Play, Pause, Download, Layers, CheckCircle2, Circle, Keyboard, MousePointerClick, Gauge } from 'lucide-react';

interface AnimationPreviewProps {
  imageSrc: string | null;
  gridConfig: GridConfig;
  selectedActions: string[];
  // Controlled props from Parent
  fps: number;
  setFps: (fps: number) => void; // New prop
  backgroundColor: string;
  removeBg: boolean;
  localRows: number;
  localCols: number;
  isPlaying: boolean;
  setIsPlaying: (playing: boolean) => void;
  onFrameChange: (frameIndex: number | null) => void;
  customFrameSequence: number[]; // New prop: List of absolute frame indices to play
}

export const AnimationPreview: React.FC<AnimationPreviewProps> = ({ 
    imageSrc, 
    gridConfig, 
    selectedActions,
    fps,
    setFps,
    backgroundColor,
    removeBg,
    localRows,
    localCols,
    isPlaying,
    setIsPlaying,
    onFrameChange,
    customFrameSequence
}) => {
  // State for frames and playback
  const [frames, setFrames] = useState<HTMLCanvasElement[]>([]);
  const [isExporting, setIsExporting] = useState(false);
  
  // Row-based Sequence State
  // Initialize with [0] so at least the first row plays by default
  const [sequence, setSequence] = useState<number[]>([0]);
  
  // Playback State
  const [currentSequenceStep, setCurrentSequenceStep] = useState(0); 
  const [currentFrameInAction, setCurrentFrameInAction] = useState(0); 

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);

  const isCustomMode = customFrameSequence.length > 0;

  // Generate available tracks based on visual rows, not just named actions
  const availableTracks = Array.from({ length: localRows }).map((_, rowIndex) => {
      // Find if this row index maps to a selected action
      const actionId = selectedActions[rowIndex];
      const actionDef = SPRITE_ACTIONS.find(a => a.id === actionId);
      return {
          rowIndex,
          label: actionDef ? actionDef.label : `Row ${rowIndex + 1}`,
          isNamed: !!actionDef
      };
  });

  // Keyboard Navigation Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        if (!imageSrc) return;
        
        // IGNORE if typing in an input field
        const target = e.target as HTMLElement;
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;
        
        if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
            e.preventDefault();
            setIsPlaying(false); // Pause on manual interaction
            
            // Logic differs for Custom vs Row mode
            if (isCustomMode) {
                 // In custom mode, step through the custom list
                 let nextStep = currentSequenceStep;
                 if (e.key === 'ArrowRight') {
                     nextStep = (nextStep + 1) % customFrameSequence.length;
                 } else {
                     nextStep = nextStep - 1;
                     if (nextStep < 0) nextStep = customFrameSequence.length - 1;
                 }
                 setCurrentSequenceStep(nextStep);
            } else {
                // Row mode
                if (sequence.length === 0) return;
                let nextFrame = currentFrameInAction;
                let nextStep = currentSequenceStep;

                if (e.key === 'ArrowRight') {
                    nextFrame++;
                    if (nextFrame >= localCols) {
                        nextFrame = 0;
                        nextStep = (nextStep + 1) % sequence.length;
                    }
                } else {
                    nextFrame--;
                    if (nextFrame < 0) {
                        nextFrame = localCols - 1;
                        nextStep = nextStep - 1;
                        if (nextStep < 0) nextStep = sequence.length - 1;
                    }
                }
                setCurrentFrameInAction(nextFrame);
                setCurrentSequenceStep(nextStep);
            }
        } else if (e.key === ' ') {
             e.preventDefault();
             setIsPlaying(!isPlaying);
        }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, currentFrameInAction, currentSequenceStep, localCols, sequence, imageSrc, isCustomMode, customFrameSequence]);

  // Extract frames when configuration changes
  useEffect(() => {
    if (!imageSrc) return;

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const extracted = extractFrames(
        img,
        localRows,
        localCols,
        localRows * localCols,
        removeBg
      );
      setFrames(extracted);
      // Reset logic when frames regenerate
      setCurrentSequenceStep(0);
      setCurrentFrameInAction(0);
    };
    img.src = imageSrc;
  }, [imageSrc, localRows, localCols, removeBg]);

  // Animation Loop Engine
  useEffect(() => {
    if (!isPlaying || frames.length === 0) return;
    if (!isCustomMode && sequence.length === 0) return;

    const animate = (timestamp: number) => {
      if (!lastTimeRef.current) lastTimeRef.current = timestamp;

        const interval = 1000 / fps;
        const elapsed = timestamp - lastTimeRef.current;

        if (elapsed > interval) {
            
            if (isCustomMode) {
                // Simply iterate through the custom list
                setCurrentSequenceStep(prev => (prev + 1) % customFrameSequence.length);
            } else {
                // Row Logic
                const framesPerAction = localCols; 
                if (currentFrameInAction >= framesPerAction - 1) {
                    setCurrentSequenceStep(prev => (prev + 1) % sequence.length);
                    setCurrentFrameInAction(0);
                } else {
                    setCurrentFrameInAction(prev => prev + 1);
                }
            }
            
            lastTimeRef.current = timestamp - (elapsed % interval);
        }

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [isPlaying, frames.length, fps, sequence, localCols, currentFrameInAction, isCustomMode, customFrameSequence]);

  // Render Logic & Propagate Active Frame
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || frames.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let absoluteFrameIndex = 0;

    if (isCustomMode) {
         if (customFrameSequence.length === 0) return;
         // Safety check for index out of bounds
         const ptr = currentSequenceStep % customFrameSequence.length;
         absoluteFrameIndex = customFrameSequence[ptr];
    } else {
        if (sequence.length === 0) return;
        const targetRowIndex = sequence[currentSequenceStep];
        if (targetRowIndex === undefined || targetRowIndex >= localRows) return;
        absoluteFrameIndex = (targetRowIndex * localCols) + currentFrameInAction;
    }

    const currentFrame = frames[absoluteFrameIndex];

    // Notify Parent
    onFrameChange(absoluteFrameIndex);

    if (currentFrame) {
        canvas.width = currentFrame.width;
        canvas.height = currentFrame.height;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(currentFrame, 0, 0);
    }
  }, [currentSequenceStep, currentFrameInAction, frames, sequence, localCols, localRows, onFrameChange, isCustomMode, customFrameSequence]);

  const toggleActionInSequence = (rowIndex: number) => {
    if (sequence.includes(rowIndex)) {
        if (sequence.length > 1) {
            setSequence(sequence.filter(i => i !== rowIndex));
        }
    } else {
        // Append and sort numerically to ensure playback is Top -> Bottom
        setSequence([...sequence, rowIndex].sort((a,b) => a - b));
    }
    if (!isCustomMode) {
        setCurrentSequenceStep(0);
        setCurrentFrameInAction(0);
    }
  };

  const handleExportGif = async () => {
    if (frames.length === 0) return;
    setIsExporting(true);
    try {
      const exportFrames: HTMLCanvasElement[] = [];
      const frameDelay = 1000 / fps;
      
      if (isCustomMode) {
          for (const idx of customFrameSequence) {
              if (frames[idx]) exportFrames.push(frames[idx]);
          }
      } else {
        for (const rowIndex of sequence) {
            for (let col = 0; col < localCols; col++) {
                const absIndex = (rowIndex * localCols) + col;
                if (frames[absIndex]) {
                    exportFrames.push(frames[absIndex]);
                }
            }
        }
      }

      const blob = await createGifBlob(exportFrames, frameDelay);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `animation-${Date.now()}.gif`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error("Export failed", e);
      alert("Failed to export GIF.");
    } finally {
      setIsExporting(false);
    }
  };

  if (!imageSrc) {
    return (
      <div className="h-full bg-slate-900/50 rounded-xl border border-slate-800 flex flex-col items-center justify-center text-slate-500 p-8 text-center">
        <Layers className="w-12 h-12 mb-4 opacity-20" />
        <p>Preview animation here</p>
      </div>
    );
  }

  return (
    <div className="h-full rounded-xl border border-slate-800 flex flex-col overflow-hidden" style={{ backgroundColor }}>
      
      {/* Top Bar with Controls */}
      <div className="p-2 border-b border-slate-800 flex justify-between items-center bg-slate-900/80 backdrop-blur-sm">
         
         {/* Playback Controls */}
         <div className="flex items-center gap-3">
             <button 
                onClick={() => setIsPlaying(!isPlaying)}
                className={`p-1.5 rounded-lg transition-all ${isPlaying ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20' : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'}`}
             >
                 {isPlaying ? <Pause className="w-4 h-4 fill-current"/> : <Play className="w-4 h-4 fill-current"/>}
             </button>
             
             <div className="flex flex-col gap-0.5 w-24">
                <div className="flex justify-between items-center">
                    <span className="text-[9px] font-bold text-slate-500 uppercase flex items-center gap-1">
                        <Gauge className="w-2.5 h-2.5" /> Speed
                    </span>
                    <span className="text-[9px] font-mono text-indigo-400">{fps} FPS</span>
                </div>
                <input 
                    type="range" 
                    min="1" 
                    max="24" 
                    value={fps} 
                    onChange={e => setFps(parseInt(e.target.value))} 
                    className="w-full h-1 bg-slate-700 rounded-full accent-indigo-500 cursor-pointer appearance-none focus:outline-none focus:ring-1 focus:ring-indigo-500/50" 
                />
             </div>
         </div>

         <div className="flex items-center gap-2">
            <span className="hidden xl:flex items-center gap-1 text-[10px] text-slate-600 border border-slate-800/50 px-2 py-1 rounded bg-slate-950/50">
                <Keyboard className="w-3 h-3 opacity-50" /> Step
            </span>
            <button 
                onClick={handleExportGif}
                disabled={isExporting}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-bold rounded-lg shadow-lg shadow-indigo-500/20 disabled:opacity-50 transition-all active:scale-95"
            >
                {isExporting ? '...' : 'GIF'}
                <Download className="w-3.5 h-3.5" />
            </button>
         </div>
      </div>

      {/* Viewport */}
      <div className={`flex-1 relative flex items-center justify-center p-8 overflow-hidden ${backgroundColor === 'transparent' ? 'checkerboard bg-slate-950/30' : ''}`}>
         <div className="relative">
             <canvas 
                ref={canvasRef}
                className="max-w-full max-h-48 object-contain pixelated drop-shadow-2xl scale-150"
             />
         </div>
         {isCustomMode && (
             <div className="absolute bottom-4 left-0 right-0 text-center pointer-events-none">
                 <span className="text-[10px] font-bold text-amber-500 bg-amber-950/50 border border-amber-500/30 px-3 py-1 rounded-full shadow-lg backdrop-blur-sm flex items-center justify-center gap-2 w-max mx-auto">
                    <MousePointerClick className="w-3 h-3" />
                    Playing {customFrameSequence.length} Selected Frames
                 </span>
             </div>
         )}
      </div>

      {/* Sequence Selector */}
      <div className={`bg-slate-900/90 border-t border-slate-800 p-3 ${isCustomMode ? 'opacity-50 pointer-events-none grayscale' : ''}`}>
          <div className="flex items-center gap-2 mb-2">
              <Layers className="w-3 h-3 text-slate-500" />
              <span className="text-[10px] font-bold text-slate-400 uppercase">Sequence Timeline</span>
          </div>
          <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto custom-scrollbar">
              {availableTracks.map((track) => (
                  <button
                      key={track.rowIndex}
                      onClick={() => toggleActionInSequence(track.rowIndex)}
                      className={`
                          text-[10px] px-2.5 py-1 rounded-full border flex items-center gap-1.5 transition-all
                          ${sequence.includes(track.rowIndex) 
                              ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-300 shadow-[0_0_10px_-4px_rgba(99,102,241,0.5)]' 
                              : 'bg-slate-800 border-slate-700 text-slate-500 hover:text-slate-300 hover:bg-slate-700'}
                          ${!isCustomMode && sequence[currentSequenceStep] === track.rowIndex && isPlaying ? 'ring-1 ring-white/20' : ''}
                      `}
                  >
                      {sequence.includes(track.rowIndex) 
                          ? <CheckCircle2 className="w-3 h-3 text-indigo-400" /> 
                          : <Circle className="w-3 h-3 opacity-50" />}
                      {track.label}
                  </button>
              ))}
          </div>
      </div>
    </div>
  );
};
