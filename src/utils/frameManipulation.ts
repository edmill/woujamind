/**
 * Frame Manipulation Utilities
 * Functions for cropping, pasting, inserting, removing, and replacing frames
 */

import { loadImage } from './imageHelpers';

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

export const insertFrame = async (
  sheetSrc: string,
  newFrameSrc: string,
  insertIndex: number,
  position: 'before' | 'after',
  rows: number,
  cols: number
): Promise<{newSheetSrc: string, newCols: number}> => {
  // Load the sprite sheet image
  const sheetImg = await loadImage(sheetSrc);

  // Load the new frame image
  const newFrameImg = await loadImage(newFrameSrc);

  // Calculate frame dimensions
  const frameW = sheetImg.width / cols;
  const frameH = sheetImg.height / rows;
  const totalFrames = rows * cols;

  // Extract all existing frames
  const existingFrames: HTMLCanvasElement[] = [];
  for (let i = 0; i < totalFrames; i++) {
    const canvas = document.createElement('canvas');
    canvas.width = frameW;
    canvas.height = frameH;
    const ctx = canvas.getContext('2d')!;
    ctx.imageSmoothingEnabled = false;

    const col = i % cols;
    const row = Math.floor(i / cols);
    const srcX = col * frameW;
    const srcY = row * frameH;

    ctx.drawImage(sheetImg, srcX, srcY, frameW, frameH, 0, 0, frameW, frameH);
    existingFrames.push(canvas);
  }

  // Create canvas for new frame
  const newFrameCanvas = document.createElement('canvas');
  newFrameCanvas.width = frameW;
  newFrameCanvas.height = frameH;
  const newFrameCtx = newFrameCanvas.getContext('2d')!;
  newFrameCtx.imageSmoothingEnabled = false;
  newFrameCtx.drawImage(newFrameImg, 0, 0, frameW, frameH);

  // Determine actual insert position
  const actualInsertIndex = position === 'before' ? insertIndex : insertIndex + 1;

  // Insert the new frame
  const allFrames = [
    ...existingFrames.slice(0, actualInsertIndex),
    newFrameCanvas,
    ...existingFrames.slice(actualInsertIndex)
  ];

  // Calculate new grid dimensions
  const newTotalFrames = allFrames.length;
  const newCols = cols + 1;

  // Create new sprite sheet
  const newCanvas = document.createElement('canvas');
  newCanvas.width = frameW * newCols;
  newCanvas.height = frameH * rows;
  const ctx = newCanvas.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;

  // Draw all frames in the new grid
  for (let i = 0; i < newTotalFrames; i++) {
    const col = i % newCols;
    const row = Math.floor(i / newCols);
    const destX = col * frameW;
    const destY = row * frameH;

    ctx.drawImage(allFrames[i], 0, 0, frameW, frameH, destX, destY, frameW, frameH);
  }

  return {
    newSheetSrc: newCanvas.toDataURL('image/png'),
    newCols
  };
};

/**
 * Remove a frame from the sprite sheet
 * @param sheetSrc - Source sprite sheet data URL
 * @param removeIndex - Index of frame to remove (0-based)
 * @param rows - Number of rows in the grid
 * @param cols - Number of columns in the grid
 * @returns Promise<{newSheetSrc: string, newCols: number}> - New sprite sheet and updated column count
 */
export const removeFrame = async (
  sheetSrc: string,
  removeIndex: number,
  rows: number,
  cols: number
): Promise<{newSheetSrc: string, newCols: number}> => {
  // Load the sprite sheet image
  const sheetImg = await loadImage(sheetSrc);

  // Calculate frame dimensions
  const frameW = sheetImg.width / cols;
  const frameH = sheetImg.height / rows;
  const totalFrames = rows * cols;

  // IMPORTANT: Preserve original grid dimensions to maintain frame size
  // We keep the same number of columns - the removed frame slot will be empty/transparent
  const newCols = cols;

  // Create new sprite sheet with SAME dimensions as original
  const newCanvas = document.createElement('canvas');
  newCanvas.width = sheetImg.width;  // Keep exact original width
  newCanvas.height = sheetImg.height; // Keep exact original height
  const ctx = newCanvas.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;

  // Draw all frames in their ORIGINAL positions, skip the removed frame
  // This preserves the animation flow and character movement sequence
  for (let i = 0; i < totalFrames; i++) {
    if (i === removeIndex) {
      // Leave this slot empty/transparent - don't draw anything
      continue;
    }

    const col = i % cols;
    const row = Math.floor(i / cols);
    const srcX = col * frameW;
    const srcY = row * frameH;
    const destX = col * frameW;
    const destY = row * frameH;

    // Copy frame from original position to same position in new sheet
    ctx.drawImage(sheetImg, srcX, srcY, frameW, frameH, destX, destY, frameW, frameH);
  }

  return {
    newSheetSrc: newCanvas.toDataURL('image/png'),
    newCols
  };
};

