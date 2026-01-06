/**
 * Variable Frame Detection for Sprite Sheets
 * Detects individual sprite frames with varying sizes and orientations
 * Uses traditional computer vision techniques (no AI required)
 */

import { getBackgroundColor } from './imageHelpers';

export interface VariableFrame {
  x: number;
  y: number;
  width: number;
  height: number;
  index: number;
  confidence: number;
}

export interface VariableFrameDetectionResult {
  frames: VariableFrame[];
  imageWidth: number;
  imageHeight: number;
  backgroundColor: { r: number; g: number; b: number; a: number } | null;
  method: 'content_segmentation' | 'grid_lines';
}

interface DetectionOptions {
  minSize?: number;
  backgroundThreshold?: number;
  padding?: number;
}

/**
 * Detects variable-sized frames in a sprite sheet
 */
export async function detectVariableFrames(
  img: HTMLImageElement,
  options: DetectionOptions = {}
): Promise<VariableFrameDetectionResult> {
  const width = img.naturalWidth;
  const height = img.naturalHeight;
  
  // Calculate dynamic minSize based on image dimensions (at least 32px, or 2% of smallest dimension)
  const dynamicMinSize = Math.max(32, Math.min(width, height) * 0.02);
  
  const {
    minSize = dynamicMinSize,
    backgroundThreshold = 40, // Increased from 30 for better background detection
    padding = 2
  } = options;

  // Create canvas for processing
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) {
    throw new Error('Failed to get canvas context');
  }

  ctx.drawImage(img, 0, 0);

  // Try grid line detection first (faster, more accurate if grid exists)
  const gridResult = detectFramesByGridLines(ctx, width, height, minSize);
  if (gridResult && gridResult.frames.length > 0) {
    return gridResult;
  }

  // Fall back to content-based segmentation
  return detectFramesByContent(ctx, width, height, minSize, backgroundThreshold, padding);
}

/**
 * Detect frames by finding grid lines (for sprite sheets with visible borders)
 */
function detectFramesByGridLines(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  minSize: number
): VariableFrameDetectionResult | null {
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;

  // Convert to grayscale for edge detection
  const gray = new Uint8Array(width * height);
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    gray[i / 4] = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
  }

  // Detect vertical lines (column separators)
  const verticalLines: number[] = [];
  for (let x = 1; x < width - 1; x++) {
    let edgePixels = 0;
    for (let y = 0; y < height; y++) {
      const left = gray[y * width + (x - 1)];
      const right = gray[y * width + (x + 1)];
      if (Math.abs(left - right) > 50) {
        edgePixels++;
      }
    }
    // If >70% of column is edge, it's likely a grid line
    if (edgePixels / height > 0.7) {
      verticalLines.push(x);
    }
  }

  // Detect horizontal lines (row separators)
  const horizontalLines: number[] = [];
  for (let y = 1; y < height - 1; y++) {
    let edgePixels = 0;
    for (let x = 0; x < width; x++) {
      const top = gray[(y - 1) * width + x];
      const bottom = gray[(y + 1) * width + x];
      if (Math.abs(top - bottom) > 50) {
        edgePixels++;
      }
    }
    if (edgePixels / width > 0.7) {
      horizontalLines.push(y);
    }
  }

  // If we found grid lines, create frames from grid
  if (verticalLines.length > 0 || horizontalLines.length > 0) {
    // Add image boundaries
    const allVLines = [0, ...verticalLines.sort((a, b) => a - b), width];
    const allHLines = [0, ...horizontalLines.sort((a, b) => a - b), height];

    const frames: VariableFrame[] = [];
    for (let rowIdx = 0; rowIdx < allHLines.length - 1; rowIdx++) {
      const yMin = allHLines[rowIdx];
      const yMax = allHLines[rowIdx + 1];

      for (let colIdx = 0; colIdx < allVLines.length - 1; colIdx++) {
        const xMin = allVLines[colIdx];
        const xMax = allVLines[colIdx + 1];

        const frameWidth = xMax - xMin;
        const frameHeight = yMax - yMin;

        if (frameWidth >= minSize && frameHeight >= minSize) {
          frames.push({
            x: xMin,
            y: yMin,
            width: frameWidth,
            height: frameHeight,
            index: frames.length,
            confidence: 0.9
          });
        }
      }
    }

    if (frames.length > 0) {
      const bgColor = getBackgroundColor(ctx, width, height);
      return {
        frames,
        imageWidth: width,
        imageHeight: height,
        backgroundColor: bgColor,
        method: 'grid_lines'
      };
    }
  }

  return null;
}

/**
 * Detect frames by analyzing sprite content boundaries
 */
