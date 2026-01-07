/**
 * Download utilities for sprite sheets
 * Handles PNG, GIF, and WebM exports
 */
import { GIFEncoder, quantize, applyPalette } from 'gifenc';

/**
 * Check if a frame (ImageData) is empty
 */
function isImageDataEmpty(imageData: ImageData, threshold: number = 10): boolean {
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
  
  return contentPixels < threshold;
}

/**
 * Download sprite sheet as PNG
 */
export function downloadSpriteSheetPNG(dataUrl: string, filename: string) {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename.endsWith('.png') ? filename : `${filename}.png`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Extract frames from sprite sheet (filters out empty frames)
 */
async function extractFrames(
  imageDataUrl: string,
  rows: number,
  cols: number
): Promise<ImageData[]> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const frameWidth = img.width / cols;
      const frameHeight = img.height / rows;
      const frames: ImageData[] = [];

      const canvas = document.createElement('canvas');
      canvas.width = frameWidth;
      canvas.height = frameHeight;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });

      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }

      // Extract each frame
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          ctx.clearRect(0, 0, frameWidth, frameHeight);
          ctx.drawImage(
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
          const imageData = ctx.getImageData(0, 0, frameWidth, frameHeight);
          
          // Only add non-empty frames to prevent flickering
          if (!isImageDataEmpty(imageData)) {
            frames.push(imageData);
          }
        }
      }

      console.log(`[downloadUtils] Extracted ${frames.length} non-empty frames from ${rows * cols} total frames`);
      resolve(frames);
    };
    img.onerror = reject;
    img.src = imageDataUrl;
  });
}

/**
 * Download sprite sheet as animated GIF
 */
export async function downloadSpriteSheetGIF(
  imageDataUrl: string,
  filename: string,
  rows: number,
  cols: number,
  fps: number = 8
) {
  try {
    const frames = await extractFrames(imageDataUrl, rows, cols);
    if (frames.length === 0) {
      throw new Error('No frames extracted');
    }

    const delay = Math.round(1000 / fps); // Convert FPS to delay in ms
    const { width, height } = frames[0];

    // Create GIF encoder
    const gif = GIFEncoder();

    // Encode each frame
    for (const frame of frames) {
      const { data } = frame;

      // Quantize colors (reduce to 256 colors for GIF)
      const palette = quantize(data, 256);
      const index = applyPalette(data, palette);

      gif.writeFrame(index, width, height, {
        palette,
        delay,
        transparent: true,
        transparentIndex: 0,
      });
    }

    gif.finish();

    // Create blob and download
    const blob = new Blob([gif.bytes()], { type: 'image/gif' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename.endsWith('.gif') ? filename : `${filename}.gif`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Failed to create GIF:', error);
    throw error;
  }
}

/**
 * Download sprite sheet as WebM video
 */
export async function downloadSpriteSheetWebM(
  imageDataUrl: string,
  filename: string,
  rows: number,
  cols: number,
  fps: number = 8
) {
  try {
    const frames = await extractFrames(imageDataUrl, rows, cols);
    if (frames.length === 0) {
      throw new Error('No frames extracted');
    }

    const { width, height } = frames[0];
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('Failed to get canvas context');
    }

    // Create video stream from canvas
    const stream = canvas.captureStream(fps);
    const mediaRecorder = new MediaRecorder(stream, {
      mimeType: 'video/webm;codecs=vp9',
      videoBitsPerSecond: 2500000,
    });

    const chunks: Blob[] = [];

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunks.push(event.data);
      }
    };

    mediaRecorder.onstop = () => {
      const blob = new Blob(chunks, { type: 'video/webm' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename.endsWith('.webm') ? filename : `${filename}.webm`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    };

    mediaRecorder.start();

    // Draw frames at the specified FPS
    const frameDuration = 1000 / fps;
    let frameIndex = 0;

    const drawFrame = () => {
      if (frameIndex < frames.length) {
        ctx.putImageData(frames[frameIndex], 0, 0);
        frameIndex++;
        setTimeout(drawFrame, frameDuration);
      } else {
        // Loop through frames 2 more times for a total of 3 loops
        if (frameIndex < frames.length * 3) {
          frameIndex = frameIndex % frames.length;
          ctx.putImageData(frames[frameIndex], 0, 0);
          frameIndex++;
          setTimeout(drawFrame, frameDuration);
        } else {
          // Stop recording after 3 loops
          setTimeout(() => mediaRecorder.stop(), 100);
        }
      }
    };

    drawFrame();
  } catch (error) {
    console.error('Failed to create WebM:', error);
    throw error;
  }
}

/**
 * Get clean filename without extension
 */
export function getCleanFilename(name: string): string {
  return name.replace(/\.[^/.]+$/, '');
}
