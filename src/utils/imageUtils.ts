import { GIFEncoder, quantize, applyPalette } from 'gifenc';

// Helper to find the bounding box of non-transparent pixels OR non-background pixels
const getVisualBoundingBox = (
  ctx: CanvasRenderingContext2D, 
  width: number, 
  height: number, 
  bgColor: {r: number, g: number, b: number, a: number} | null = null
) => {
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  let minX = width, minY = height, maxX = 0, maxY = 0;
  let found = false;

  // More aggressive tolerance for better background detection
  const tolerance = 40;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];
      const a = data[idx + 3];

      let isContent = false;

      if (bgColor) {
        // If we have a target background color, check if this pixel is DIFFERENT enough
        if (a < 10) {
          isContent = false; // Transparent is always bg
        } else {
          // Calculate color distance using Euclidean distance for better accuracy
          const rDiff = r - bgColor.r;
          const gDiff = g - bgColor.g;
          const bDiff = b - bgColor.b;
          const colorDistance = Math.sqrt(rDiff * rDiff + gDiff * gDiff + bDiff * bDiff);
          
          // Pixel is content if color is significantly different from background
          isContent = colorDistance > tolerance;
        }
      } else {
        // Standard alpha check with higher threshold to ignore semi-transparent noise
        isContent = a > 30;
      }

      if (isContent) { 
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
        found = true;
      }
    }
  }

  if (!found) return null; // Empty frame
  
  // Add a 1-pixel padding to ensure we don't clip edges
  minX = Math.max(0, minX - 1);
  minY = Math.max(0, minY - 1);
  maxX = Math.min(width - 1, maxX + 1);
  maxY = Math.min(height - 1, maxY + 1);
  
  return { minX, minY, maxX, maxY, w: maxX - minX + 1, h: maxY - minY + 1 };
};

const getBackgroundColor = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
  // Sample multiple edge regions to get a more reliable background color
  const sampleSize = 3; // Sample 3x3 pixels in each corner
  const samples: number[][] = [];
  
  // Sample four corners with a small region
  const regions = [
    [0, 0], // Top-left
    [width - sampleSize, 0], // Top-right
    [0, height - sampleSize], // Bottom-left
    [width - sampleSize, height - sampleSize] // Bottom-right
  ];
  
  for (const [x, y] of regions) {
    try {
      const imgData = ctx.getImageData(Math.max(0, x), Math.max(0, y), sampleSize, sampleSize);
      for (let i = 0; i < imgData.data.length; i += 4) {
        if (imgData.data[i + 3] > 200) { // Opaque pixel
          samples.push([
            imgData.data[i],     // R
            imgData.data[i + 1], // G
            imgData.data[i + 2], // B
            imgData.data[i + 3]  // A
          ]);
        }
      }
    } catch (e) {
      // Ignore out of bounds errors
    }
  }
  
  if (samples.length === 0) return null; // All transparent
  
  // Average the sampled colors for a more robust background
  const avg = samples.reduce((acc, sample) => {
    acc[0] += sample[0];
    acc[1] += sample[1];
    acc[2] += sample[2];
    acc[3] += sample[3];
    return acc;
  }, [0, 0, 0, 0]);
  
  return { 
    r: Math.round(avg[0] / samples.length), 
    g: Math.round(avg[1] / samples.length), 
    b: Math.round(avg[2] / samples.length), 
    a: Math.round(avg[3] / samples.length) 
  };
}

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

// Simple Chroma Key-like background removal
const processRemoveBackground = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  
  // Sample top-left pixel
  const rBg = data[0];
  const gBg = data[1];
  const bBg = data[2];
  
  const tolerance = 40; 

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    if (
      Math.abs(r - rBg) < tolerance &&
      Math.abs(g - gBg) < tolerance &&
      Math.abs(b - bBg) < tolerance
    ) {
      data[i + 3] = 0; // Alpha to 0
    }
  }
  ctx.putImageData(imageData, 0, 0);
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

// --- SINGLE FRAME EDITING HELPERS ---

const loadImage = (src: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
};

