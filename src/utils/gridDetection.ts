/**
 * Grid Detection Utilities
 * Smart algorithms to detect sprite sheet grid dimensions
 */

export interface GridDimensions {
  rows: number;
  cols: number;
  confidence?: number;
  reason?: string;
}

export interface GridDetectionResult {
  detected: GridDimensions;
  confidence: 'high' | 'medium' | 'low';
  suggestions: GridDimensions[];
}

/**
 * Calculate color distance between two pixels
 */
function colorDifference(data: Uint8ClampedArray, idx1: number, idx2: number): number {
  const rDiff = data[idx1] - data[idx2];
  const gDiff = data[idx1 + 1] - data[idx2 + 1];
  const bDiff = data[idx1 + 2] - data[idx2 + 2];
  return Math.sqrt(rDiff * rDiff + gDiff * gDiff + bDiff * bDiff);
}

/**
 * Calculate variance of an array of numbers
 */
function variance(arr: number[]): number {
  if (arr.length === 0) return 0;
  const mean = arr.reduce((sum, val) => sum + val, 0) / arr.length;
  const squaredDiffs = arr.map(val => Math.pow(val - mean, 2));
  return squaredDiffs.reduce((sum, val) => sum + val, 0) / arr.length;
}

/**
 * Method 1: Detect grid by finding vertical and horizontal edge lines
 */
function detectGridByEdges(imageData: ImageData): GridDimensions {
  const { width, height, data } = imageData;

  // Detect vertical lines (column separators)
  const verticalLines: number[] = [];
  for (let x = 1; x < width - 1; x++) {
    let lineScore = 0;
    for (let y = 0; y < height; y++) {
      const idx = (y * width + x) * 4;
      const leftIdx = (y * width + (x - 1)) * 4;
      const rightIdx = (y * width + (x + 1)) * 4;

      const leftDiff = colorDifference(data, idx, leftIdx);
      const rightDiff = colorDifference(data, idx, rightIdx);

      if (leftDiff > 50 || rightDiff > 50) lineScore++;
    }

    // If >70% of pixels show edge, it's likely a grid line
    if (lineScore / height > 0.7) {
      verticalLines.push(x);
    }
  }

  // Detect horizontal lines (row separators)
  const horizontalLines: number[] = [];
  for (let y = 1; y < height - 1; y++) {
    let lineScore = 0;
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const topIdx = ((y - 1) * width + x) * 4;
      const bottomIdx = ((y + 1) * width + x) * 4;

      const topDiff = colorDifference(data, idx, topIdx);
      const bottomDiff = colorDifference(data, idx, bottomIdx);

      if (topDiff > 50 || bottomDiff > 50) lineScore++;
    }

    if (lineScore / width > 0.7) {
      horizontalLines.push(y);
    }
  }

  // Calculate grid dimensions from detected lines
  const cols = verticalLines.length > 0 ? verticalLines.length + 1 : 1;
  const rows = horizontalLines.length > 0 ? horizontalLines.length + 1 : 1;

  // Calculate confidence based on line spacing regularity
  const colSpacing = verticalLines.map((x, i) => i > 0 ? x - verticalLines[i - 1] : 0).filter(s => s > 0);
  const rowSpacing = horizontalLines.map((y, i) => i > 0 ? y - horizontalLines[i - 1] : 0).filter(s => s > 0);

  const colVariance = variance(colSpacing);
  const rowVariance = variance(rowSpacing);
  const confidence = 1 - Math.min(1, (colVariance + rowVariance) / 1000);

  return {
    rows,
    cols,
    confidence,
    reason: 'Detected grid lines'
  };
}

/**
 * Method 2: Detect grid by analyzing sprite content boundaries
 */
function detectGridByContent(imageData: ImageData): GridDimensions {
  const { width, height, data } = imageData;

  // Find regions with content by scanning for non-background pixels
  const rowsWithContent = new Set<number>();
  const colsWithContent = new Set<number>();

  // Sample background color from corners
  const bgR = data[0];
  const bgG = data[1];
  const bgB = data[2];

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];
      const a = data[idx + 3];

      // Check if pixel is different from background
      const diff = Math.sqrt(
        Math.pow(r - bgR, 2) +
        Math.pow(g - bgG, 2) +
        Math.pow(b - bgB, 2)
      );

      if (diff > 30 && a > 30) {
        rowsWithContent.add(Math.floor(y / 32) * 32); // Group into 32px blocks
        colsWithContent.add(Math.floor(x / 32) * 32);
      }
    }
  }

  const rows = Math.max(1, Math.ceil(rowsWithContent.size / 2));
  const cols = Math.max(1, Math.ceil(colsWithContent.size / 2));

  return {
    rows,
    cols,
    confidence: 0.5,
    reason: 'Analyzed sprite content'
  };
}