/**
 * Replace a frame with a custom uploaded image
 * Automatically detects and applies the background color from existing frames
 * to ensure consistent styling across the sprite sheet
 *
 * @param sheetSrc - Source sprite sheet data URL
 * @param customImageSrc - Custom image to insert (data URL or file)
 * @param frameIndex - Index of frame to replace (0-based)
 * @param rows - Number of rows in the grid
 * @param cols - Number of columns in the grid
 * @returns Promise<string> - New sprite sheet data URL
 */
export const replaceFrameWithImage = async (
  sheetSrc: string,
  customImageSrc: string,
  frameIndex: number,
  rows: number,
  cols: number
): Promise<string> => {
  // Import getBackgroundColor dynamically to avoid circular dependencies
  const { getBackgroundColor } = await import('./imageHelpers');

  // Load the sprite sheet image
  const sheetImg = await loadImage(sheetSrc);

  // Load the custom image
  const customImg = await loadImage(customImageSrc);

  // Calculate frame dimensions
  const frameW = sheetImg.width / cols;
  const frameH = sheetImg.height / rows;

  // Create new sprite sheet (same dimensions)
  const newCanvas = document.createElement('canvas');
  newCanvas.width = sheetImg.width;
  newCanvas.height = sheetImg.height;
  const ctx = newCanvas.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;

  // Draw the entire original sprite sheet first
  ctx.drawImage(sheetImg, 0, 0);

  // Calculate position of the frame to replace
  const col = frameIndex % cols;
  const row = Math.floor(frameIndex / cols);
  const destX = col * frameW;
  const destY = row * frameH;

  // Detect background color from an adjacent frame (or first frame if this is the first)
  // Use a different frame to get accurate background color
  let sampleFrameIndex = frameIndex === 0 ? 1 : 0;
  const sampleCol = sampleFrameIndex % cols;
  const sampleRow = Math.floor(sampleFrameIndex / cols);

  // Create temp canvas to sample background color
  const tempSampleCanvas = document.createElement('canvas');
  tempSampleCanvas.width = frameW;
  tempSampleCanvas.height = frameH;
  const tempSampleCtx = tempSampleCanvas.getContext('2d')!;
  tempSampleCtx.imageSmoothingEnabled = false;
  tempSampleCtx.drawImage(
    sheetImg,
    sampleCol * frameW,
    sampleRow * frameH,
    frameW,
    frameH,
    0,
    0,
    frameW,
    frameH
  );

  // Get background color from sample frame
  const bgColor = getBackgroundColor(tempSampleCtx, frameW, frameH);

  // Clear the target frame area
  ctx.clearRect(destX, destY, frameW, frameH);

  // Fill with detected background color to match other frames
  if (bgColor) {
    ctx.fillStyle = `rgba(${bgColor.r}, ${bgColor.g}, ${bgColor.b}, ${bgColor.a / 255})`;
    ctx.fillRect(destX, destY, frameW, frameH);
  }

  // Draw the custom image, fitted to frame dimensions
  // Use contain fit to preserve aspect ratio
  const imgAspect = customImg.width / customImg.height;
  const frameAspect = frameW / frameH;

  let drawW, drawH, drawX, drawY;

  if (imgAspect > frameAspect) {
    // Image is wider - fit to width
    drawW = frameW;
    drawH = frameW / imgAspect;
    drawX = destX;
    drawY = destY + (frameH - drawH) / 2;
  } else {
    // Image is taller - fit to height
    drawH = frameH;
    drawW = frameH * imgAspect;
    drawX = destX + (frameW - drawW) / 2;
    drawY = destY;
  }

  ctx.drawImage(customImg, drawX, drawY, drawW, drawH);

  return newCanvas.toDataURL('image/png');
};
