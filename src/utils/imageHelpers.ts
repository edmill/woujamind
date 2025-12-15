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

  // Use flood fill from edges for more accurate background detection
  const visited = new Uint8Array(width * height);
  const threshold = 40;

  // Flood fill helper
  const floodFill = (startX: number, startY: number) => {
    const queue: Array<{x: number, y: number}> = [{x: startX, y: startY}];

    while (queue.length > 0) {
      const {x, y} = queue.shift()!;

      if (x < 0 || x >= width || y < 0 || y >= height) continue;

      const pixelIndex = y * width + x;
      if (visited[pixelIndex]) continue;

      const dataIndex = pixelIndex * 4;
      const r = data[dataIndex];
      const g = data[dataIndex + 1];
      const b = data[dataIndex + 2];
      const a = data[dataIndex + 3];

      // Skip already transparent
      if (a < 10) {
        visited[pixelIndex] = 1;
        continue;
      }

      // Check if pixel matches background color
      const rDiff = r - bgColor.r;
      const gDiff = g - bgColor.g;
      const bDiff = b - bgColor.b;
      const colorDistance = Math.sqrt(rDiff * rDiff + gDiff * gDiff + bDiff * bDiff);

      if (colorDistance < threshold) {
        visited[pixelIndex] = 1;
        data[dataIndex + 3] = 0; // Make transparent

        // Add neighbors to queue
        queue.push({x: x + 1, y});
        queue.push({x: x - 1, y});
        queue.push({x, y: y + 1});
        queue.push({x, y: y - 1});
      }
    }
  };

  // Start flood fill from all edges
  // Top and bottom edges
  for (let x = 0; x < width; x++) {
    floodFill(x, 0);
    floodFill(x, height - 1);
  }
  // Left and right edges
  for (let y = 0; y < height; y++) {
    floodFill(0, y);
    floodFill(width - 1, y);
  }

  // Second pass: ONLY remove pure white pixels that are near already-transparent areas
  // This is more conservative and won't remove white parts of the sprite (like gloves or teeth)
  const pureWhiteThreshold = 5; // Very tight - only removes nearly pure white
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = (y * width + x) * 4;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];
      const a = data[idx + 3];

      // Skip already transparent pixels
      if (a < 10) continue;

      // Only process nearly pure white pixels (very close to 255, 255, 255)
      const isNearlyPureWhite = (
        Math.abs(r - 255) <= pureWhiteThreshold &&
        Math.abs(g - 255) <= pureWhiteThreshold &&
        Math.abs(b - 255) <= pureWhiteThreshold
      );

      if (!isNearlyPureWhite) continue;

      // Check if any neighbor is already transparent
      let hasTransparentNeighbor = false;
      const neighbors = [
        {dx: -1, dy: 0}, {dx: 1, dy: 0},
        {dx: 0, dy: -1}, {dx: 0, dy: 1},
        {dx: -1, dy: -1}, {dx: 1, dy: -1},
        {dx: -1, dy: 1}, {dx: 1, dy: 1}
      ];

      for (const {dx, dy} of neighbors) {
        const nIdx = ((y + dy) * width + (x + dx)) * 4;
        if (data[nIdx + 3] < 10) {
          hasTransparentNeighbor = true;
          break;
        }
      }

      // Only remove if it's pure white AND next to transparent area
      // This avoids removing white gloves, teeth, etc. that are interior to the sprite
      if (hasTransparentNeighbor) {
        data[idx + 3] = 0;
      }
    }
  }

  // Optional: smooth edges for anti-aliasing
  // Create a second pass to add semi-transparent pixels at edges
  const smoothed = new Uint8ClampedArray(data);
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = (y * width + x) * 4;

      // If this pixel is opaque, check if neighbors are transparent
      if (data[idx + 3] > 128) {
        let transparentNeighbors = 0;
        const neighbors = [
          {dx: -1, dy: 0}, {dx: 1, dy: 0},
          {dx: 0, dy: -1}, {dx: 0, dy: 1}
        ];

        for (const {dx, dy} of neighbors) {
          const nIdx = ((y + dy) * width + (x + dx)) * 4;
          if (data[nIdx + 3] < 128) transparentNeighbors++;
        }

        // If bordering transparent pixels, reduce opacity slightly for smoother edges
        if (transparentNeighbors > 0) {
          smoothed[idx + 3] = Math.max(200, data[idx + 3] - (transparentNeighbors * 15));
        }
      }
    }
  }

  // Apply smoothed alpha values
  for (let i = 3; i < data.length; i += 4) {
    data[i] = smoothed[i];
  }

  ctx.putImageData(imageData, 0, 0);
};
