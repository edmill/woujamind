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
  // Note: If the canvas context was created with willReadFrequently: true, 
  // multiple getImageData calls will be faster. This is handled at context creation.
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

  // Sample all edge pixels to build a histogram
  const colorMap = new Map<string, { r: number, g: number, b: number, a: number, count: number }>();

  // Sample all pixels from the outer border (1 pixel wide)
  const samplePixel = (x: number, y: number) => {
    const idx = (y * width + x) * 4;
    const r = data[idx];
    const g = data[idx + 1];
    const b = data[idx + 2];
    const a = data[idx + 3];

    // Quantize colors to reduce noise (group similar colors)
    const qr = Math.round(r / 10) * 10;
    const qg = Math.round(g / 10) * 10;
    const qb = Math.round(b / 10) * 10;
    const key = `${qr},${qg},${qb}`;

    const existing = colorMap.get(key);
    if (existing) {
      existing.count++;
    } else {
      colorMap.set(key, { r: qr, g: qg, b: qb, a, count: 1 });
    }
  };

  // Sample top and bottom edges
  for (let x = 0; x < width; x++) {
    samplePixel(x, 0);
    samplePixel(x, height - 1);
  }

  // Sample left and right edges (excluding corners already sampled)
  for (let y = 1; y < height - 1; y++) {
    samplePixel(0, y);
    samplePixel(width - 1, y);
  }

  // PRIORITY 1: Check for green chroma key (bright green background)
  // Chroma key green is typically RGB(0, 255, 0) or close to it
  // RELAXED DETECTION: Accept any significant green presence (>20% of edges OR brightest green > 180)
  let chromaKeyGreen = null;
  let totalEdgePixels = 0;

  // Calculate total edge pixels for percentage check
  totalEdgePixels = (width * 2) + ((height - 2) * 2);

  for (const color of colorMap.values()) {
    // Check if this is a bright green (chroma key)
    // RELAXED: Green channel high (>180), Red and Blue channels low (<120)
    // This catches more green variations from video generation
    if (color.g > 180 && color.r < 120 && color.b < 120) {
      const greenPercentage = (color.count / totalEdgePixels) * 100;
      // RELAXED: Accept if >20% of edges (was 60%) OR if very bright (g > 200)
      if (greenPercentage > 20 || color.g > 200) {
        if (!chromaKeyGreen || color.count > chromaKeyGreen.count) {
          chromaKeyGreen = color;
        }
      }
    }
  }

  if (chromaKeyGreen) {
    const greenPercentage = (chromaKeyGreen.count / totalEdgePixels) * 100;
    console.log('[getBackgroundColor] Detected chroma key green background:', chromaKeyGreen, `(${greenPercentage.toFixed(1)}% of edges)`);
    return chromaKeyGreen;
  }

  // PRIORITY 2: Find the most common LIGHT color (backgrounds are usually lighter than characters)
  // Calculate brightness for each color and prefer lighter ones
  let bestColor = { r: 255, g: 255, b: 255, a: 255 };
  let bestScore = 0;

  for (const color of colorMap.values()) {
    // Calculate brightness (0-255)
    const brightness = (color.r + color.g + color.b) / 3;

    // Score = count * brightness_weight
    // Prefer lighter colors, but still weight by frequency
    // If brightness > 128 (light), give bonus. If dark, penalize.
    const brightnessWeight = brightness > 128 ? 2.0 : 0.5;
    const score = color.count * brightnessWeight;

    if (score > bestScore) {
      bestScore = score;
      bestColor = color;
    }
  }

  const brightness = (bestColor.r + bestColor.g + bestColor.b) / 3;
  console.log('[getBackgroundColor] Found', colorMap.size, 'unique colors,', 'selected:', bestColor, 'brightness:', brightness.toFixed(0));
  return bestColor;
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
  console.log('[processRemoveBackground] Detected background color:', bgColor);

  // Detect if this is a green chroma key background
  // RELAXED: Match the relaxed detection from getBackgroundColor
  const isChromaKey = bgColor.g > 180 && bgColor.r < 120 && bgColor.b < 120;

  // Detect if this is a white/light background (brightness > 240)
  const brightness = (bgColor.r + bgColor.g + bgColor.b) / 3;
  const isWhiteBackground = brightness > 240;

  console.log('[processRemoveBackground] Background type:', {
    isChromaKey,
    isWhiteBackground,
    brightness: brightness.toFixed(0)
  });

  // Use flood fill from edges for more accurate background detection
  const visited = new Uint8Array(width * height);

  // Adjust threshold based on background type:
  // - Chroma key (green): VERY AGGRESSIVE threshold (80) - remove all green variations
  // - White background: very conservative threshold (15) - avoid removing white character parts
  // - Other backgrounds: moderate threshold (40)
  const threshold = isChromaKey ? 80 : isWhiteBackground ? 15 : 40;
  console.log('[processRemoveBackground] Using threshold:', threshold);

  let pixelsRemoved = 0;

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
        pixelsRemoved++;

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

  // SPECIAL PASS FOR CHROMA KEY: Remove ground/shadow pixels (dark green grass/shadows)
  // This is CRITICAL for video-generated sprites which often have ground beneath character
  if (isChromaKey) {
    console.log('[processRemoveBackground] Running shadow/ground removal pass for chroma key');

    // Detect and remove dark greenish pixels (shadows/ground) at the bottom of the frame
    // These are darker versions of the green chroma key
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;
        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];
        const a = data[idx + 3];

        // Skip already transparent
        if (a < 10) continue;

        // Detect dark greenish pixels (grass/shadow)
        // Characteristics: Green is dominant, but overall dark (brightness < 180)
        // Also remove any very dark pixels near the bottom (likely ground)
        const pixelBrightness = (r + g + b) / 3;
        const isGreenish = g > r && g > b; // Green is dominant channel
        const isDark = pixelBrightness < 180;
        const isVeryDark = pixelBrightness < 120;

        // Remove if:
        // 1. Dark greenish pixel (likely shadow/grass) OR
        // 2. Very dark pixel in bottom 40% of frame (likely ground) OR
        // 3. Any green-tinted pixel (g > r+20 OR g > b+20) that's darker than 200
        const isBottomRegion = y > height * 0.6;
        const hasGreenTint = (g > r + 20) || (g > b + 20);

        if ((isGreenish && isDark) ||
            (isVeryDark && isBottomRegion) ||
            (hasGreenTint && pixelBrightness < 200)) {
          data[idx + 3] = 0; // Make transparent
          pixelsRemoved++;
        }
      }
    }
  }

  // Second pass: Remove isolated blocks of background color trapped inside sprite
  // This catches background pixels that weren't connected to edges
  // For white backgrounds, use very tight threshold to avoid removing white character parts
  const internalThreshold = isChromaKey ? 70 : isWhiteBackground ? 10 : 35;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const pixelIndex = y * width + x;

      // Skip if already processed or transparent
      if (visited[pixelIndex] || data[pixelIndex * 4 + 3] < 10) continue;

      const idx = pixelIndex * 4;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];

      // Check if this pixel matches background color
      const rDiff = r - bgColor.r;
      const gDiff = g - bgColor.g;
      const bDiff = b - bgColor.b;
      const colorDistance = Math.sqrt(rDiff * rDiff + gDiff * gDiff + bDiff * bDiff);

      // If it matches background, flood fill from here too (removes isolated background blocks)
      if (colorDistance < internalThreshold) {
        const internalQueue: Array<{x: number, y: number}> = [{x, y}];

        while (internalQueue.length > 0) {
          const {x: ix, y: iy} = internalQueue.shift()!;

          if (ix < 0 || ix >= width || iy < 0 || iy >= height) continue;

          const iPixelIndex = iy * width + ix;
          if (visited[iPixelIndex]) continue;

          const iIdx = iPixelIndex * 4;
          const ir = data[iIdx];
          const ig = data[iIdx + 1];
          const ib = data[iIdx + 2];
          const ia = data[iIdx + 3];

          if (ia < 10) {
            visited[iPixelIndex] = 1;
            continue;
          }

          const iRDiff = ir - bgColor.r;
          const iGDiff = ig - bgColor.g;
          const iBDiff = ib - bgColor.b;
          const iColorDistance = Math.sqrt(iRDiff * iRDiff + iGDiff * iGDiff + iBDiff * iBDiff);

          if (iColorDistance < internalThreshold) {
            visited[iPixelIndex] = 1;
            data[iIdx + 3] = 0;
            pixelsRemoved++;

            // Add neighbors
            internalQueue.push({x: ix + 1, y: iy});
            internalQueue.push({x: ix - 1, y: iy});
            internalQueue.push({x: ix, y: iy + 1});
            internalQueue.push({x: ix, y: iy - 1});
          }
        }
      }
    }
  }

  // Third pass: Clean up remaining background pixels near transparent areas
  // This catches edge cases and smooths boundaries
  // For white backgrounds, skip this pass entirely to protect white character parts
  // For chroma key, use AGGRESSIVE threshold to remove all green traces
  const edgeThreshold = isChromaKey ? 70 : isWhiteBackground ? 0 : 30;

  if (edgeThreshold > 0) {
    for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = (y * width + x) * 4;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];
      const a = data[idx + 3];

      // Skip already transparent pixels
      if (a < 10) continue;

      // Check if pixel is similar to background
      const rDiff = r - bgColor.r;
      const gDiff = g - bgColor.g;
      const bDiff = b - bgColor.b;
      const colorDistance = Math.sqrt(rDiff * rDiff + gDiff * gDiff + bDiff * bDiff);

      if (colorDistance > edgeThreshold) continue;

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

      // Remove if it's background-colored AND next to transparent area
      if (hasTransparentNeighbor) {
        data[idx + 3] = 0;
        pixelsRemoved++;
      }
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

  const totalPixels = width * height;
  console.log('[processRemoveBackground] Removed', pixelsRemoved, 'of', totalPixels, 'pixels (', (pixelsRemoved / totalPixels * 100).toFixed(1), '%)');

  ctx.putImageData(imageData, 0, 0);
  console.log('[processRemoveBackground] putImageData complete');
};
