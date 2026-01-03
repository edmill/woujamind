/**
 * Smart Frame Selection Utilities
 * Automatically selects optimal frames from video for smooth sprite animation
 */

import type { FrameMetadata } from '../types';

export interface FrameSelectionOptions {
  totalFrames: number;        // Total frames available (e.g., 150)
  targetFrameCount: number;   // Desired number of frames (e.g., 30-50)
  method?: 'even' | 'motion' | 'quality' | 'smart'; // Selection algorithm
}

/**
 * Calculate motion score between two frames
 * Higher score = more motion/change between frames
 */
const calculateMotionScore = (frame1: HTMLCanvasElement, frame2: HTMLCanvasElement): number => {
  const ctx1 = frame1.getContext('2d', { willReadFrequently: true });
  const ctx2 = frame2.getContext('2d', { willReadFrequently: true });
  
  if (!ctx1 || !ctx2) return 0;

  const width = Math.min(frame1.width, frame2.width);
  const height = Math.min(frame1.height, frame2.height);
  
  // Sample at lower resolution for performance (every 4th pixel)
  const sampleStep = 4;
  const data1 = ctx1.getImageData(0, 0, width, height).data;
  const data2 = ctx2.getImageData(0, 0, width, height).data;
  
  let totalDiff = 0;
  let sampleCount = 0;
  
  for (let y = 0; y < height; y += sampleStep) {
    for (let x = 0; x < width; x += sampleStep) {
      const i = (y * width + x) * 4;
      
      // Calculate RGB difference
      const rDiff = Math.abs(data1[i] - data2[i]);
      const gDiff = Math.abs(data1[i + 1] - data2[i + 1]);
      const bDiff = Math.abs(data1[i + 2] - data2[i + 2]);
      
      totalDiff += (rDiff + gDiff + bDiff) / 3;
      sampleCount++;
    }
  }
  
  return sampleCount > 0 ? totalDiff / sampleCount : 0;
};

/**
 * Calculate quality/sharpness score for a frame
 * Higher score = sharper, clearer frame
 */
const calculateQualityScore = (frame: HTMLCanvasElement): number => {
  const ctx = frame.getContext('2d', { willReadFrequently: true });
  if (!ctx) return 0;

  const width = frame.width;
  const height = frame.height;
  const data = ctx.getImageData(0, 0, width, height).data;
  
  // Simple edge detection using Sobel-like operator
  let edgeStrength = 0;
  const sampleStep = 4; // Sample every 4th pixel for performance
  
  for (let y = sampleStep; y < height - sampleStep; y += sampleStep) {
    for (let x = sampleStep; x < width - sampleStep; x += sampleStep) {
      const i = (y * width + x) * 4;
      const iRight = (y * width + (x + sampleStep)) * 4;
      const iDown = ((y + sampleStep) * width + x) * 4;
      
      // Horizontal gradient
      const gx = Math.abs(data[i] - data[iRight]);
      // Vertical gradient
      const gy = Math.abs(data[i] - data[iDown]);
      
      edgeStrength += Math.sqrt(gx * gx + gy * gy);
    }
  }
  
  return edgeStrength;
};

/**
 * Even distribution selection - picks frames at regular intervals
 */
const selectFramesEvenly = (totalFrames: number, targetCount: number): number[] => {
  const indices: number[] = [];
  const step = totalFrames / targetCount;
  
  for (let i = 0; i < targetCount; i++) {
    const index = Math.floor(i * step);
    indices.push(Math.min(index, totalFrames - 1));
  }
  
  return indices;
};

/**
 * Motion-based selection - picks frames with significant motion
 */
const selectFramesByMotion = (
  frames: HTMLCanvasElement[],
  targetCount: number,
  onProgress?: (current: number, total: number) => void
): number[] => {
  console.log('[selectFramesByMotion] Analyzing motion across', frames.length, 'frames');
  
  // Calculate motion scores between consecutive frames
  const motionScores: { index: number; score: number }[] = [];
  
  for (let i = 0; i < frames.length - 1; i++) {
    const score = calculateMotionScore(frames[i], frames[i + 1]);
    motionScores.push({ index: i, score });
    
    if (onProgress && i % 10 === 0) {
      onProgress(i, frames.length);
    }
  }
  
  // Sort by motion score (highest first)
  motionScores.sort((a, b) => b.score - a.score);
  
  // Take top N frames with highest motion
  const selectedIndices = motionScores
    .slice(0, targetCount)
    .map(m => m.index)
    .sort((a, b) => a - b); // Sort chronologically
  
  console.log('[selectFramesByMotion] Selected', selectedIndices.length, 'frames with highest motion');
  return selectedIndices;
};

/**
 * Quality-based selection - picks sharpest/clearest frames
 */
