
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

    const tolerance = 20; // Tolerance for background color matching

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
                    const diff = Math.abs(r - bgColor.r) + Math.abs(g - bgColor.g) + Math.abs(b - bgColor.b);
                    isContent = diff > (tolerance * 3);
                }
            } else {
                // Standard alpha check
                isContent = a > 20;
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
    return { minX, minY, maxX, maxY, w: maxX - minX + 1, h: maxY - minY + 1 };
};

const getBackgroundColor = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const data = ctx.getImageData(0, 0, 1, 1).data; // Sample top-left
    if (data[3] < 10) return null; // Transparent
    return { r: data[0], g: data[1], b: data[2], a: data[3] };
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

        // 7. Calculate Centered Position
        const destX = Math.floor((frameW - bbox.w) / 2);
        const paddingBottom = Math.floor(frameH * 0.05); 
        const destY = Math.floor(frameH - bbox.h - paddingBottom);

        // 8. Draw sprite back centered
        // We use the tempCanvas but strictly the bbox area
        ctx.drawImage(
            tempCanvas,
            bbox.minX, bbox.minY, bbox.w, bbox.h,
            (col * frameW) + destX, (row * frameH) + destY, bbox.w, bbox.h
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
             // Calculate alignment
             const alignX = Math.floor((frameW - bbox.w) / 2);
             const paddingBottom = Math.floor(frameH * 0.05);
             const alignY = Math.floor(frameH - bbox.h - paddingBottom);

             ctx.drawImage(
                 tempCanvas,
                 bbox.minX, bbox.minY, bbox.w, bbox.h,
                 destSheetX + alignX, destSheetY + alignY, bbox.w, bbox.h
             );
        } else {
             // Empty or noise only - copy original just in case
             ctx.drawImage(tempCanvas, 0, 0, frameW, frameH, destSheetX, destSheetY, frameW, frameH);
        }
    }
    
    return canvas.toDataURL('image/png');
};
