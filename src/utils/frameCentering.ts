/**
 * Frame Centering Service for Woujamind
 * Auto-centers character frames to ensure smooth animation across all directions
 * 
 * CRITICAL: Fixes animation jumping/drifting by detecting character bounds
 * and centering every frame consistently.
 * 
 * Usage:
 *   const service = new FrameCenteringService({ targetWidth: 256, targetHeight: 256 });
 *   const centeredFrames = await service.centerFramesBatch(frames);
 */

export interface FrameCenteringOptions {
  targetWidth?: number;
  targetHeight?: number;
  paddingPercent?: number;
  debug?: boolean;
}

export interface CharacterBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Frame Centering Service
 * Detects character bounding box and centers within frame for smooth animations
 */
export class FrameCenteringService {
  private targetWidth: number;
  private targetHeight: number;
  private paddingPercent: number;
  private debug: boolean;

  constructor(options: FrameCenteringOptions = {}) {
    this.targetWidth = options.targetWidth ?? 256;
    this.targetHeight = options.targetHeight ?? 256;
    this.paddingPercent = options.paddingPercent ?? 0.1; // 10% padding
    this.debug = options.debug ?? false;
  }

  /**
   * Detect character bounding box using HSV color-based segmentation
   * 
   * Assumes:
   * - Character is colored (red, blue, green, etc.)
   * - Background is white or light gray
   * 
   * Returns: { x, y, width, height } of bounding box
   *          Returns full frame if detection fails
   */
  detectCharacterBounds(canvas: HTMLCanvasElement): CharacterBounds {
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) {
      console.error('[FrameCentering] Failed to get canvas context');
      return { x: 0, y: 0, width: canvas.width, height: canvas.height };
    }

    const width = canvas.width;
    const height = canvas.height;
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;

    // Create mask for background pixels
    // Detects: White/light gray OR bright green chroma key
    const characterMask = new Uint8Array(width * height);
    
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const a = data[i + 3];

      // Skip fully transparent pixels
      if (a < 10) {
        characterMask[i / 4] = 0;
        continue;
      }

      // Calculate brightness and saturation
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      const brightness = max;
      const saturation = max === 0 ? 0 : ((max - min) / max) * 255;

      // Background detection:
      // 1. White/light gray: High brightness (>200) AND low saturation (<50)
      const isWhiteBackground = brightness > 200 && saturation < 50;
      
      // 2. Bright green chroma key: Green dominant (multiple thresholds for robustness)
      //    - Bright green: g > 150 && g > r*1.3 && g > b*1.3
      //    - Medium green: g > 100 && g > r*1.2 && g > b*1.2
      //    - Any green-ish: g > r && g > b && g > 80
      const isBrightGreen = g > 150 && g > r * 1.3 && g > b * 1.3;
      const isMediumGreen = g > 100 && g > r * 1.2 && g > b * 1.2;
      const isAnyGreen = g > r && g > b && g > 80;
      const isGreenScreen = isBrightGreen || isMediumGreen || isAnyGreen;
      
      const isBackground = isWhiteBackground || isGreenScreen;
      
