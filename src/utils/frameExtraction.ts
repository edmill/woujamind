/**
 * Frame Extraction and GIF Creation Utilities
 * Functions for extracting frames from sprite sheets and creating GIFs
 */

import { GIFEncoder, quantize, applyPalette } from 'gifenc';
import { processRemoveBackground } from './imageHelpers';
import { VariableFrame } from './variableFrameDetection';

/**
 * Check if a frame is empty (all transparent or all background color)
 * @param canvas - The canvas to check
 * @param threshold - Minimum number of non-transparent/non-background pixels (default: 10)
 * @returns true if frame is empty, false otherwise
 */
export const isFrameEmpty = (canvas: HTMLCanvasElement, threshold: number = 10): boolean => {
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return true;

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  
  let contentPixels = 0;
  
  // Check for non-transparent pixels with sufficient alpha
  for (let i = 3; i < data.length; i += 4) {
    const alpha = data[i];
    if (alpha > 30) { // Pixel has sufficient opacity
      contentPixels++;
      if (contentPixels >= threshold) {
        return false; // Found enough content, not empty
      }
    }
  }
  
  // If we found fewer than threshold content pixels, consider it empty
  return contentPixels < threshold;
};

/**
 * Filter out empty frames from an array of frames
 * @param frames - Array of canvas frames
 * @returns Object with non-empty frames and their original indices
 */
export const filterEmptyFrames = (frames: HTMLCanvasElement[]): {
  frames: HTMLCanvasElement[];
  indices: number[];
} => {
  const nonEmptyFrames: HTMLCanvasElement[] = [];
  const nonEmptyIndices: number[] = [];
  
  frames.forEach((frame, index) => {
    if (!isFrameEmpty(frame)) {
      nonEmptyFrames.push(frame);
      nonEmptyIndices.push(index);
    }
  });
  
  console.log(`[filterEmptyFrames] Filtered ${frames.length - nonEmptyFrames.length} empty frames, kept ${nonEmptyFrames.length}`);
  
  return {
    frames: nonEmptyFrames,
    indices: nonEmptyIndices
  };
};

export const extractFrames = (
  img: HTMLImageElement,
  rows: number,
  cols: number,
  count: number,
  removeBackground: boolean = false,
  dropShadow: boolean = false
): HTMLCanvasElement[] => {
  const frames: HTMLCanvasElement[] = [];
  const frameWidth = Math.floor(img.naturalWidth / cols);
  const frameHeight = Math.floor(img.naturalHeight / rows);

  // Calculate padding needed for shadow
  const shadowPadding = dropShadow ? 30 : 0; // Extra space for shadow blur + offset

  for (let i = 0; i < count; i++) {
    const row = Math.floor(i / cols);
    const col = i % cols;

    if (row >= rows) break;

    const canvas = document.createElement('canvas');
    canvas.width = frameWidth + shadowPadding * 2;
    canvas.height = frameHeight + shadowPadding * 2;
    const ctx = canvas.getContext('2d', { willReadFrequently: true, alpha: true });

    if (ctx) {
      ctx.imageSmoothingEnabled = false;

      // Clear canvas with transparency
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // 1. Draw raw frame to temp canvas
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = frameWidth;
      tempCanvas.height = frameHeight;
      const tempCtx = tempCanvas.getContext('2d', { willReadFrequently: true, alpha: true });

      if (!tempCtx) continue;
      tempCtx.imageSmoothingEnabled = false;

      tempCtx.drawImage(
        img,
        col * frameWidth,
        row * frameHeight,
        frameWidth,
        frameHeight,
        0,
        0,
        frameWidth,
        frameHeight
      );

      if (removeBackground) {
        console.log('[extractFrames] Removing background from frame', i);
        processRemoveBackground(tempCtx, frameWidth, frameHeight);
        console.log('[extractFrames] Background removed');
      }

      // Apply drop shadow if enabled
      if (dropShadow) {
        ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
        ctx.shadowBlur = 20;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 8;
      }

      // Draw with padding to accommodate shadow
      ctx.drawImage(tempCanvas, shadowPadding, shadowPadding);

      // Reset shadow
      if (dropShadow) {
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
      }

      frames.push(canvas);
    }
  }

  return frames;
};

/**
 * Extract frames using variable frame coordinates (for non-uniform sprite sheets)
 */