export const cropFrame = async (imgSrc: string, frameIndex: number, rows: number, cols: number): Promise<string> => {
  const img = await loadImage(imgSrc);
  const frameW = Math.floor(img.naturalWidth / cols);
  const frameH = Math.floor(img.naturalHeight / rows);
  const row = Math.floor(frameIndex / cols);
  const col = frameIndex % cols;

  const canvas = document.createElement('canvas');
  canvas.width = frameW;
  canvas.height = frameH;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error("Context creation failed");
  ctx.imageSmoothingEnabled = false;

  ctx.drawImage(img, col * frameW, row * frameH, frameW, frameH, 0, 0, frameW, frameH);
  return canvas.toDataURL('image/png');
};

export const pasteFrame = async (sheetSrc: string, newFrameSrc: string, frameIndex: number, rows: number, cols: number): Promise<string> => {
  const [sheet, frame] = await Promise.all([loadImage(sheetSrc), loadImage(newFrameSrc)]);
  const frameW = Math.floor(sheet.naturalWidth / cols);
  const frameH = Math.floor(sheet.naturalHeight / rows);
  const row = Math.floor(frameIndex / cols);
  const col = frameIndex % cols;

  const canvas = document.createElement('canvas');
  canvas.width = sheet.naturalWidth;
  canvas.height = sheet.naturalHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error("Context creation failed");
  ctx.imageSmoothingEnabled = false;

  ctx.drawImage(sheet, 0, 0);
  ctx.clearRect(col * frameW, row * frameH, frameW, frameH);
  ctx.drawImage(frame, 0, 0, frame.width, frame.height, col * frameW, row * frameH, frameW, frameH);
  
  return canvas.toDataURL('image/png');
};

// --- GRID LINE DETECTION AND REMOVAL ---

/**
 * Detects if the sprite sheet has visible grid lines by analyzing row and column borders
 * Returns true if grid lines are detected
 */
const detectGridLines = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  rows: number,
  cols: number
): boolean => {
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  const frameW = Math.floor(width / cols);
  const frameH = Math.floor(height / rows);
  
  // Sample background color from corners
  const bgColor = getBackgroundColor(ctx, width, height);
  if (!bgColor) return false;
  
  const tolerance = 30;
  let gridLinePixels = 0;
  let totalSampled = 0;
  
  // Check vertical grid lines (between columns)
  for (let colIdx = 1; colIdx < cols; colIdx++) {
    const x = colIdx * frameW;
    for (let y = 0; y < height; y += 5) { // Sample every 5 pixels
      const idx = (y * width + x) * 4;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];
      const a = data[idx + 3];
      
      // Check if pixel is NOT background (could be grid line)
      if (a > 200) {
        const diff = Math.abs(r - bgColor.r) + Math.abs(g - bgColor.g) + Math.abs(b - bgColor.b);
        if (diff > tolerance * 3) {
          gridLinePixels++;
        }
      }
      totalSampled++;
    }
  }
  
  // Check horizontal grid lines (between rows)
  for (let rowIdx = 1; rowIdx < rows; rowIdx++) {
    const y = rowIdx * frameH;
    for (let x = 0; x < width; x += 5) { // Sample every 5 pixels
      const idx = (y * width + x) * 4;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];
      const a = data[idx + 3];
      
      if (a > 200) {
        const diff = Math.abs(r - bgColor.r) + Math.abs(g - bgColor.g) + Math.abs(b - bgColor.b);
        if (diff > tolerance * 3) {
          gridLinePixels++;
        }
      }
      totalSampled++;
    }
  }
  
  // If more than 20% of sampled border pixels are non-background, likely grid lines
  return totalSampled > 0 && (gridLinePixels / totalSampled) > 0.2;
};

/**
 * Removes grid lines from a sprite sheet by erasing pixels along grid borders
 */