      // Character pixels are non-background
      characterMask[i / 4] = isBackground ? 0 : 255;
    }

    // Apply morphological operations to clean up noise
    const cleaned = this.morphologyClose(characterMask, width, height, 5);
    const opened = this.morphologyOpen(cleaned, width, height, 3);

    // Find bounding box of character pixels
    let minX = width;
    let minY = height;
    let maxX = 0;
    let maxY = 0;
    let pixelCount = 0;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = y * width + x;
        if (opened[idx] > 0) {
          minX = Math.min(minX, x);
          minY = Math.min(minY, y);
          maxX = Math.max(maxX, x);
          maxY = Math.max(maxY, y);
          pixelCount++;
        }
      }
    }

    // Validate bounds are reasonable
    if (pixelCount === 0 || minX >= maxX || minY >= maxY) {
      console.warn('[FrameCentering] No character pixels detected, using full frame');
      return { x: 0, y: 0, width, height };
    }

    const bboxWidth = maxX - minX + 1;
    const bboxHeight = maxY - minY + 1;
    const frameArea = width * height;
    const charArea = bboxWidth * bboxHeight;

    // Sanity check: character should be at least 1% of frame
    if (bboxWidth < 10 || bboxHeight < 10 || charArea < (frameArea * 0.01)) {
      console.warn(`[FrameCentering] Character bounds too small (${bboxWidth}x${bboxHeight}), using full frame`);
      return { x: 0, y: 0, width, height };
    }

    if (this.debug) {
      console.log(`[FrameCentering] Detected character bounds: x=${minX}, y=${minY}, w=${bboxWidth}, h=${bboxHeight}`);
    }

    return { x: minX, y: minY, width: bboxWidth, height: bboxHeight };
  }

  /**
   * Morphological closing: dilation followed by erosion
   * Fills small holes in character mask
   */
  private morphologyClose(mask: Uint8Array, width: number, height: number, kernelSize: number): Uint8Array {
    const dilated = this.dilate(mask, width, height, kernelSize);
    return this.erode(dilated, width, height, kernelSize);
  }

  /**
   * Morphological opening: erosion followed by dilation
   * Removes small noise pixels
   */
  private morphologyOpen(mask: Uint8Array, width: number, height: number, kernelSize: number): Uint8Array {
    const eroded = this.erode(mask, width, height, kernelSize);
    return this.dilate(eroded, width, height, kernelSize);
  }

  /**
   * Dilation: expand white regions
   */
  private dilate(mask: Uint8Array, width: number, height: number, kernelSize: number): Uint8Array {
    const result = new Uint8Array(mask.length);
    const radius = Math.floor(kernelSize / 2);

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        let maxVal = 0;
        
        for (let ky = -radius; ky <= radius; ky++) {
          for (let kx = -radius; kx <= radius; kx++) {
            const ny = y + ky;
            const nx = x + kx;
            
            if (ny >= 0 && ny < height && nx >= 0 && nx < width) {
              const idx = ny * width + nx;
              maxVal = Math.max(maxVal, mask[idx]);
            }
          }
        }
        
        result[y * width + x] = maxVal;
      }
    }

    return result;
  }

  /**
   * Erosion: shrink white regions
   */
  private erode(mask: Uint8Array, width: number, height: number, kernelSize: number): Uint8Array {
    const result = new Uint8Array(mask.length);
    const radius = Math.floor(kernelSize / 2);

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        let minVal = 255;
        
        for (let ky = -radius; ky <= radius; ky++) {
          for (let kx = -radius; kx <= radius; kx++) {
            const ny = y + ky;
            const nx = x + kx;
            
            if (ny >= 0 && ny < height && nx >= 0 && nx < width) {
              const idx = ny * width + nx;
              minVal = Math.min(minVal, mask[idx]);
            }
          }
        }
        
        result[y * width + x] = minVal;
      }
    }

    return result;
  }

  /**
   * Center character in frame and resize to target dimensions
   * 
   * Process:
   * 1. Detect character bounding box
   * 2. Add intelligent padding around character
   * 3. Crop character region with padding
   * 4. Resize to target aspect ratio (preserving aspect ratio)
   * 5. Center on white canvas
   */
  centerFrame(canvas: HTMLCanvasElement): HTMLCanvasElement {
    console.log('[FrameCentering] centerFrame called - input:', canvas.width, 'x', canvas.height);
    try {
      const bounds = this.detectCharacterBounds(canvas);
      console.log('[FrameCentering] Detected bounds:', bounds);
      
      const originalWidth = canvas.width;
      const originalHeight = canvas.height;

      // Add padding around character (percentage of character size)
      const padding = Math.max(
        Math.floor(Math.max(bounds.width, bounds.height) * this.paddingPercent),
        5
      );

      // Calculate crop region with padding
      const cropX = Math.max(0, bounds.x - padding);
      const cropY = Math.max(0, bounds.y - padding);
      const cropW = Math.min(originalWidth - cropX, bounds.width + 2 * padding);
      const cropH = Math.min(originalHeight - cropY, bounds.height + 2 * padding);

      // Ensure valid crop dimensions
      if (cropW <= 0 || cropH <= 0) {
        console.warn('[FrameCentering] Invalid crop dimensions, returning resized original');
        return this.resizeCanvas(canvas, this.targetWidth, this.targetHeight);
      }

      // Extract cropped region
      const croppedCanvas = document.createElement('canvas');
      croppedCanvas.width = cropW;
      croppedCanvas.height = cropH;
      const croppedCtx = croppedCanvas.getContext('2d', { alpha: true });
      
      if (!croppedCtx) {
        throw new Error('Failed to create cropped canvas context');
      }

      croppedCtx.imageSmoothingEnabled = true;
      croppedCtx.imageSmoothingQuality = 'high';
      croppedCtx.drawImage(canvas, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);

      // Calculate aspect ratio of cropped region
      const aspectRatio = cropW / cropH;
      const targetAspect = this.targetWidth / this.targetHeight;

      // Calculate new dimensions to fit target while preserving aspect ratio
      let newWidth: number;
      let newHeight: number;

      if (aspectRatio > targetAspect) {
        // Wider than target - fit to width
        newWidth = this.targetWidth;
        newHeight = Math.round(newWidth / aspectRatio);
      } else {
        // Taller than target - fit to height
        newHeight = this.targetHeight;
        newWidth = Math.round(newHeight * aspectRatio);
      }

      // Ensure dimensions are valid
      newWidth = Math.max(1, Math.min(newWidth, this.targetWidth));
      newHeight = Math.max(1, Math.min(newHeight, this.targetHeight));

      // Resize using high-quality interpolation
      const resizedCanvas = document.createElement('canvas');
      resizedCanvas.width = newWidth;
      resizedCanvas.height = newHeight;
      const resizedCtx = resizedCanvas.getContext('2d', { alpha: true });
      
      if (!resizedCtx) {
        throw new Error('Failed to create resized canvas context');
      }

      resizedCtx.imageSmoothingEnabled = true;
      resizedCtx.imageSmoothingQuality = 'high';
      resizedCtx.drawImage(croppedCanvas, 0, 0, newWidth, newHeight);

      // Create white canvas with target dimensions
      const outputCanvas = document.createElement('canvas');
      outputCanvas.width = this.targetWidth;
      outputCanvas.height = this.targetHeight;
      const outputCtx = outputCanvas.getContext('2d', { alpha: true });
      
      if (!outputCtx) {
        throw new Error('Failed to create output canvas context');
      }

      // Fill with white background
      outputCtx.fillStyle = '#FFFFFF';
      outputCtx.fillRect(0, 0, this.targetWidth, this.targetHeight);

      // Calculate offset to center resized image on canvas
      const offsetX = Math.floor((this.targetWidth - newWidth) / 2);
      const offsetY = Math.floor((this.targetHeight - newHeight) / 2);

      // Place resized character on centered position
      outputCtx.drawImage(resizedCanvas, offsetX, offsetY);

      if (this.debug) {
        console.log(
          `[FrameCentering] Frame centering: crop(${cropW}x${cropH}) -> ` +
          `resize(${newWidth}x${newHeight}) @ offset(${offsetX},${offsetY}) -> ` +
          `canvas(${this.targetWidth}x${this.targetHeight})`
        );
      }

      return outputCanvas;

    } catch (error) {
      console.error('[FrameCentering] Error in centerFrame:', error);
      return this.resizeCanvas(canvas, this.targetWidth, this.targetHeight);
    }
  }

  /**
   * Simple resize fallback
   */
  private resizeCanvas(canvas: HTMLCanvasElement, width: number, height: number): HTMLCanvasElement {
    const resized = document.createElement('canvas');
    resized.width = width;
    resized.height = height;
    const ctx = resized.getContext('2d', { alpha: true });
    
    if (!ctx) {
      return canvas;
    }

    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, width, height);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(canvas, 0, 0, width, height);
    
    return resized;
  }

  /**
   * Center multiple frames in batch with error handling
   * Returns array of centered canvases
   */
  async centerFramesBatch(frames: HTMLCanvasElement[]): Promise<HTMLCanvasElement[]> {
    const centeredFrames: HTMLCanvasElement[] = [];
    let errors = 0;

    console.log(`[FrameCentering] Starting batch centering of ${frames.length} frames`);

    for (let i = 0; i < frames.length; i++) {
      try {
        const centered = this.centerFrame(frames[i]);
        centeredFrames.push(centered);
        
        if (this.debug && i % 10 === 0) {
          console.log(`[FrameCentering] Progress: ${i + 1}/${frames.length} frames centered`);
        }
      } catch (error) {
        console.error(`[FrameCentering] Failed to center frame ${i}:`, error);
        errors++;
        
        // Fallback: use resized original
        const fallback = this.resizeCanvas(frames[i], this.targetWidth, this.targetHeight);
        centeredFrames.push(fallback);
      }
    }

    if (errors > 0) {
      console.warn(`[FrameCentering] Centering completed with ${errors}/${frames.length} errors using fallback`);
    } else {
      console.log(`[FrameCentering] Successfully centered all ${frames.length} frames`);
    }

    return centeredFrames;
  }

  /**
   * Visualize character bounds detection for debugging
   * Returns canvas with bounding box drawn in green
   */
  visualizeBounds(canvas: HTMLCanvasElement): HTMLCanvasElement {
    const bounds = this.detectCharacterBounds(canvas);
    
    const debugCanvas = document.createElement('canvas');
    debugCanvas.width = canvas.width;
    debugCanvas.height = canvas.height;
    const ctx = debugCanvas.getContext('2d');
    
    if (!ctx) {
      return canvas;
    }

    // Draw original frame
    ctx.drawImage(canvas, 0, 0);

    // Draw bounding box
    ctx.strokeStyle = '#00FF00';
    ctx.lineWidth = 3;
    ctx.strokeRect(bounds.x, bounds.y, bounds.width, bounds.height);

    // Draw center point
    const centerX = bounds.x + bounds.width / 2;
    const centerY = bounds.y + bounds.height / 2;
    ctx.fillStyle = '#FF0000';
    ctx.beginPath();
    ctx.arc(centerX, centerY, 5, 0, 2 * Math.PI);
    ctx.fill();

    return debugCanvas;
  }
}

/**
 * Convenience function for one-off centering
 */
export const centerFrames = async (
  frames: HTMLCanvasElement[],
  options?: FrameCenteringOptions
): Promise<HTMLCanvasElement[]> => {
  const service = new FrameCenteringService(options);
  return service.centerFramesBatch(frames);
};

