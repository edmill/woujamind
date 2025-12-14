/**
 * Image Helper Utilities
 * Shared helper functions for image processing
 */

// Helper to find the bounding box of non-transparent pixels OR non-background pixels
export const getVisualBoundingBox = (
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

  if (!found) return null;
  return { minX, minY, maxX, maxY, width: maxX - minX + 1, height: maxY - minY + 1 };
};

export const getBackgroundColor = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;

  // Sample corners to determine background color
  const corners = [
    { x: 0, y: 0 },
    { x: width - 1, y: 0 },
    { x: 0, y: height - 1 },
    { x: width - 1, y: height - 1 },
    // Also sample edges for better accuracy
    { x: Math.floor(width / 2), y: 0 },
    { x: Math.floor(width / 2), y: height - 1 },
    { x: 0, y: Math.floor(height / 2) },
    { x: width - 1, y: Math.floor(height / 2) }
  ];

  let totalR = 0, totalG = 0, totalB = 0, totalA = 0;
  let count = 0;

  for (const { x, y } of corners) {
    const idx = (y * width + x) * 4;
    totalR += data[idx];
    totalG += data[idx + 1];
    totalB += data[idx + 2];
    totalA += data[idx + 3];
    count++;
  }

  return {
    r: Math.round(totalR / count),
    g: Math.round(totalG / count),
    b: Math.round(totalB / count),
    a: Math.round(totalA / count)
  };
};

export const loadImage = (src: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
};

export const processRemoveBackground = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;

  // Get background color from corners
  const bgColor = getBackgroundColor(ctx, width, height);

  // Higher threshold for better background removal
  const threshold = 40;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const a = data[i + 3];

    // Skip already transparent pixels
    if (a < 10) continue;

    // Calculate color distance
    const rDiff = r - bgColor.r;
    const gDiff = g - bgColor.g;
    const bDiff = b - bgColor.b;
    const colorDistance = Math.sqrt(rDiff * rDiff + gDiff * gDiff + bDiff * bDiff);

    // If pixel is similar to background, make it transparent
    if (colorDistance < threshold) {
      data[i + 3] = 0; // Set alpha to 0
    }
  }

  ctx.putImageData(imageData, 0, 0);
};
