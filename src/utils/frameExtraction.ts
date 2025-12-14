/**
 * Frame Extraction and GIF Creation Utilities
 * Functions for extracting frames from sprite sheets and creating GIFs
 */

import { GIFEncoder, quantize, applyPalette } from 'gifenc';
import { processRemoveBackground } from './imageHelpers';

export const extractFrames = (
  img: HTMLImageElement,
  rows: number,
  cols: number,
  count: number,
  removeBackground: boolean = false
): HTMLCanvasElement[] => {
  const frames: HTMLCanvasElement[] = [];
  const frameWidth = Math.floor(img.naturalWidth / cols);
  const frameHeight = Math.floor(img.naturalHeight / rows);

  for (let i = 0; i < count; i++) {
    const row = Math.floor(i / cols);
    const col = i % cols;

    if (row >= rows) break;

    const canvas = document.createElement('canvas');
    canvas.width = frameWidth;
    canvas.height = frameHeight;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });

    if (ctx) {
      ctx.imageSmoothingEnabled = false;

      // 1. Draw raw frame to temp canvas
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = frameWidth;
      tempCanvas.height = frameHeight;
      const tempCtx = tempCanvas.getContext('2d', { willReadFrequently: true });

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
        processRemoveBackground(tempCtx, frameWidth, frameHeight);
      }

      ctx.drawImage(tempCanvas, 0, 0);

      frames.push(canvas);
    }
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

    // Quantize colors
    const palette = quantize(imageData.data, 256);
    const index = applyPalette(imageData.data, palette);

    gif.writeFrame(index, width, height, { palette, delay: delayMs });
  });

  gif.finish();
  return new Blob([gif.bytes()], { type: 'image/gif' });
};