const removeGridLines = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  rows: number,
  cols: number
): void => {
  const frameW = Math.floor(width / cols);
  const frameH = Math.floor(height / rows);
  const bgColor = getBackgroundColor(ctx, width, height);
  
  if (!bgColor) return;
  
  const fillStyle = `rgba(${bgColor.r}, ${bgColor.g}, ${bgColor.b}, ${bgColor.a / 255})`;
  ctx.fillStyle = fillStyle;
  
  // Erase vertical grid lines (2px width for safety)
  for (let colIdx = 1; colIdx < cols; colIdx++) {
    const x = colIdx * frameW;
    ctx.fillRect(x - 1, 0, 2, height);
  }
  
  // Erase horizontal grid lines (2px height for safety)
  for (let rowIdx = 1; rowIdx < rows; rowIdx++) {
    const y = rowIdx * frameH;
    ctx.fillRect(0, y - 1, width, 2);
  }
};

/**
 * Post-processes a generated sprite sheet to clean up common AI issues:
 * - Removes visible grid lines
 * - Validates background color (converts magenta to white)
 * - Returns cleaned image data URL
 */
export const cleanSpriteSheet = async (
  imageSrc: string,
  rows: number,
  cols: number
): Promise<{ cleaned: string; hadIssues: boolean; issues: string[] }> => {
  const img = await loadImage(imageSrc);
  const canvas = document.createElement('canvas');
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext('2d');
  
  if (!ctx) {
    return { cleaned: imageSrc, hadIssues: false, issues: [] };
  }
  
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(img, 0, 0);
  
  const issues: string[] = [];
  let hadIssues = false;
  
  // Check for magenta background (#FF00FF)
  const bgColor = getBackgroundColor(ctx, canvas.width, canvas.height);
  if (bgColor) {
    const isMagenta = bgColor.r > 240 && bgColor.g < 20 && bgColor.b > 240;
    if (isMagenta) {
      issues.push('Magenta background detected - converting to white');
      hadIssues = true;
      
      // Replace magenta with white
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const a = data[i + 3];
        
        // Detect magenta pixels
        if (a > 200 && r > 240 && g < 50 && b > 240) {
          data[i] = 255;     // R
          data[i + 1] = 255; // G
          data[i + 2] = 255; // B
        }
      }
      ctx.putImageData(imageData, 0, 0);
    }
  }
  
  // Check for grid lines
  const hasGridLines = detectGridLines(ctx, canvas.width, canvas.height, rows, cols);
  if (hasGridLines) {
    issues.push('Grid lines detected - removing');
    hadIssues = true;
    removeGridLines(ctx, canvas.width, canvas.height, rows, cols);
  }
  
  return {
    cleaned: canvas.toDataURL('image/png'),
    hadIssues,
    issues
  };
};

// --- ALIGNMENT LOGIC ---

export const alignFrameInSheet = async (
  sheetSrc: string,
  frameIndex: number,
  rows: number,
  cols: number
): Promise<string> => {
  const sheet = await loadImage(sheetSrc);
  const frameW = Math.floor(sheet.naturalWidth / cols);
  const frameH = Math.floor(sheet.naturalHeight / rows);
  const row = Math.floor(frameIndex / cols);
  const col = frameIndex % cols;

  const canvas = document.createElement('canvas');
  canvas.width = sheet.naturalWidth;
  canvas.height = sheet.naturalHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error("Context creation failed");
  ctx.imageSmoothingEnabled = false;

  // 1. Draw full base sheet
  ctx.drawImage(sheet, 0, 0);

  // 2. Extract specific frame data to analyze bbox
  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = frameW;
  tempCanvas.height = frameH;
  const tempCtx = tempCanvas.getContext('2d');
  if(!tempCtx) return sheetSrc;
  tempCtx.imageSmoothingEnabled = false;
  
  // Draw only the frame to temp
  tempCtx.drawImage(sheet, col * frameW, row * frameH, frameW, frameH, 0, 0, frameW, frameH);
  
  // 3. Detect background color (from top-left of this specific frame)
  const bgColor = getBackgroundColor(tempCtx, frameW, frameH);

  // 4. Get BBox (passing bgColor so we ignore it)
  const bbox = getVisualBoundingBox(tempCtx, frameW, frameH, bgColor);

  if (bbox) {
    // 5. Clear slot on main canvas
    ctx.clearRect(col * frameW, row * frameH, frameW, frameH);

    // 6. If we found a background color, FILL the cleared slot with it 
    //    so we don't leave a transparent hole in a solid sheet.
    if (bgColor) {
      ctx.fillStyle = `rgba(${bgColor.r}, ${bgColor.g}, ${bgColor.b}, ${bgColor.a / 255})`;
      ctx.fillRect(col * frameW, row * frameH, frameW, frameH);
    }

    // 7. Calculate Centered Position with improved algorithm
    // Center horizontally
    const destX = Math.floor((frameW - bbox.w) / 2);
    
    // Vertical positioning: use bottom alignment with consistent padding
    // This ensures all sprites "stand" at the same baseline
    const paddingBottom = Math.max(
      Math.floor(frameH * 0.08), // At least 8% padding from bottom
      4 // Minimum 4 pixels
    );
    const destY = Math.floor(frameH - bbox.h - paddingBottom);
    
    // Ensure sprite doesn't go off top of frame
    const finalDestY = Math.max(2, destY); // At least 2px from top

    // 8. Draw sprite back centered with anti-aliasing disabled for pixel-perfect rendering
    // We use the tempCanvas but strictly the bbox area
    ctx.drawImage(
      tempCanvas,
      bbox.minX, bbox.minY, bbox.w, bbox.h,
      (col * frameW) + destX, (row * frameH) + finalDestY, bbox.w, bbox.h
    );
  }

  return canvas.toDataURL('image/png');
}

