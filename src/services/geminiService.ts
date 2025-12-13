import { GoogleGenAI } from "@google/genai";

// API Key management - supports stored key, window.aistudio, and env var
const getApiKey = async (): Promise<string> => {
  // First check localStorage for stored API key
  if (typeof window !== 'undefined') {
    const storedKey = localStorage.getItem('sprite_magic_api_key');
    if (storedKey) return storedKey;
  }
  
  // Check for environment variable (supports both process.env and import.meta.env)
  // @ts-ignore - process.env is defined in vite.config.ts
  const envKey = process.env?.API_KEY || process.env?.GEMINI_API_KEY || import.meta.env.VITE_GEMINI_API_KEY;
  if (envKey) return envKey;
  
  // If no env key, check if we're in AI Studio and user has selected a key
  if (typeof window !== 'undefined' && window.aistudio) {
    const hasKey = await window.aistudio.hasSelectedApiKey();
    if (hasKey) {
      // In AI Studio, when a key is selected, it should be available via env
      // If not, we'll throw an error asking user to set it
      throw new Error("API_KEY_MISSING: Please set GEMINI_API_KEY or VITE_GEMINI_API_KEY in your environment or .env file, or add it in Settings");
    }
  }
  
  throw new Error("API_KEY_MISSING: Please set GEMINI_API_KEY or VITE_GEMINI_API_KEY in your .env file, add it in Settings, or connect via AI Studio");
};

const getClient = async () => {
  const apiKey = await getApiKey();
  return new GoogleGenAI({ apiKey });
};

/**
 * STAGE 1: THE ANALYST
 * Extracts a consistent character definition.
 */
