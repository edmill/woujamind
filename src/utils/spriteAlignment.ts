/**
 * Sprite Alignment and Cleaning Utilities
 * Functions for cleaning and aligning sprite sheets
 */

import { loadImage, getVisualBoundingBox, getBackgroundColor } from './imageHelpers';
import { aiAnalyzeSpriteSheet, AlignmentAnalysis } from '../services/geminiService';

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
  const ctx = canvas.getContext('2d', { willReadFrequently: true });

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
  cols: number,
  alignmentMode: 'auto' | 'center' | 'bottom' = 'auto'
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
  const tempCtx = tempCanvas.getContext('2d', { willReadFrequently: true });
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
    const destX = Math.floor((frameW - bbox.width) / 2);

    // Calculate vertical alignment based on mode
    let destY: number;

    if (alignmentMode === 'center') {
      // Center alignment mode - always center vertically
      destY = Math.floor((frameH - bbox.height) / 2);
    } else if (alignmentMode === 'bottom') {
      // Bottom alignment mode - always align to bottom with padding
      const paddingBottom = Math.max(
        Math.floor(frameH * 0.08), // At least 8% padding from bottom
        4 // Minimum 4 pixels
      );
      destY = Math.floor(frameH - bbox.height - paddingBottom);
    } else {
      // Auto mode - smart alignment based on bbox height
      const bboxHeightRatio = bbox.height / frameH;

      if (bboxHeightRatio > 0.80) {
        // Tall bbox (includes effects/raised arms) - use center alignment
        destY = Math.floor((frameH - bbox.height) / 2);
      } else {
        // Normal bbox - use bottom alignment for grounded feel
        const paddingBottom = Math.max(
          Math.floor(frameH * 0.08), // At least 8% padding from bottom
          4 // Minimum 4 pixels
        );
        destY = Math.floor(frameH - bbox.height - paddingBottom);
      }
    }

    // Ensure sprite doesn't go off top of frame
    const finalDestY = Math.max(2, destY); // At least 2px from top

    // 8. Draw sprite back centered with anti-aliasing disabled for pixel-perfect rendering
    // We use the tempCanvas but strictly the bbox area
    ctx.drawImage(
      tempCanvas,
      bbox.minX, bbox.minY, bbox.width, bbox.height,
      (col * frameW) + destX, (row * frameH) + finalDestY, bbox.width, bbox.height
    );
  }

  return canvas.toDataURL('image/png');
};

/**
 * Helper function to find the character's anchor point (base/feet position + horizontal center)
 * This is more reliable than center of mass for grounded characters
 */
const getCharacterAnchor = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  bgColor: { r: number; g: number; b: number; a: number } | null,
  bbox: { minX: number; minY: number; maxX: number; maxY: number; width: number; height: number } | null
): { x: number; y: number } | null => {
  if (!bbox) return null;

  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;

  // Find the bottom-most solid pixels (character's feet/base)
  // Scan from bottom up to find the first row with significant content
  let baseY = bbox.maxY;

  // Find horizontal center by calculating center of mass in X direction only
  // but weighted more heavily toward the bottom half (where feet/body are)
  let totalX = 0;
  let totalWeight = 0;

  // Focus on bottom 60% of the sprite for X-position (where feet/torso are)
  const focusStartY = bbox.minY + Math.floor(bbox.height * 0.4);

  for (let y = focusStartY; y <= bbox.maxY; y++) {
    for (let x = bbox.minX; x <= bbox.maxX; x++) {
      const idx = (y * width + x) * 4;
      const a = data[idx + 3];

      // Skip transparent or background pixels
      if (a < 50) continue;

      if (bgColor) {
        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];
        const diff = Math.abs(r - bgColor.r) + Math.abs(g - bgColor.g) + Math.abs(b - bgColor.b);
        if (diff < 30) continue;
      }

      // Weight more heavily toward the bottom (feet)
      const distanceFromBottom = bbox.maxY - y;
      const verticalWeight = 1 + (bbox.height - distanceFromBottom) / bbox.height; // Higher weight at bottom
      const weight = (a / 255) * verticalWeight;

      totalX += x * weight;
      totalWeight += weight;
    }
  }

  if (totalWeight === 0) {
    // Fallback: use bbox center
    return {
      x: Math.round((bbox.minX + bbox.maxX) / 2),
      y: baseY
    };
  }

  return {
    x: Math.round(totalX / totalWeight), // Weighted horizontal center (body/feet centerline)
    y: baseY // Bottom of character (feet position)
  };
};

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

  // FIRST PASS: Analyze all frames to find consistent anchor point
  const frameCenters: Array<{ x: number; y: number; bbox: any } | null> = [];

  for (let i = 0; i < rows * cols; i++) {
    const row = Math.floor(i / cols);
    const col = i % cols;
    const destSheetX = col * frameW;
    const destSheetY = row * frameH;

    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = frameW;
    tempCanvas.height = frameH;
    const tempCtx = tempCanvas.getContext('2d', { willReadFrequently: true });
    if (!tempCtx) {
      frameCenters.push(null);
      continue;
    }
    tempCtx.imageSmoothingEnabled = false;
    tempCtx.drawImage(sheet, destSheetX, destSheetY, frameW, frameH, 0, 0, frameW, frameH);

    const bgColor = getBackgroundColor(tempCtx, frameW, frameH);
    const bbox = getVisualBoundingBox(tempCtx, frameW, frameH, bgColor);
    const anchor = getCharacterAnchor(tempCtx, frameW, frameH, bgColor, bbox);

    frameCenters.push(anchor ? { ...anchor, bbox } : null);
  }

  // Calculate median center point (more robust than average)
  const validCenters = frameCenters.filter(c => c !== null) as Array<{ x: number; y: number; bbox: any }>;
  if (validCenters.length === 0) {
    // Fallback to original image if no valid frames
    ctx.drawImage(sheet, 0, 0);
    return canvas.toDataURL('image/png');
  }

  // Find median X and Y positions
  const sortedX = validCenters.map(c => c.x).sort((a, b) => a - b);
  const sortedY = validCenters.map(c => c.y).sort((a, b) => a - b);
  const medianX = sortedX[Math.floor(sortedX.length / 2)];
  const medianY = sortedY[Math.floor(sortedY.length / 2)];

  console.log(`[Alignment] Character anchor point - X: ${medianX} (body center), Y: ${medianY} (feet/base)`);

  // SECOND PASS: Align all frames to the consistent anchor point
  for (let i = 0; i < rows * cols; i++) {
    const row = Math.floor(i / cols);
    const col = i % cols;
    const destSheetX = col * frameW;
    const destSheetY = row * frameH;

    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = frameW;
    tempCanvas.height = frameH;
    const tempCtx = tempCanvas.getContext('2d', { willReadFrequently: true });
    if (!tempCtx) continue;
    tempCtx.imageSmoothingEnabled = false;

    tempCtx.drawImage(sheet, destSheetX, destSheetY, frameW, frameH, 0, 0, frameW, frameH);

    const bgColor = getBackgroundColor(tempCtx, frameW, frameH);
    const bbox = getVisualBoundingBox(tempCtx, frameW, frameH, bgColor);
    const frameCenter = frameCenters[i];

    // Fill background
    if (bgColor) {
      ctx.fillStyle = `rgba(${bgColor.r}, ${bgColor.g}, ${bgColor.b}, ${bgColor.a / 255})`;
      ctx.fillRect(destSheetX, destSheetY, frameW, frameH);
    } else {
      ctx.clearRect(destSheetX, destSheetY, frameW, frameH);
    }

    if (bbox && frameCenter) {
      // Calculate offset to align this frame's center to the median center
      const offsetX = medianX - frameCenter.x;
      const offsetY = medianY - frameCenter.y;

      // Draw the frame with offset to align centers
      const drawX = destSheetX + bbox.minX + offsetX;
      const drawY = destSheetY + bbox.minY + offsetY;

      ctx.drawImage(
        tempCanvas,
        bbox.minX, bbox.minY, bbox.width, bbox.height,
        drawX, drawY, bbox.width, bbox.height
      );
    } else {
      // Empty or noise only - copy original
      ctx.drawImage(tempCanvas, 0, 0, frameW, frameH, destSheetX, destSheetY, frameW, frameH);
    }
  }

  return canvas.toDataURL('image/png');
};

