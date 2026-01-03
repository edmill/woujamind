/**
 * Frame Gallery Component
 * Displays all extracted frames with selection capability
 * Allows users to see and choose which frames to include in sprite sheet
 */

import React, { useState, useEffect, useRef } from 'react';
import type { FrameMetadata } from '../types';

interface FrameGalleryProps {
  allFrames: HTMLCanvasElement[];
  selectedIndices: number[];
  onSelectionChange: (indices: number[]) => void;
  onClose: () => void;
  onApply: () => void;
  isOpen: boolean;
}

export const FrameGallery: React.FC<FrameGalleryProps> = ({
  allFrames,
  selectedIndices,
  onSelectionChange,
  onClose,
  onApply,
  isOpen
}) => {
  const [localSelectedIndices, setLocalSelectedIndices] = useState<number[]>(selectedIndices);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackIndex, setPlaybackIndex] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(30); // FPS
  const playbackIntervalRef = useRef<number | null>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);

  // Sync with parent selection
  useEffect(() => {
    setLocalSelectedIndices(selectedIndices);
  }, [selectedIndices]);

  // Playback animation
  useEffect(() => {
    if (isPlaying && localSelectedIndices.length > 0) {
      const interval = 1000 / playbackSpeed;
      
      playbackIntervalRef.current = window.setInterval(() => {
        setPlaybackIndex(prev => {
          const nextIndex = (prev + 1) % localSelectedIndices.length;
          
          // Draw frame to preview canvas
          if (previewCanvasRef.current) {
            const frameIndex = localSelectedIndices[nextIndex];
            const frame = allFrames[frameIndex];
            
            if (frame) {
              const ctx = previewCanvasRef.current.getContext('2d');
              if (ctx) {
                previewCanvasRef.current.width = frame.width;
                previewCanvasRef.current.height = frame.height;
                ctx.clearRect(0, 0, frame.width, frame.height);
                ctx.drawImage(frame, 0, 0);
              }
            }
          }
          
          return nextIndex;
        });
      }, interval);
      
      return () => {
        if (playbackIntervalRef.current) {
          clearInterval(playbackIntervalRef.current);
        }
      };
    }
  }, [isPlaying, localSelectedIndices, playbackSpeed, allFrames]);

  const toggleFrameSelection = (index: number) => {
    setLocalSelectedIndices(prev => {
      if (prev.includes(index)) {
        return prev.filter(i => i !== index);
      } else {
        return [...prev, index].sort((a, b) => a - b);
      }
    });
  };

  const selectAll = () => {
    setLocalSelectedIndices(allFrames.map((_, idx) => idx));
  };

  const deselectAll = () => {
    setLocalSelectedIndices([]);
  };

  const selectRange = (start: number, end: number) => {
    const range = [];
    for (let i = start; i <= end; i++) {
      range.push(i);
    }
    setLocalSelectedIndices(range);
  };

  const handleApply = () => {
    onSelectionChange(localSelectedIndices);
    onApply();
  };

  if (!isOpen) return null;

  return (
    <div className="frame-gallery-overlay">
      <div className="frame-gallery-modal">
        {/* Header */}
        <div className="frame-gallery-header">
          <h2>Frame Selection Gallery</h2>
          <p className="frame-count-info">
            {localSelectedIndices.length} of {allFrames.length} frames selected
          </p>
          <button className="close-button" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        {/* Playback Preview */}
        <div className="playback-preview-section">
          <div className="preview-container">
            <canvas 
              ref={previewCanvasRef}
              className="preview-canvas"
              style={{
                maxWidth: '300px',
                maxHeight: '300px',
                imageRendering: 'pixelated'
              }}
            />
          </div>
          
          <div className="playback-controls">
            <button 
              className="btn btn-primary"
              onClick={() => setIsPlaying(!isPlaying)}
              disabled={localSelectedIndices.length === 0}
            >
              {isPlaying ? '⏸ Pause' : '▶ Play'}
            </button>
            
            <div className="speed-control">
              <label>Speed: {playbackSpeed} FPS</label>
              <input
                type="range"
                min="10"
                max="60"
                value={playbackSpeed}
                onChange={(e) => setPlaybackSpeed(Number(e.target.value))}
                className="speed-slider"
              />
            </div>
          </div>
        </div>

        {/* Selection Tools */}
        <div className="selection-tools">
          <button className="btn btn-secondary" onClick={selectAll}>
            Select All
          </button>
          <button className="btn btn-secondary" onClick={deselectAll}>
            Deselect All
          </button>
          <button 
            className="btn btn-secondary" 
            onClick={() => selectRange(0, 49)}
          >
            First 50
          </button>
          <button 
            className="btn btn-secondary" 
            onClick={() => selectRange(50, 99)}
          >
            Middle 50
          </button>
          <button 
            className="btn btn-secondary" 
            onClick={() => selectRange(100, 149)}
          >
            Last 50
          </button>
        </div>

        {/* Frame Grid */}
        <div className="frame-grid-container">
          <div className="frame-grid">
            {allFrames.map((frame, index) => {
              const isSelected = localSelectedIndices.includes(index);
              const isCurrentPlayback = isPlaying && localSelectedIndices[playbackIndex] === index;
              
              return (
                <div
                  key={index}
                  className={`frame-thumbnail ${isSelected ? 'selected' : 'dimmed'} ${isCurrentPlayback ? 'playing' : ''}`}
                  onClick={() => toggleFrameSelection(index)}
                  title={`Frame ${index} - Click to ${isSelected ? 'deselect' : 'select'}`}
                >
                  <canvas
                    ref={(canvas) => {
                      if (canvas && frame) {
                        canvas.width = frame.width;
                        canvas.height = frame.height;
                        const ctx = canvas.getContext('2d');
                        if (ctx) {
                          ctx.drawImage(frame, 0, 0);
                        }
                      }
                    }}
                    className="frame-canvas"
                  />
                  <div className="frame-number">{index}</div>
                  {isSelected && <div className="selected-indicator">✓</div>}
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="frame-gallery-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button 
            className="btn btn-primary" 
            onClick={handleApply}
            disabled={localSelectedIndices.length === 0}
          >
            Apply Selection ({localSelectedIndices.length} frames)
          </button>
        </div>
      </div>

      <style>{`
        .frame-gallery-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.85);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10000;
          padding: 20px;
        }

        .frame-gallery-modal {
          background: var(--color-surface, #1a1a1a);
          border-radius: 12px;
          max-width: 95vw;
          max-height: 95vh;
          display: flex;
          flex-direction: column;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
          overflow: hidden;
        }

        .frame-gallery-header {
          padding: 20px 24px;
          border-bottom: 1px solid var(--color-border, #333);
          display: flex;
          align-items: center;
          gap: 16px;
          position: relative;
        }

        .frame-gallery-header h2 {
          margin: 0;
          font-size: 20px;
          font-weight: 600;
          color: var(--color-text-primary, #fff);
        }

        .frame-count-info {
          margin: 0;
          font-size: 14px;
          color: var(--color-text-secondary, #aaa);
        }

        .close-button {
          position: absolute;
          right: 20px;
          top: 50%;
          transform: translateY(-50%);
          background: transparent;
          border: none;
          font-size: 24px;
          color: var(--color-text-secondary, #aaa);
          cursor: pointer;
          padding: 4px 8px;
          transition: color 0.2s;
        }

        .close-button:hover {
          color: var(--color-text-primary, #fff);
        }

        .playback-preview-section {
          padding: 20px 24px;
          border-bottom: 1px solid var(--color-border, #333);
          display: flex;
          gap: 24px;
          align-items: center;
        }

        .preview-container {
          flex-shrink: 0;
          background: #000;
          border-radius: 8px;
          padding: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .preview-canvas {
          display: block;
          border: 1px solid var(--color-border, #333);
        }

        .playback-controls {
          display: flex;
          flex-direction: column;
          gap: 12px;
          flex: 1;
        }

        .speed-control {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .speed-control label {
          font-size: 14px;
          color: var(--color-text-secondary, #aaa);
        }

        .speed-slider {
          width: 100%;
        }

        .selection-tools {
          padding: 16px 24px;
          border-bottom: 1px solid var(--color-border, #333);
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .frame-grid-container {
          flex: 1;
          overflow-y: auto;
          padding: 20px 24px;
          background: var(--color-background, #0a0a0a);
        }

        .frame-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
          gap: 12px;
        }

        .frame-thumbnail {
          position: relative;
          aspect-ratio: 1;
          border-radius: 6px;
          overflow: hidden;
          cursor: pointer;
          transition: all 0.2s;
          border: 2px solid transparent;
        }

        .frame-thumbnail.selected {
          border-color: var(--color-primary, #00d4ff);
          opacity: 1;
        }

        .frame-thumbnail.dimmed {
          opacity: 0.4;
        }

        .frame-thumbnail.playing {
          border-color: var(--color-success, #00ff88);
          box-shadow: 0 0 12px var(--color-success, #00ff88);
        }

        .frame-thumbnail:hover {
          opacity: 1;
          transform: scale(1.05);
        }

        .frame-canvas {
          width: 100%;
          height: 100%;
          object-fit: contain;
          background: #000;
          image-rendering: pixelated;
        }

        .frame-number {
          position: absolute;
          bottom: 4px;
          left: 4px;
          background: rgba(0, 0, 0, 0.8);
          color: #fff;
          font-size: 10px;
          padding: 2px 6px;
          border-radius: 3px;
          font-weight: 600;
        }

        .selected-indicator {
          position: absolute;
          top: 4px;
          right: 4px;
          background: var(--color-primary, #00d4ff);
          color: #000;
          font-size: 14px;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
        }

        .frame-gallery-footer {
          padding: 16px 24px;
          border-top: 1px solid var(--color-border, #333);
          display: flex;
          justify-content: flex-end;
          gap: 12px;
        }

        .btn {
          padding: 8px 16px;
          border-radius: 6px;
          border: none;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-primary {
          background: var(--color-primary, #00d4ff);
          color: #000;
        }

        .btn-primary:hover:not(:disabled) {
          background: var(--color-primary-hover, #00b8e6);
        }

        .btn-primary:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .btn-secondary {
          background: var(--color-surface-elevated, #2a2a2a);
          color: var(--color-text-primary, #fff);
        }

        .btn-secondary:hover {
          background: var(--color-surface-elevated-hover, #3a3a3a);
        }
      `}</style>
    </div>
  );
};