export const analyzeCharacter = async (
  imageBase64: string,
  userDescription: string
): Promise<string> => {
  const ai = await getClient();
  const cleanBase64 = imageBase64.split(',')[1] || imageBase64;

  const prompt = `
    Analyze this character image and the user's notes: "${userDescription}".
    Provide a concise, objective visual description of the character design.
    Focus strictly on:
    - Appearance (Species, gender, age, physique).
    - Attire (Clothing items, exact colors, accessories).
    - Distinctive features (Hair style, face, markings).
    - Art Style (Pixel art, flat vector, etc).
    
    Output strictly the description string. Do not include intro/outro text.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          { text: prompt },
          { inlineData: { mimeType: 'image/png', data: cleanBase64 } }
        ]
      }
    });

    const refinedPrompt = response.text?.trim();
    return refinedPrompt || userDescription;

  } catch (e) {
    console.warn("Analysis failed, falling back to user description", e);
    return userDescription;
  }
};

// Action mapping from new UI to spritegen.ai format
interface SpriteAction {
  id: string;
  label: string;
  prompt: string;
}

const ACTION_MAP: Record<string, SpriteAction> = {
  'idle': { id: 'idle', label: 'Idle / Breathing', prompt: 'idle stance, facing right, subtle breathing motion, eyes blinking, slight bobbing' },
  'walk': { id: 'walk', label: 'Walk Cycle', prompt: 'smooth walking cycle, facing right, side view, legs crossing, arms swinging naturally' },
  'run': { id: 'run', label: 'Run Cycle', prompt: 'fast running cycle, facing right, dynamic forward lean, clean movement lines, aggressive gait' },
  'jump': { id: 'jump', label: 'Jump', prompt: 'jump sequence, facing right: anticipation, launch, mid-air tuck, landing' },
  'attack': { id: 'attack', label: 'Attack / Slash', prompt: 'combat attack sequence, facing right, striking thin air (pantomime), wind up, strike, follow through, no enemies, no blood' },
  'cast': { id: 'cast', label: 'Cast Spell', prompt: 'magic casting animation, facing right, gathering energy in hands (pantomime), no projectiles leaving the frame' },
};

// Style mapping from new UI to spritegen.ai format
const STYLE_MAP: Record<string, string> = {
  'pixel': 'Pixel Art Style, 16-bit Super Nintendo aesthetic, sharp hard edges, limited color palette, no anti-aliasing, retro gaming feel.',
  'low-poly': 'Low Poly 3D Style, geometric shapes with flat shading, angular surfaces, minimalist color palette, modern indie game aesthetic.',
  'vector': 'Vector Art Style, thick clean outlines, cel-shaded flat colors, "Castle Crashers" or "Scribblenauts" aesthetic, smooth curves.',
  'hand-drawn': 'Hand Drawn Style, sketchy lines, organic textures, artistic brush strokes, traditional animation feel, expressive linework.',
  'voxel': 'Voxel Art Style, 3D pixel cubes, Minecraft-style blocky aesthetic, isometric perspective, cubic geometry.',
  'watercolor': 'Watercolor Art Style, soft edges, blending colors, translucent layers, artistic painting aesthetic, fluid textures.',
  'inherited': '', // Will use the image's existing style
};

const DEFAULT_SYSTEM_RULES = `1. INVISIBLE GRID: The grid layout is strictly mathematical. Do NOT draw visible grid lines, boxes, borders, or separators.
2. SOLID BACKGROUND: Use PURE WHITE (#FFFFFF) or magenta (#FF00FF) background ONLY. Absolutely NO black backgrounds. Do not draw scenery or ground lines.
3. NO TEXT/NUMBERS: Do NOT add frame numbers, labels, or annotations of any kind.
4. CHARACTER CONSISTENCY: The character must be pixel-perfect identical in every frame.
5. CENTERED: Center the character in every cell.
6. FULL BODY: Ensure the entire character fits within the cell.
7. USE FULL CANVAS: Fill the grid cells appropriately, do not leave excessive whitespace.`;

/**
 * STAGE 2: THE GENERATOR
 * Creates the sprite sheet.
 */
export const generateSpriteSheet = async (
  imageBase64: string | null,
  actionId: string,
  expressionId: string,
  artStyleId: string,
  userPrompt: string,
  rows: number = 2,
  cols: number = 4,
  modelId: string = 'gemini-2.5-flash-image',
  customRules?: string
): Promise<string> => {
  // If no custom rules provided, load from localStorage based on model
  if (!customRules && typeof window !== 'undefined') {
    const key = modelId.includes('3.0') ? 'sprite_magic_gemini_30_rules' : 'sprite_magic_gemini_25_rules';
    customRules = localStorage.getItem(key) || DEFAULT_SYSTEM_RULES;
  } else if (!customRules) {
    customRules = DEFAULT_SYSTEM_RULES;
  }
  try {
    const ai = await getClient();
    
    // Get action and style
    const action = ACTION_MAP[actionId] || ACTION_MAP['idle'];
    const stylePrompt = STYLE_MAP[artStyleId] || STYLE_MAP['pixel'];
    
    // Build character description
    let characterDescription = userPrompt || "A game character sprite";
    if (imageBase64) {
      // If we have an image, analyze it first
      characterDescription = await analyzeCharacter(imageBase64, userPrompt);
    }

    // Build action instructions
    const totalFrames = rows * cols;
    const actionInstructions = `
      ACTION: ${action.label} (${action.prompt})
      ${expressionId !== 'neutral' ? `EXPRESSION: ${expressionId}` : ''}
      INSTRUCTION: Create a ${totalFrames}-frame animation loop of this action.
      IMPORTANT: Animate the character IN-PLACE (like a treadmill). Do not move the character across the screen. Center the character in every grid cell.
    `;

    // Aspect Ratio Logic
    const targetRatio = cols / rows;
    const supportedRatios = [
      { id: "1:1", val: 1.0 },
      { id: "3:4", val: 0.75 },
      { id: "4:3", val: 1.33 },
      { id: "9:16", val: 0.5625 },
      { id: "16:9", val: 1.777 },
    ];
    const bestRatio = supportedRatios.reduce((prev, curr) => 
      (Math.abs(curr.val - targetRatio) < Math.abs(prev.val - targetRatio) ? curr : prev)
    ).id;

    // Build the prompt
    const prompt = `
      You are an expert game artist creating a specialized Sprite Sheet with an INVISIBLE GRID LAYOUT.
      
      STRICT GRID SPECIFICATION:
      - The output MUST be a precise grid of exactly ${rows} ROWS and ${cols} COLUMNS.
      - TOTAL FRAMES: ${totalFrames}.
      - You MUST fill EVERY cell in the grid with a sprite. Do not leave any empty cells or partial rows.
      - COMPOSITION: Draw exactly ONE character centered in EACH grid cell.
      - SPACING: Each sprite should have adequate padding from the edges of its cell (at least 10% on all sides).
      
      CHARACTER DESIGN:
      - Description: ${characterDescription}
      ${stylePrompt ? `- Style: ${stylePrompt}` : '- Style: Match the reference image style exactly'}
      - CONSISTENCY: The character must look identical in every frame (same size, colors, proportions, position).
      - CENTERING: Each character must be perfectly centered horizontally and positioned consistently vertically in its grid cell.
      
      ANIMATION TASKS:
      ${actionInstructions}
      
      CRITICAL RESTRICTIONS (DO NOT IGNORE):
      1. INVISIBLE GRID ONLY: The grid layout is purely mathematical - like a checkerboard pattern. NEVER draw visible grid lines, cell borders, boxes, dividing lines, or frame separators. The grid exists only as a spacing guide.
      2. CLEAN WHITE BACKGROUND ONLY: The background MUST be solid PURE WHITE (#FFFFFF). Do NOT use magenta, pink, gray, black, or any other color. The entire background must be uniform white with NO variations, ground lines, floors, shadows, or scenery.
      3. NO CELL BORDERS: Do NOT draw outlines, boxes, or borders around individual sprites or grid cells.
      4. NO PROPS OR SCENERY: Do NOT draw environment objects like ladders, boxes, platforms, or background elements.
      5. PANTOMIME RULE: If the action involves an object (e.g. climbing, hitting), the character must PANTOMIME the action in thin air.
      6. NO PROJECTILES: Do NOT draw fireballs, bullets, or magic spells leaving the character's hand that would cross into other grid cells.
      7. NO CONNECTING PIXELS: Each sprite is completely isolated. Do NOT draw horizontal bars, ropes, lines, or any elements that connect multiple frames together.
      8. CONSISTENT SIZING: All characters must be the exact same size across all frames - only pose/animation should change.
      
      ${customRules}
    `;

    console.log(`Generating ${rows}x${cols} sheet. AR: ${bestRatio}. Model: ${modelId}`);

    const imageConfig: any = { aspectRatio: bestRatio };
    if (modelId.includes('pro')) imageConfig.imageSize = "2K";

    const contents: any[] = [{ text: prompt }];
    if (imageBase64) {
      const cleanBase64 = imageBase64.split(',')[1] || imageBase64;
      contents.push({ inlineData: { mimeType: 'image/png', data: cleanBase64 } });
    }

    const response = await ai.models.generateContent({
      model: modelId,
      contents: { parts: contents },
      config: { imageConfig }
    });

    for (const candidate of response.candidates || []) {
      if (candidate.content?.parts) {
        for (const part of candidate.content.parts) {
          if (part.inlineData?.data) {
            return `data:image/png;base64,${part.inlineData.data}`;
          }
        }
      }
    }

    throw new Error("No image generated.");

  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};

/**
 * MAGIC EDIT
 */
export const editSpriteSheet = async (
  imageBase64: string,
  editPrompt: string,
  modelId: string = 'gemini-2.5-flash-image'
): Promise<string> => {
  try {
    const ai = await getClient();
    const cleanBase64 = imageBase64.split(',')[1] || imageBase64;

    // Build a more comprehensive edit prompt
    const fullPrompt = `
      You are editing a sprite sheet image. Follow these rules STRICTLY:
      
      CRITICAL REQUIREMENTS:
      1. MAINTAIN GRID: Keep the exact same grid layout and frame count. Do NOT add or remove frames.
      2. BACKGROUND: Preserve the background color exactly as it is. If white, keep white. If magenta, keep magenta. NEVER change to black.
      3. GRID LINES: Do NOT add visible grid lines or borders.
      4. CONSISTENCY: Keep the character design consistent across all frames.
      5. STRUCTURE: This is a sprite sheet for animation - maintain the animation sequence.
      
      USER REQUEST: ${editPrompt}
      
      IMPORTANT: If the request would destroy the sprite sheet structure (like "remove sprite"), instead clean up or improve the existing sprites while keeping them visible and properly framed.
    `;

    console.log(`Editing sprite sheet. Prompt: "${editPrompt}". Model: ${modelId}`);

    const response = await ai.models.generateContent({
      model: modelId,
      contents: {
        parts: [
          { text: fullPrompt },
          { inlineData: { mimeType: 'image/png', data: cleanBase64 } }
        ]
      }
    });

    // Debug log the response structure
    console.log('Edit response structure:', {
      hasCandidates: !!response.candidates,
      candidatesLength: response.candidates?.length,
      firstCandidate: response.candidates?.[0] ? 'exists' : 'missing',
      parts: response.candidates?.[0]?.content?.parts?.map(p => Object.keys(p))
    });

    // Try multiple paths to find the image data
    if (response.candidates && response.candidates.length > 0) {
      for (const candidate of response.candidates) {
        if (candidate.content?.parts) {
          for (const part of candidate.content.parts) {
            if (part.inlineData?.data) {
              return `data:image/png;base64,${part.inlineData.data}`;
            }
          }
        }
      }
    }

    // If no image found, throw detailed error
    throw new Error(
      `No image generated in edit response. Response structure: ${JSON.stringify({
        hasCandidates: !!response.candidates,
        candidateCount: response.candidates?.length || 0,
        finishReason: response.candidates?.[0]?.finishReason
      })}`
    );

  } catch (error) {
    console.error("Edit failed:", error);
    // If it's a safety filter or content policy error, provide helpful message
    if (error instanceof Error && error.message.includes('SAFETY')) {
      throw new Error('Edit blocked by safety filters. Try a different prompt.');
    }
    throw error;
  }
};

// Global interface for AI Studio
declare global {
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }

  interface Window {
    aistudio?: AIStudio;
  }
}