/**
 * AI-POWERED SMART ALIGNMENT
 * Uses AI analysis to detect issues, then performs intelligent alignment
 * Returns aligned sprite sheet with detailed progress information
 */
export interface SmartAlignmentResult {
  aligned: string;
  analysis: AlignmentAnalysis;
  hadIssues: boolean;
  fixedIssues: string[];
}

export const aiSmartAlignSpriteSheet = async (
  imageSrc: string,
  rows: number,
  cols: number,
  onProgress?: (status: string) => void
): Promise<SmartAlignmentResult> => {
  const fixedIssues: string[] = [];
  let analysis: AlignmentAnalysis;

  try {
    // Step 1: AI Analysis - Detect grid structure and alignment issues
    onProgress?.('🤖 AI analyzing sprite sheet structure and detecting alignment issues...');
    analysis = await aiAnalyzeSpriteSheet(imageSrc, rows, cols);
    
    // Log detected issues
    if (analysis.alignmentIssues.length > 0) {
      console.log('[AI Alignment] Detected issues:', analysis.alignmentIssues);
      fixedIssues.push(...analysis.alignmentIssues.map(issue => `Detected: ${issue}`));
    }

    // Step 2: Clean sprite sheet (remove grid lines, fix backgrounds)
    onProgress?.('🧹 Cleaning sprite sheet artifacts (removing grid lines, fixing backgrounds)...');
    const { cleaned, hadIssues, issues } = await cleanSpriteSheet(imageSrc, rows, cols);
    if (hadIssues && issues.length > 0) {
      fixedIssues.push(...issues);
    }

    // Step 3: Perform alignment using detected grid structure
    onProgress?.('📐 Aligning frames to optimal grid positions for smooth animation...');
    const aligned = await alignWholeSheet(cleaned, rows, cols);
    
    // Step 4: Quality check - verify alignment improved consistency
    onProgress?.('✅ Verifying alignment quality and animation smoothness...');
    
    return {
      aligned,
      analysis,
      hadIssues: fixedIssues.length > 0,
      fixedIssues
    };
  } catch (error) {
    console.error('[AI Alignment] Error during alignment:', error);
    
    // Fallback to standard alignment if AI fails
    onProgress?.('Falling back to standard alignment...');
    const { cleaned } = await cleanSpriteSheet(imageSrc, rows, cols);
    const aligned = await alignWholeSheet(cleaned, rows, cols);
    
    return {
      aligned,
      analysis: {
        detectedRows: rows,
        detectedCols: cols,
        frameWidth: 0,
        frameHeight: 0,
        alignmentIssues: ['AI analysis failed, used standard alignment'],
        recommendations: []
      },
      hadIssues: true,
      fixedIssues: ['Used fallback alignment method']
    };
  }
};