export const extractVariableFrames = (
  img: HTMLImageElement,
  variableFrames: VariableFrame[],
  removeBackground: boolean = false,
  dropShadow: boolean = false
): HTMLCanvasElement[] => {
  const frames: HTMLCanvasElement[] = [];
  const shadowPadding = dropShadow ? 30 : 0;

  // Extract frames in the exact order provided (preserving indices from upload modal)
  // The frames array will have the same order and indices as the variableFrames input
  for (const frameData of variableFrames) {
    const canvas = document.createElement('canvas');
    canvas.width = frameData.width + shadowPadding * 2;
    canvas.height = frameData.height + shadowPadding * 2;
    const ctx = canvas.getContext('2d', { willReadFrequently: true, alpha: true });

    if (!ctx) continue;

    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw raw frame to temp canvas
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = frameData.width;
    tempCanvas.height = frameData.height;
    const tempCtx = tempCanvas.getContext('2d', { willReadFrequently: true, alpha: true });

    if (!tempCtx) continue;
    tempCtx.imageSmoothingEnabled = false;

    // Extract frame from sprite sheet using variable coordinates
    tempCtx.drawImage(
      img,
      frameData.x,
      frameData.y,
      frameData.width,
      frameData.height,
      0,
      0,
      frameData.width,
      frameData.height
    );

    if (removeBackground) {
      processRemoveBackground(tempCtx, frameData.width, frameData.height);
    }

    // Apply drop shadow if enabled
    if (dropShadow) {
      ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
      ctx.shadowBlur = 20;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 8;
    }

    // Draw with padding to accommodate shadow
    ctx.drawImage(tempCanvas, shadowPadding, shadowPadding);

    // Reset shadow
    if (dropShadow) {
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;
    }

    frames.push(canvas);
  }

  return frames;
};

export const createGifBlob = async (frames: HTMLCanvasElement[], delayMs: number): Promise<Blob> => {
  if (frames.length === 0) return new Blob();
  const width = frames[0].width;
  const height = frames[0].height;

  const gif = GIFEncoder();

  frames.forEach((canvas) => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;

    // Check if frame has transparent pixels (alpha < 128)
    let hasTransparency = false;
    for (let i = 3; i < data.length; i += 4) {
      if (data[i] < 128) {
        hasTransparency = true;
        break;
      }
    }

    let palette: number[][];
    let index: Uint8Array;
    let transparentIndex: number | undefined;

    if (hasTransparency) {
      // Reserve palette index 0 for transparent pixels
      // Quantize to 255 colors (leaving room for transparent)
      const opaqueData = new Uint8ClampedArray(data.length);
      for (let i = 0; i < data.length; i += 4) {
        if (data[i + 3] < 128) {
          // Temporarily set transparent pixels to black for quantization
          opaqueData[i] = 0;
          opaqueData[i + 1] = 0;
          opaqueData[i + 2] = 0;
          opaqueData[i + 3] = 255;
        } else {
          opaqueData[i] = data[i];
          opaqueData[i + 1] = data[i + 1];
          opaqueData[i + 2] = data[i + 2];
          opaqueData[i + 3] = data[i + 3];
        }
      }

      // Quantize opaque pixels to 255 colors
      palette = quantize(opaqueData, 255);

      // Add transparent color at index 0 (black with alpha marker)
      palette.unshift([0, 0, 0]);

      // Create index mapping
      index = new Uint8Array(width * height);
      for (let i = 0; i < width * height; i++) {
        const pixelIndex = i * 4;
        if (data[pixelIndex + 3] < 128) {
          // Transparent pixel maps to index 0
          index[i] = 0;
        } else {
          // Find closest color in palette (skip index 0 which is transparent)
          const r = data[pixelIndex];
          const g = data[pixelIndex + 1];
          const b = data[pixelIndex + 2];

          let closestIndex = 1;
          let minDistance = Infinity;

          for (let j = 1; j < palette.length; j++) {
            const [pr, pg, pb] = palette[j];
            const distance = Math.sqrt(
              (r - pr) ** 2 + (g - pg) ** 2 + (b - pb) ** 2
            );
            if (distance < minDistance) {
              minDistance = distance;
              closestIndex = j;
            }
          }
          index[i] = closestIndex;
        }
      }

      transparentIndex = 0;
    } else {
      // No transparency, use standard quantization
      palette = quantize(data, 256);
      index = applyPalette(data, palette);
    }

    // Write frame with optional transparency
    const options: any = { palette, delay: delayMs };
    if (transparentIndex !== undefined) {
      options.transparent = transparentIndex;
    }

    gif.writeFrame(index, width, height, options);
  });

  gif.finish();
  return new Blob([gif.bytes()], { type: 'image/gif' });
};
