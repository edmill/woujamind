/**
 * Replicate Service
 * Handles all Replicate API interactions for Seedance video generation
 */

import Replicate from 'replicate';
import { GoogleGenAI } from "@google/genai";
import { extractFrames } from '../utils/videoProcessing';
import type { StyleParameters } from '../types';

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
 * Get Replicate client instance
 */
const getReplicateClient = (): Replicate => {
  const apiKey = getReplicateApiKey();
  return new Replicate({
    auth: apiKey,
  });
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
  // Predefined optimal layouts
  const layouts: Record<number, { rows: number; cols: number }> = {
    8: { rows: 2, cols: 4 },
    16: { rows: 4, cols: 4 },
    24: { rows: 4, cols: 6 },
    32: { rows: 4, cols: 8 },
    48: { rows: 6, cols: 8 },
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
${styleParameters ? `Style: ${styleParameters.artStyle}, Rendering: ${styleParameters.renderingStyle}` : ''}

Focus on:
1. Character appearance (species, gender, physique, distinctive features)
2. Clothing and accessories (exact colors, materials, details)
3. Visual proportions and anatomy
4. Art style and rendering quality
5. The specific action and direction

Create a concise, detailed prompt (2-3 sentences) that captures the character's visual essence and the desired animation.
Include action verbs and movement descriptors.
Do NOT include camera angles, backgrounds, or environmental details - just the character and their motion.

Output ONLY the optimized prompt text, nothing else.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-pro-latest',
      contents: {
        parts: [
          { text: optimizationPrompt },
          { inlineData: { mimeType: 'image/png', data: cleanBase64 } }
        ]
      }
    });

    const optimizedPrompt = response.text?.trim();

    if (optimizedPrompt && optimizedPrompt.length > 10) {
      console.log('[optimizePromptForSeedance] Optimized prompt:', optimizedPrompt);
      return optimizedPrompt;
    } else {
      console.warn('[optimizePromptForSeedance] Optimization failed, using original prompt');
      return userPrompt;
    }
  } catch (error) {
    console.warn('[optimizePromptForSeedance] Error optimizing prompt, using original:', error);
    return userPrompt;
  }
};

/**
 * Generate a 5-second video from an image using Seedance
 * Returns the video as a Blob
 */
export const generateVideoFromImage = async (
  imageBase64: string,
  prompt: string,
  onProgress?: (status: string) => void
): Promise<Blob> => {
  const replicate = getReplicateClient();

  try {
    onProgress?.('Initializing video generation...');

    // Convert base64 to data URI if not already
    const imageDataUri = imageBase64.startsWith('data:')
      ? imageBase64
      : `data:image/png;base64,${imageBase64}`;

    console.log('[generateVideoFromImage] Starting Seedance generation with prompt:', prompt);

    // Call Seedance model
    // Model: bytedance/seedance-1-pro-fast
    const output = await replicate.run(
      "bytedance/seedance-1-pro-fast:a8c7ea67-c9ab-4f71-ac84-4036af08734b",
      {
        input: {
          image: imageDataUri,
          prompt: prompt,
          num_frames: 150, // 5 seconds at 30 FPS
          guidance_scale: 7.5,
          num_inference_steps: 20,
        }
      },
      {
        // Progress callback
        onProgress: (prediction) => {
          const status = prediction.status;
          const logs = prediction.logs;

          if (logs) {
            console.log('[Seedance]', logs);
          }

          if (status === 'processing') {
            onProgress?.('Generating video...');
          } else if (status === 'succeeded') {
            onProgress?.('Video generated, downloading...');
          }
        }
      }
    );

    console.log('[generateVideoFromImage] Seedance output:', output);

    // Output should be a video URL
    let videoUrl: string;
    if (typeof output === 'string') {
      videoUrl = output;
    } else if (Array.isArray(output) && output.length > 0) {
      videoUrl = output[0];
    } else {
      throw new Error('Unexpected output format from Seedance');
    }

    onProgress?.('Downloading video...');

    // Download the video
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
    } else if (error.message?.includes('timeout')) {
      throw new Error('TIMEOUT: Video generation timed out after 5 minutes. Please try again with a simpler prompt.');
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
 * Arranges frames in a grid layout with white background
 */
export const createSpriteSheetFromFrames = (
  frames: HTMLCanvasElement[],
  rows: number,
  cols: number
): HTMLCanvasElement => {
  if (frames.length === 0) {
    throw new Error('No frames provided for sprite sheet creation');
  }

  const frameWidth = frames[0].width;
  const frameHeight = frames[0].height;

  // Create sprite sheet canvas
  const spriteSheet = document.createElement('canvas');
  spriteSheet.width = cols * frameWidth;
  spriteSheet.height = rows * frameHeight;

  const ctx = spriteSheet.getContext('2d', { alpha: true });
  if (!ctx) {
    throw new Error('Failed to create sprite sheet canvas context');
  }

  // Fill with white background
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, spriteSheet.width, spriteSheet.height);

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
  return spriteSheet;
};

/**
 * Complete pipeline: Generate sprite sheet from reference image
 *
 * Steps:
 * 1. Optimize prompt for Seedance (Gemini 2.5 Pro Image)
 * 2. Generate video from image (Replicate Seedance)
 * 3. Extract frames from video (Native Canvas)
 * 4. Create sprite sheet from frames (Canvas Grid)
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
): Promise<{ spriteSheet: HTMLCanvasElement; rows: number; cols: number }> => {
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

    // Step 3: Extract frames
    onStatusUpdate?.('Extracting frames from video...');
    const frames = await extractFramesFromVideo(
      videoBlob,
      frameCount,
      onFrameProgress
    );

    // Step 4: Calculate grid dimensions
    const { rows, cols } = calculateGridDimensions(frameCount);
    console.log('[generateSpriteSheetFromImage] Grid dimensions:', rows, 'x', cols);

    // Step 5: Create sprite sheet
    onStatusUpdate?.('Creating sprite sheet...');
    const spriteSheet = createSpriteSheetFromFrames(frames, rows, cols);

    onStatusUpdate?.('Sprite sheet generated successfully!');

    return { spriteSheet, rows, cols };

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
