/**
 * Replicate Service
 * Handles all Replicate API interactions for Seedance video generation
 *
 * ARCHITECTURE: Uses Vercel serverless function (/api/replicate) as a proxy
 * to avoid CORS issues when calling Replicate API from the browser.
 * User's API key is passed securely in request body to the serverless function.
 */

import { GoogleGenAI } from "@google/genai";
import { extractFrames } from '../utils/videoProcessing';
import { FrameCenteringService } from '../utils/frameCentering';
import { selectOptimalFrames } from '../utils/frameSelection';
import type { StyleParameters } from '../types';

// Serverless function endpoint (works locally via Vite proxy and on Vercel)
// In local development, this should proxy to a local server or use Vercel dev server
const REPLICATE_PROXY_URL = '/api/replicate';

/**
 * Check if the proxy endpoint is available
 * Returns true if endpoint responds, false otherwise
 */
const checkProxyAvailability = async (): Promise<boolean> => {
  try {
    // Try a simple OPTIONS request to check if endpoint exists
    const response = await fetch(REPLICATE_PROXY_URL, {
      method: 'OPTIONS',
      signal: AbortSignal.timeout(3000) // 3 second timeout
    });
    return response.ok || response.status === 200 || response.status === 204;
  } catch (error) {
    console.warn('[Replicate Service] Proxy endpoint not available:', error);
    return false;
  }
};

// Storage key for Replicate API key
const REPLICATE_API_KEY_STORAGE = 'woujamind_replicate_api_key';
const GEMINI_API_KEY_STORAGE = 'woujamind_api_key';

/**
 * Get Replicate API key from localStorage or environment
 */
export const getReplicateApiKey = (): string => {
  // First check localStorage for stored API key
  if (typeof window !== 'undefined') {
    const storedKey = localStorage.getItem(REPLICATE_API_KEY_STORAGE);
    if (storedKey) return storedKey;
  }

  // Check for environment variable
  const envKey = import.meta.env.VITE_REPLICATE_API_KEY;
  if (envKey) return envKey;

  throw new Error("REPLICATE_API_KEY_MISSING: Please add your Replicate API key in Settings or set VITE_REPLICATE_API_KEY in your .env file");
};

/**
 * Get Gemini API key (for prompt optimization)
 */
const getGeminiApiKey = (): string => {
  if (typeof window !== 'undefined') {
    const storedKey = localStorage.getItem(GEMINI_API_KEY_STORAGE);
    if (storedKey) return storedKey;
  }

  const envKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (envKey) return envKey;

  throw new Error("GEMINI_API_KEY_MISSING: Please add your Gemini API key in Settings for prompt optimization");
};

/**
 * Get Gemini client instance
 */
const getGeminiClient = (): GoogleGenAI => {
  const apiKey = getGeminiApiKey();
  return new GoogleGenAI({ apiKey });
};

/**
 * Calculate optimal grid dimensions for a given frame count
 * Prefers landscape orientation (more columns than rows)
 */
export const calculateGridDimensions = (frameCount: number): { rows: number; cols: number } => {
  // Predefined optimal layouts for common frame counts
  const layouts: Record<number, { rows: number; cols: number }> = {
    6: { rows: 2, cols: 3 },
    8: { rows: 2, cols: 4 },
    16: { rows: 4, cols: 4 },
    24: { rows: 4, cols: 6 },
    32: { rows: 4, cols: 8 },
    48: { rows: 6, cols: 8 },
    64: { rows: 8, cols: 8 },
  };

  if (layouts[frameCount]) {
    return layouts[frameCount];
  }

  // Auto-calculate for other counts (prefer landscape, square-ish)
  const sqrt = Math.sqrt(frameCount);
  let rows = Math.floor(sqrt);
  let cols = Math.ceil(frameCount / rows);

  // Ensure we have enough cells
  while (rows * cols < frameCount) {
    cols++;
  }

  return { rows, cols };
};

/**
 * Optimize a user prompt for Seedance using Gemini 2.5 Pro Image
 * Focuses on character appearance, clothing, proportions, and visual style
 */