const selectFramesByQuality = (
  frames: HTMLCanvasElement[],
  targetCount: number,
  onProgress?: (current: number, total: number) => void
): number[] => {
  console.log('[selectFramesByQuality] Analyzing quality of', frames.length, 'frames');
  
  // Calculate quality scores for all frames
  const qualityScores: { index: number; score: number }[] = [];
  
  for (let i = 0; i < frames.length; i++) {
    const score = calculateQualityScore(frames[i]);
    qualityScores.push({ index: i, score });
    
    if (onProgress && i % 10 === 0) {
      onProgress(i, frames.length);
    }
  }
  
  // Sort by quality score (highest first)
  qualityScores.sort((a, b) => b.score - a.score);
  
  // Take top N frames with highest quality
  const selectedIndices = qualityScores
    .slice(0, targetCount)
    .map(q => q.index)
    .sort((a, b) => a - b); // Sort chronologically
  
  console.log('[selectFramesByQuality] Selected', selectedIndices.length, 'frames with highest quality');
  return selectedIndices;
};

/**
 * Smart selection - combines even distribution with quality filtering
 * This is the recommended default method
 */
const selectFramesSmart = (
  frames: HTMLCanvasElement[],
  targetCount: number,
  onProgress?: (current: number, total: number) => void
): number[] => {
  console.log('[selectFramesSmart] Smart selection from', frames.length, 'frames, target:', targetCount);
  
  // Step 1: Divide video into segments
  const segmentCount = targetCount;
  const segmentSize = Math.floor(frames.length / segmentCount);
  
  const selectedIndices: number[] = [];
  
  // Step 2: For each segment, pick the best quality frame
  for (let seg = 0; seg < segmentCount; seg++) {
    const segmentStart = seg * segmentSize;
    const segmentEnd = Math.min(segmentStart + segmentSize, frames.length);
    
    let bestIndex = segmentStart;
    let bestScore = -1;
    
    // Find best quality frame in this segment
    for (let i = segmentStart; i < segmentEnd; i++) {
      const score = calculateQualityScore(frames[i]);
      if (score > bestScore) {
        bestScore = score;
        bestIndex = i;
      }
    }
    
    selectedIndices.push(bestIndex);
    
    if (onProgress && seg % 5 === 0) {
      onProgress(seg, segmentCount);
    }
  }
  
  console.log('[selectFramesSmart] Selected', selectedIndices.length, 'frames using smart algorithm');
  return selectedIndices.sort((a, b) => a - b);
};

/**
 * Main frame selection function
 * Automatically selects optimal frames from a video for sprite animation
 */
export const selectOptimalFrames = (
  frames: HTMLCanvasElement[],
  options: FrameSelectionOptions,
  onProgress?: (current: number, total: number) => void
): number[] => {
  const { totalFrames, targetFrameCount, method = 'smart' } = options;
  
  if (frames.length !== totalFrames) {
    console.warn('[selectOptimalFrames] Frame count mismatch:', frames.length, 'vs', totalFrames);
  }
  
  console.log(`[selectOptimalFrames] Selecting ${targetFrameCount} frames from ${frames.length} using method: ${method}`);
  
  switch (method) {
    case 'even':
      return selectFramesEvenly(frames.length, targetFrameCount);
    
    case 'motion':
      return selectFramesByMotion(frames, targetFrameCount, onProgress);
    
    case 'quality':
      return selectFramesByQuality(frames, targetFrameCount, onProgress);
    
    case 'smart':
    default:
      return selectFramesSmart(frames, targetFrameCount, onProgress);
  }
};

/**
 * Generate frame metadata for all frames
 */
export const generateFrameMetadata = (
  frames: HTMLCanvasElement[],
  selectedIndices: number[],
  videoDuration: number = 5.0 // Seedance generates 5-second videos
): FrameMetadata[] => {
  const metadata: FrameMetadata[] = [];
  
  for (let i = 0; i < frames.length; i++) {
    metadata.push({
      index: i,
      timestamp: (i / frames.length) * videoDuration,
      isSelected: selectedIndices.includes(i),
      qualityScore: undefined, // Can be calculated on-demand
      motionScore: undefined   // Can be calculated on-demand
    });
  }
  
  return metadata;
};

/**
 * Convert selected frames to base64 data URLs for storage
 */
export const framesToDataUrls = (frames: HTMLCanvasElement[]): string[] => {
  return frames.map(frame => frame.toDataURL('image/png'));
};

/**
 * Convert base64 data URLs back to canvas elements
 */
export const dataUrlsToFrames = async (dataUrls: string[]): Promise<HTMLCanvasElement[]> => {
  const frames: HTMLCanvasElement[] = [];
  
  for (const dataUrl of dataUrls) {
    const img = new Image();
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = reject;
      img.src = dataUrl;
    });
    
    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(img, 0, 0);
      frames.push(canvas);
    }
  }
  
  return frames;
};