function detectFramesByContent(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  minSize: number,
  backgroundThreshold: number,
  padding: number
): VariableFrameDetectionResult {
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;

  // Detect background color
  const bgColor = getBackgroundColor(ctx, width, height);
  if (!bgColor) {
    throw new Error('Failed to detect background color');
  }

  // Create binary mask: 1 = content, 0 = background
  const mask = new Uint8Array(width * height);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];
      const a = data[idx + 3];

      // Check if pixel is background
      if (a < 128) {
        mask[y * width + x] = 0; // Transparent is background
      } else {
        const rDiff = r - bgColor.r;
        const gDiff = g - bgColor.g;
        const bDiff = b - bgColor.b;
        const colorDistance = Math.sqrt(rDiff * rDiff + gDiff * gDiff + bDiff * bDiff);
        mask[y * width + x] = colorDistance < backgroundThreshold ? 0 : 1;
      }
    }
  }

  // Find connected components (individual sprites) using flood fill
  const labeled = new Int32Array(width * height);
  let labelId = 0;

  const floodFill = (startX: number, startY: number, currentLabel: number) => {
    const stack: Array<{ x: number; y: number }> = [{ x: startX, y: startY }];
    
    while (stack.length > 0) {
      const { x, y } = stack.pop()!;
      
      if (x < 0 || x >= width || y < 0 || y >= height) continue;
      if (labeled[y * width + x] !== 0 || mask[y * width + x] === 0) continue;

      labeled[y * width + x] = currentLabel;
      
      // Add neighbors
      stack.push(
        { x: x - 1, y },
        { x: x + 1, y },
        { x, y: y - 1 },
        { x, y: y + 1 }
      );
    }
  };

  // Label all connected components
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (mask[y * width + x] === 1 && labeled[y * width + x] === 0) {
        labelId++;
        floodFill(x, y, labelId);
      }
    }
  }

  // Extract bounding boxes for each component
  const componentBounds = new Map<number, { minX: number; minY: number; maxX: number; maxY: number }>();

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const label = labeled[y * width + x];
      if (label === 0) continue;

      const bounds = componentBounds.get(label);
      if (!bounds) {
        componentBounds.set(label, { minX: x, minY: y, maxX: x, maxY: y });
      } else {
        if (x < bounds.minX) bounds.minX = x;
        if (x > bounds.maxX) bounds.maxX = x;
        if (y < bounds.minY) bounds.minY = y;
        if (y > bounds.maxY) bounds.maxY = y;
      }
    }
  }

  // Convert to frames with initial filtering
  const candidateFrames: VariableFrame[] = [];
  for (const [label, bounds] of componentBounds.entries()) {
    let frameWidth = bounds.maxX - bounds.minX + 1;
    let frameHeight = bounds.maxY - bounds.minY + 1;

    // Filter out tiny noise
    if (frameWidth < minSize || frameHeight < minSize) continue;

    // Add padding
    const xMin = Math.max(0, bounds.minX - padding);
    const yMin = Math.max(0, bounds.minY - padding);
    const xMax = Math.min(width - 1, bounds.maxX + padding);
    const yMax = Math.min(height - 1, bounds.maxY + padding);

    frameWidth = xMax - xMin + 1;
    frameHeight = yMax - yMin + 1;

    candidateFrames.push({
      x: xMin,
      y: yMin,
      width: frameWidth,
      height: frameHeight,
      index: candidateFrames.length,
      confidence: 1.0
    });
  }

  if (candidateFrames.length === 0) {
    const bgColor = getBackgroundColor(ctx, width, height);
    return {
      frames: [],
      imageWidth: width,
      imageHeight: height,
      backgroundColor: bgColor,
      method: 'content_segmentation'
    };
  }

  // Find the largest frame to use as reference for filtering
  const largestFrame = candidateFrames.reduce((largest, frame) => {
    const area = frame.width * frame.height;
    const largestArea = largest.width * largest.height;
    return area > largestArea ? frame : largest;
  }, candidateFrames[0]);

  const largestArea = largestFrame.width * largestFrame.height;
  const minAreaRatio = 0.15; // Frames must be at least 15% of largest frame area
  
  console.log(`[VariableFrameDetection] Found ${candidateFrames.length} candidate frames, largest: ${largestFrame.width}x${largestFrame.height} (area: ${largestArea})`);

  // Filter frames by area ratio (remove very small fragments)
  const filteredFrames = candidateFrames.filter(frame => {
    const area = frame.width * frame.height;
    const areaRatio = area / largestArea;
    return areaRatio >= minAreaRatio;
  });
  
  console.log(`[VariableFrameDetection] After area filtering: ${filteredFrames.length} frames (removed ${candidateFrames.length - filteredFrames.length} small fragments)`);

  // Merge nearby frames that are likely part of the same sprite
  // (e.g., exploded pieces that are close together)
  const mergedFrames: VariableFrame[] = [];
  const used = new Set<number>();

  for (let i = 0; i < filteredFrames.length; i++) {
    if (used.has(i)) continue;

    const frame = filteredFrames[i];
    const mergeGroup = [frame];
    used.add(i);

    // Look for nearby frames to merge (within 20% of frame size)
    const mergeDistance = Math.max(frame.width, frame.height) * 0.2;

    for (let j = i + 1; j < filteredFrames.length; j++) {
      if (used.has(j)) continue;

      const otherFrame = filteredFrames[j];
      
      // Calculate distance between frame centers
      const centerX1 = frame.x + frame.width / 2;
      const centerY1 = frame.y + frame.height / 2;
      const centerX2 = otherFrame.x + otherFrame.width / 2;
      const centerY2 = otherFrame.y + otherFrame.height / 2;
      
      const distance = Math.sqrt(
        Math.pow(centerX2 - centerX1, 2) + Math.pow(centerY2 - centerY1, 2)
      );

      // If frames are close, merge them (especially if one is small - likely a fragment)
      if (distance < mergeDistance) {
        const frameArea = frame.width * frame.height;
        const otherArea = otherFrame.width * otherFrame.height;
        const smallerArea = Math.min(frameArea, otherArea);
        const largerArea = Math.max(frameArea, otherArea);
        const sizeRatio = smallerArea / largerArea;
        
        // Merge if:
        // 1. Frames are similar in size (within 60% difference), OR
        // 2. One frame is small (< 30% of largest frame) - likely a fragment to merge
        const isSmallFragment = smallerArea < largestArea * 0.3;
        if (sizeRatio > 0.4 || isSmallFragment) {
          mergeGroup.push(otherFrame);
          used.add(j);
        }
      }
    }

    // Create merged bounding box
    if (mergeGroup.length === 1) {
      mergedFrames.push(frame);
    } else {
      // Merge multiple frames into one bounding box
      let minX = Math.min(...mergeGroup.map(f => f.x));
      let minY = Math.min(...mergeGroup.map(f => f.y));
      let maxX = Math.max(...mergeGroup.map(f => f.x + f.width));
      let maxY = Math.max(...mergeGroup.map(f => f.y + f.height));

      mergedFrames.push({
        x: minX,
        y: minY,
        width: maxX - minX,
        height: maxY - minY,
        index: mergedFrames.length,
        confidence: 0.8 // Lower confidence for merged frames
      });
    }
  }
  
  console.log(`[VariableFrameDetection] After merging: ${mergedFrames.length} frames (merged ${filteredFrames.length - mergedFrames.length} fragments)`);

  // Sort frames by position (top-to-bottom, left-to-right)
  mergedFrames.sort((a, b) => {
    const rowTolerance = Math.max(a.height, b.height) * 0.3; // More flexible row detection
    if (Math.abs(a.y - b.y) < rowTolerance) {
      // Same row (within tolerance), sort by x
      return a.x - b.x;
    }
    return a.y - b.y;
  });

  // Re-index after sorting
  mergedFrames.forEach((frame, i) => {
    frame.index = i;
  });

  // Final filtering: if we have too many frames, apply stricter filtering
  let frames = mergedFrames;
  const maxReasonableFrames = Math.ceil((width / 100) * (height / 100)); // Rough estimate based on image size
  
  if (frames.length > maxReasonableFrames * 2) {
    console.warn(`[VariableFrameDetection] Detected ${frames.length} frames, applying stricter filtering (max reasonable: ${maxReasonableFrames})`);
    
    // Apply stricter area filtering
    const stricterMinAreaRatio = 0.25; // Must be at least 25% of largest frame
    frames = frames.filter(frame => {
      const area = frame.width * frame.height;
      const areaRatio = area / largestArea;
      return areaRatio >= stricterMinAreaRatio;
    });
    
    // If still too many, sort by area and take the largest ones
    if (frames.length > maxReasonableFrames * 1.5) {
      frames.sort((a, b) => (b.width * b.height) - (a.width * a.height));
      frames = frames.slice(0, maxReasonableFrames);
      // Re-sort by position
      frames.sort((a, b) => {
        const rowTolerance = Math.max(a.height, b.height) * 0.3;
        if (Math.abs(a.y - b.y) < rowTolerance) {
          return a.x - b.x;
        }
        return a.y - b.y;
      });
    }
  }

  // Re-index final frames
  frames.forEach((frame, i) => {
    frame.index = i;
  });

  return {
    frames,
    imageWidth: width,
    imageHeight: height,
    backgroundColor: bgColor,
    method: 'content_segmentation'
  };
}