export const optimizePromptForSeedance = async (
  referenceImageBase64: string,
  userPrompt: string,
  action: string,
  direction: string,
  styleParameters?: StyleParameters
): Promise<string> => {
  try {
    const ai = getGeminiClient();
    const cleanBase64 = referenceImageBase64.split(',')[1] || referenceImageBase64;

    const optimizationPrompt = `You are a prompt optimization expert for video generation AI models.

Given this reference image and user's prompt, create an optimized prompt for Seedance video generation that will produce a high-quality sprite animation.

User's original prompt: "${userPrompt}"
Action: ${action}
Direction: ${direction}
${styleParameters ? `Style: ${styleParameters.artStyleCategory}, Shading: ${styleParameters.shadingTechnique}` : ''}

CRITICAL REQUIREMENTS:
1. If "1 direction", generate ONLY a single view (front or side view)
2. If "4 directions", generate 4 cardinal views: North, East, South, West
3. If "8 directions", generate all 8 views: N, NE, E, SE, S, SW, W, NW
4. Each direction should show the complete ${action} animation cycle
5. Character appearance (species, gender, physique, distinctive features)
6. Clothing and accessories (exact colors, materials, details)
7. Visual proportions and anatomy
8. Art style and rendering quality
9. MUST include "bright green chroma key background" for clean background removal

Create a concise, detailed prompt (2-3 sentences) that captures the character's visual essence and the desired animation.
Include action verbs and movement descriptors.
ALWAYS end with: "bright green chroma key background"

Output ONLY the optimized prompt text, nothing else.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash-exp',
      contents: {
        parts: [
          { text: optimizationPrompt },
          { inlineData: { mimeType: 'image/png', data: cleanBase64 } }
        ]
      }
    });

    let optimizedPrompt = response.text?.trim();

    if (optimizedPrompt && optimizedPrompt.length > 10) {
      // Ensure green screen background is included
      if (!optimizedPrompt.toLowerCase().includes('green') &&
          !optimizedPrompt.toLowerCase().includes('chroma')) {
        optimizedPrompt += ', bright green chroma key background';
      }
      console.log('[optimizePromptForSeedance] Optimized prompt:', optimizedPrompt);
      return optimizedPrompt;
    } else {
      console.warn('[optimizePromptForSeedance] Optimization failed, using original prompt');
      return userPrompt + ', bright green chroma key background';
    }
  } catch (error) {
    console.warn('[optimizePromptForSeedance] Error optimizing prompt, using original:', error);
    return userPrompt + ', bright green chroma key background';
  }
};

/**
 * Generate a 5-second video from an image using Seedance via serverless function
 * Returns the video as a Blob
 *
 * ARCHITECTURE: Calls /api/replicate serverless function which proxies to Replicate API
 * This avoids CORS issues while keeping the SaaS architecture (no dedicated server)
 */
export const generateVideoFromImage = async (
  imageBase64: string,
  prompt: string,
  onProgress?: (status: string) => void
): Promise<Blob> => {
  const apiKey = getReplicateApiKey();

  try {
    onProgress?.('Initializing video generation...');

    // Check if proxy endpoint is available (with timeout)
    const proxyAvailable = await checkProxyAvailability();
    if (!proxyAvailable) {
      throw new Error(
        'PROXY_UNAVAILABLE: The Replicate API proxy endpoint is not available. ' +
        'If running locally, make sure you are using Vercel dev server (`vercel dev`) ' +
        'or have configured a local proxy. The endpoint should be available at /api/replicate'
      );
    }

    // Convert base64 to data URI if not already
    const imageDataUri = imageBase64.startsWith('data:')
      ? imageBase64
      : `data:image/png;base64,${imageBase64}`;

    console.log('[generateVideoFromImage] Starting Seedance generation with prompt:', prompt);

    // Step 1: Create prediction via serverless function
    const createController = new AbortController();
    const createTimeoutId = setTimeout(() => createController.abort(), 30000); // 30 second timeout for create

    let createResponse;
    try {
      createResponse = await fetch(REPLICATE_PROXY_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'create',
          apiKey: apiKey,
          model: 'a5fd550893da3b6f67997812759065652454ddaca10e96b83b59cbae1814cb36', // seedance-1-pro latest
          input: {
            input_urls: [imageDataUri],
            prompt: prompt,
            duration: 5, // 5 seconds video
            resolution: '480p', // 480p or 720p
            fps: 24, // Only 24 fps supported
            aspect_ratio: '1:1', // Square for sprites
          },
        }),
        signal: createController.signal,
      });
      clearTimeout(createTimeoutId);
    } catch (createError: any) {
      clearTimeout(createTimeoutId);
      if (createError.name === 'AbortError' || createError.message?.includes('timeout')) {
        throw new Error('TIMEOUT: Request to create prediction timed out. The proxy endpoint may be unavailable or slow.');
      }
      throw createError;
    }

    if (!createResponse.ok) {
      const errorData = await createResponse.json().catch(() => ({}));
      throw new Error(errorData.message || `Failed to create prediction: ${createResponse.statusText}`);
    }

    const prediction = await createResponse.json();
    const predictionId = prediction.id;

    console.log('[generateVideoFromImage] Prediction created:', predictionId);

    // Step 2: Poll for completion
    let status = prediction.status;
    let output = prediction.output;
    const MAX_POLL_TIME = 5 * 60 * 1000; // 5 minutes
    const POLL_INTERVAL = 2000; // 2 seconds
    const MAX_ITERATIONS = 150; // Maximum number of polling iterations (5 min / 2 sec = 150)
    const startTime = Date.now();
    let iterationCount = 0;

    while (status === 'starting' || status === 'processing') {
      // Safety check: Maximum iterations
      iterationCount++;
      if (iterationCount > MAX_ITERATIONS) {
        throw new Error('TIMEOUT: Video generation exceeded maximum polling iterations. The prediction may be stuck.');
      }

      // Check timeout
      if (Date.now() - startTime > MAX_POLL_TIME) {
        throw new Error('TIMEOUT: Video generation took too long (>5 minutes)');
      }

      // Wait before polling
      await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL));

      // Get prediction status
      let statusData;
      try {
        // Add timeout to prevent hanging requests
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout per request

        const statusResponse = await fetch(REPLICATE_PROXY_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'get',
            apiKey: apiKey,
            predictionId: predictionId,
          }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!statusResponse.ok) {
          const errorData = await statusResponse.json().catch(() => ({}));
          throw new Error(errorData.message || `Failed to get prediction status: ${statusResponse.statusText}`);
        }

        statusData = await statusResponse.json();
      } catch (fetchError: any) {
        console.error('[generateVideoFromImage] Polling error:', fetchError);
        
        // Handle timeout specifically
        if (fetchError.name === 'AbortError' || fetchError.message?.includes('timeout')) {
          throw new Error('TIMEOUT: Request to Replicate API proxy timed out. The proxy endpoint may be unavailable or slow.');
        }
        
        // If we can't get status, break the loop and throw
        throw new Error(`Failed to poll prediction status: ${fetchError.message || 'Network error'}`);
      }

      // Validate response structure
      if (!statusData || typeof statusData !== 'object') {
        console.error('[generateVideoFromImage] Invalid status response:', statusData);
        throw new Error('Invalid response from Replicate API: status data is malformed');
      }

      // Update status - validate it exists
      const newStatus = statusData.status;
      if (!newStatus || typeof newStatus !== 'string') {
        console.error('[generateVideoFromImage] Missing or invalid status in response:', statusData);
        throw new Error('Invalid response from Replicate API: status field is missing or invalid');
      }

      // Only update if status actually changed (prevents infinite loops from malformed responses)
      if (newStatus !== status) {
        status = newStatus;
        output = statusData.output;
        console.log('[generateVideoFromImage] Status changed:', status, '(iteration', iterationCount, ')');
      } else {
        // Status unchanged - log for debugging but continue polling
        console.log('[generateVideoFromImage] Status unchanged:', status, '(iteration', iterationCount, ')');
      }

      // Validate status is a known value - break loop if unexpected
      const validStatuses = ['starting', 'processing', 'succeeded', 'failed', 'canceled'];
      if (!validStatuses.includes(status)) {
        console.error('[generateVideoFromImage] Unexpected status value:', status);
        throw new Error(`Unexpected prediction status from Replicate API: "${status}". Expected one of: ${validStatuses.join(', ')}`);
      }

      // Update progress
      if (status === 'processing') {
        onProgress?.('Generating video...');
      } else if (status === 'succeeded') {
        onProgress?.('Video generated, downloading...');
      } else if (status === 'failed') {
        onProgress?.('Video generation failed...');
      } else if (status === 'canceled') {
        onProgress?.('Video generation canceled...');
      }
    }

    // Step 3: Check final status
    if (status === 'failed') {
      throw new Error(`Video generation failed: ${prediction.error || 'Unknown error'}`);
    }

    if (status === 'canceled') {
      throw new Error('Video generation was canceled');
    }

    if (status !== 'succeeded') {
      throw new Error(`Unexpected prediction status: ${status}`);
    }

    // Step 4: Get video URL
    let videoUrl: string;
    if (typeof output === 'string') {
      videoUrl = output;
    } else if (Array.isArray(output) && output.length > 0) {
      videoUrl = output[0];
    } else {
      throw new Error('Unexpected output format from Seedance');
    }

    onProgress?.('Downloading video...');

    // Step 5: Download the video
    const response = await fetch(videoUrl);
    if (!response.ok) {
      throw new Error(`Failed to download video: ${response.statusText}`);
    }

    const videoBlob = await response.blob();
    console.log('[generateVideoFromImage] Video downloaded, size:', videoBlob.size, 'bytes');

    return videoBlob;

  } catch (error: any) {
    console.error('[generateVideoFromImage] Error:', error);

    // Handle specific error types
    if (error.message?.includes('REPLICATE_API_KEY_MISSING')) {
      throw error;
    } else if (error.message?.includes('rate limit')) {
      throw new Error('RATE_LIMIT: Replicate API rate limit exceeded. Please wait a moment and try again.');
    } else if (error.message?.includes('TIMEOUT')) {
      throw error; // Pass through timeout errors
    } else {
      throw new Error(`Video generation failed: ${error.message || 'Unknown error'}`);
    }
  }
};

/**
 * Extract frames from a video blob
 * Returns array of canvas elements, one per frame
 */
export const extractFramesFromVideo = async (
  videoBlob: Blob,
  frameCount: number,
  onProgress?: (current: number, total: number) => void
): Promise<HTMLCanvasElement[]> => {
  console.log('[extractFramesFromVideo] Extracting', frameCount, 'frames from video');

  try {
    const frames = await extractFrames(videoBlob, {
      frameCount,
      onProgress: (current, total) => {
        console.log(`[extractFramesFromVideo] Progress: ${current}/${total}`);
        onProgress?.(current, total);
      },
      onFrameExtracted: (frameIndex, canvas) => {
        console.log(`[extractFramesFromVideo] Extracted frame ${frameIndex}: ${canvas.width}x${canvas.height}`);
      }
    });

    console.log('[extractFramesFromVideo] Successfully extracted', frames.length, 'frames');
    return frames;

  } catch (error: any) {
    console.error('[extractFramesFromVideo] Error:', error);
    throw new Error(`Frame extraction failed: ${error.message || 'Unknown error'}`);
  }
};

/**
 * Create a sprite sheet from individual frames
 * Arranges frames in a grid layout with transparent background
 * Automatically removes backgrounds from the final sprite sheet
 */
export const createSpriteSheetFromFrames = async (
  frames: HTMLCanvasElement[],
  rows: number,
  cols: number,
  removeBackground: boolean = true
): Promise<HTMLCanvasElement> => {
  if (frames.length === 0) {
    throw new Error('No frames provided for sprite sheet creation');
  }

  const frameWidth = frames[0].width;
  const frameHeight = frames[0].height;

  // Create sprite sheet canvas with alpha support
  const spriteSheet = document.createElement('canvas');
  spriteSheet.width = cols * frameWidth;
  spriteSheet.height = rows * frameHeight;

  const ctx = spriteSheet.getContext('2d', { alpha: true, willReadFrequently: true });
  if (!ctx) {
    throw new Error('Failed to create sprite sheet canvas context');
  }

  // Start with transparent background instead of white
  ctx.clearRect(0, 0, spriteSheet.width, spriteSheet.height);

  // Draw frames in grid layout
  let frameIndex = 0;
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      if (frameIndex >= frames.length) break;

      const x = col * frameWidth;
      const y = row * frameHeight;

      ctx.drawImage(frames[frameIndex], x, y);
      frameIndex++;
    }
  }

  console.log('[createSpriteSheetFromFrames] Created sprite sheet:', spriteSheet.width, 'x', spriteSheet.height);

  // Automatically remove background from the entire sprite sheet
  if (removeBackground) {
    console.log('[createSpriteSheetFromFrames] Removing background from sprite sheet...');
    const { processRemoveBackground } = await import('../utils/imageHelpers');
    processRemoveBackground(ctx, spriteSheet.width, spriteSheet.height);
    console.log('[createSpriteSheetFromFrames] Background removal complete');
  }

  return spriteSheet;
};

/**
 * Complete pipeline: Generate sprite sheet from reference image
 *
 * Steps:
 * 1. Optimize prompt for Seedance (Gemini 2.5 Pro Image)
 * 2. Generate video from image (Replicate Seedance)
 * 3. Extract ALL frames from video (150 frames at 30 FPS)
 * 4. Smart frame selection (pick optimal frames for animation)
 * 5. Center frames (fix animation jumping/drifting)
 * 6. Create sprite sheet from selected frames (Canvas Grid)
 */
export const generateSpriteSheetFromImage = async (
  referenceImageBase64: string,
  userPrompt: string,
  action: string,
  direction: string,
  frameCount: number,
  styleParameters?: StyleParameters,
  onStatusUpdate?: (status: string) => void,
  onFrameProgress?: (current: number, total: number) => void
): Promise<{ 
  spriteSheet: HTMLCanvasElement; 
  rows: number; 
  cols: number;
  allFrames: HTMLCanvasElement[];        // NEW: All 150 extracted frames
  selectedIndices: number[];              // NEW: Indices of frames used in sprite sheet
}> => {
  try {
    // Step 1: Optimize prompt
    onStatusUpdate?.('Optimizing prompt for animation...');
    const optimizedPrompt = await optimizePromptForSeedance(
      referenceImageBase64,
      userPrompt,
      action,
      direction,
      styleParameters
    );

    // Step 2: Generate video
    onStatusUpdate?.('Generating video animation (this may take 1-2 minutes)...');
    const videoBlob = await generateVideoFromImage(
      referenceImageBase64,
      optimizedPrompt,
      onStatusUpdate
    );

    // Step 3: Extract ALL frames from video (150 frames at 30 FPS)
    onStatusUpdate?.('Extracting all frames from video (150 frames)...');
    const ALL_FRAMES_COUNT = 150; // Seedance generates 5 seconds at 30 FPS
    const allFrames = await extractFramesFromVideo(
      videoBlob,
      ALL_FRAMES_COUNT,
      onFrameProgress
    );
    console.log('[generateSpriteSheetFromImage] Extracted', allFrames.length, 'total frames');

    // Step 4: Smart frame selection - pick optimal frames for animation
    onStatusUpdate?.('Selecting optimal frames for smooth animation...');
    console.log('[generateSpriteSheetFromImage] Selecting', frameCount, 'frames from', allFrames.length);
    
    const selectedIndices = selectOptimalFrames(
      allFrames,
      {
        totalFrames: allFrames.length,
        targetFrameCount: frameCount,
        method: 'smart' // Uses quality-based selection within even segments
      },
      (current, total) => {
        console.log(`[Frame Selection] Progress: ${current}/${total}`);
      }
    );
    
    console.log('[generateSpriteSheetFromImage] Selected frame indices:', selectedIndices);
    
    // Extract selected frames
    const selectedFrames = selectedIndices.map(idx => allFrames[idx]);

    // Step 5: CENTER FRAMES (CRITICAL - Fixes animation jumping/drifting)
    onStatusUpdate?.('Centering character frames for smooth animation...');
    console.log('[generateSpriteSheetFromImage] Centering', selectedFrames.length, 'selected frames');
    
    const centeringService = new FrameCenteringService({
      targetWidth: 256,
      targetHeight: 256,
      paddingPercent: 0.1,
      debug: true
    });
    
    const centeredFrames = await centeringService.centerFramesBatch(selectedFrames);
    console.log('[generateSpriteSheetFromImage] Successfully centered all frames');

    // Step 6: Calculate grid dimensions
    const { rows, cols } = calculateGridDimensions(frameCount);
    console.log('[generateSpriteSheetFromImage] Grid dimensions:', rows, 'x', cols);

    // Step 7: Create sprite sheet from centered frames with automatic background removal
    onStatusUpdate?.('Creating sprite sheet and removing backgrounds...');
    const spriteSheet = await createSpriteSheetFromFrames(centeredFrames, rows, cols, true);

    onStatusUpdate?.('Sprite sheet generated successfully!');

    return {
      spriteSheet,
      rows,
      cols,
      allFrames,           // Return all 150 frames for user selection
      selectedIndices      // Return which frames were auto-selected
    };

  } catch (error: any) {
    console.error('[generateSpriteSheetFromImage] Pipeline error:', error);

    // Re-throw with better error messages
    if (error.message?.includes('API_KEY_MISSING')) {
      throw error; // Pass through API key errors
    } else if (error.message?.includes('RATE_LIMIT')) {
      throw error; // Pass through rate limit errors
    } else if (error.message?.includes('TIMEOUT')) {
      throw error; // Pass through timeout errors
    } else {
      throw new Error(`Sprite sheet generation failed: ${error.message || 'Unknown error'}`);
    }
  }
};