/**
 * Method 3: Suggest common sprite sheet patterns based on dimensions
 */
function detectGridByCommonPatterns(width: number, height: number): GridDimensions[] {
  const suggestions: GridDimensions[] = [];

  // Common sprite sheet patterns
  const commonGrids = [
    { rows: 1, cols: 4 },  // Idle/simple animation
    { rows: 2, cols: 4 },  // Walk/run cycle
    { rows: 4, cols: 4 },  // 4-direction movement
    { rows: 8, cols: 8 },  // Large sprite sheet
    { rows: 1, cols: 8 },  // Long animation
    { rows: 2, cols: 3 },  // Jump/attack
    { rows: 1, cols: 1 },  // Single frame
  ];

  for (const grid of commonGrids) {
    const frameWidth = width / grid.cols;
    const frameHeight = height / grid.rows;

    // Check if frames would be reasonably square and appropriately sized
    const aspectRatio = frameWidth / frameHeight;
    const isSquareish = aspectRatio > 0.5 && aspectRatio < 2.0;
    const isReasonableSize = frameWidth >= 16 && frameHeight >= 16 &&
                              frameWidth <= 512 && frameHeight <= 512;

    if (isSquareish && isReasonableSize) {
      // Check if dimensions divide evenly
      const evenDivision = (width % grid.cols === 0) && (height % grid.rows === 0);
      const confidence = evenDivision ? 0.8 : 0.5;

      suggestions.push({
        ...grid,
        confidence,
        reason: `${grid.rows}×${grid.cols} grid (${Math.floor(frameWidth)}×${Math.floor(frameHeight)}px frames)`
      });
    }
  }

  // Sort by confidence
  suggestions.sort((a, b) => (b.confidence || 0) - (a.confidence || 0));

  return suggestions.slice(0, 5);
}

/**
 * Main smart grid detection function
 * Tries multiple methods and returns the best result
 */
export async function smartDetectGrid(image: HTMLImageElement): Promise<GridDetectionResult> {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });

    if (!ctx) {
      // Fallback to common pattern
      const patterns = detectGridByCommonPatterns(canvas.width, canvas.height);
      resolve({
        detected: patterns[0] || { rows: 1, cols: 1 },
        confidence: 'low',
        suggestions: patterns.slice(1)
      });
      return;
    }

    ctx.drawImage(image, 0, 0);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    // Try edge detection first (most reliable for grids with borders)
    const edgeResult = detectGridByEdges(imageData);
    if ((edgeResult.confidence || 0) > 0.8) {
      const patterns = detectGridByCommonPatterns(canvas.width, canvas.height);
      resolve({
        detected: edgeResult,
        confidence: 'high',
        suggestions: patterns.filter(p =>
          p.rows !== edgeResult.rows || p.cols !== edgeResult.cols
        ).slice(0, 4)
      });
      return;
    }

    // Try content analysis
    const contentResult = detectGridByContent(imageData);
    if ((contentResult.confidence || 0) > 0.6) {
      const patterns = detectGridByCommonPatterns(canvas.width, canvas.height);
      resolve({
        detected: contentResult,
        confidence: 'medium',
        suggestions: [edgeResult, ...patterns].filter(p =>
          p.rows !== contentResult.rows || p.cols !== contentResult.cols
        ).slice(0, 4)
      });
      return;
    }

    // Fallback to common patterns
    const patterns = detectGridByCommonPatterns(canvas.width, canvas.height);
    const allResults = [edgeResult, contentResult, ...patterns];

    resolve({
      detected: patterns[0] || { rows: 2, cols: 4, reason: 'Default 2×4 grid' },
      confidence: 'low',
      suggestions: allResults.filter(p =>
        p.rows !== patterns[0]?.rows || p.cols !== patterns[0]?.cols
      ).slice(0, 4)
    });
  });
}

/**
 * Validate file before processing
 */
export async function validateSpriteSheetFile(file: File): Promise<{ valid: boolean; error?: string }> {
  // Check file type
  const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp'];
  if (!validTypes.includes(file.type)) {
    return { valid: false, error: 'Please upload a PNG, JPG, GIF, or WebP image.' };
  }

  // Check file size (max 50MB)
  const maxSize = 50 * 1024 * 1024;
  if (file.size > maxSize) {
    return { valid: false, error: 'File size must be less than 50MB.' };
  }

  // Verify it's a valid image
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ valid: true });
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve({ valid: false, error: 'Failed to load image. File may be corrupted.' });
    };

    img.src = url;
  });
}