export const alignWholeSheet = async (
  sheetSrc: string,
  rows: number,
  cols: number
): Promise<string> => {
  const sheet = await loadImage(sheetSrc);
  const frameW = Math.floor(sheet.naturalWidth / cols);
  const frameH = Math.floor(sheet.naturalHeight / rows);
  
  const canvas = document.createElement('canvas');
  canvas.width = sheet.naturalWidth;
  canvas.height = sheet.naturalHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error("Context creation failed");
  ctx.imageSmoothingEnabled = false;

  // Iterate all frames
  for (let i = 0; i < rows * cols; i++) {
    const row = Math.floor(i / cols);
    const col = i % cols;
    const destSheetX = col * frameW;
    const destSheetY = row * frameH;

    // 1. Extract raw frame data
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = frameW;
    tempCanvas.height = frameH;
    const tempCtx = tempCanvas.getContext('2d');
    if (!tempCtx) continue;
    tempCtx.imageSmoothingEnabled = false;
    
    tempCtx.drawImage(sheet, destSheetX, destSheetY, frameW, frameH, 0, 0, frameW, frameH);

    // 2. Detect BG
    const bgColor = getBackgroundColor(tempCtx, frameW, frameH);

    // 3. Get BBox
    const bbox = getVisualBoundingBox(tempCtx, frameW, frameH, bgColor);

    if (bgColor) {
      ctx.fillStyle = `rgba(${bgColor.r}, ${bgColor.g}, ${bgColor.b}, ${bgColor.a / 255})`;
      ctx.fillRect(destSheetX, destSheetY, frameW, frameH);
    } else {
       ctx.clearRect(destSheetX, destSheetY, frameW, frameH);
    }

    if (bbox) {
       // Calculate alignment with improved consistency
       // Center horizontally
       const alignX = Math.floor((frameW - bbox.w) / 2);
       
       // Bottom alignment with consistent padding
       const paddingBottom = Math.max(
         Math.floor(frameH * 0.08), // At least 8% padding from bottom
         4 // Minimum 4 pixels
       );
       const alignY = Math.floor(frameH - bbox.h - paddingBottom);
       
       // Ensure sprite doesn't go off top of frame
       const finalAlignY = Math.max(2, alignY); // At least 2px from top

       ctx.drawImage(
         tempCanvas,
         bbox.minX, bbox.minY, bbox.w, bbox.h,
         destSheetX + alignX, destSheetY + finalAlignY, bbox.w, bbox.h
       );
    } else {
       // Empty or noise only - copy original just in case
       ctx.drawImage(tempCanvas, 0, 0, frameW, frameH, destSheetX, destSheetY, frameW, frameH);
    }
  }
  
  return canvas.toDataURL('image/png');
};

