import { GoogleGenAI } from "@google/genai";
import type { StyleParameters, MultiViewData, CharacterAnalysis, SpriteDirection } from '../types';

// API Key management - supports stored key, window.aistudio, and env var
const getApiKey = async (): Promise<string> => {
  // First check localStorage for stored API key
  if (typeof window !== 'undefined') {
    const storedKey = localStorage.getItem('woujamind_api_key');
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
 * Extracts a consistent character definition with style parameters.
 */
export const analyzeCharacter = async (
  imageBase64: string,
  userDescription: string
): Promise<CharacterAnalysis> => {
  const ai = await getClient();
  const cleanBase64 = imageBase64.split(',')[1] || imageBase64;

  const descPrompt = `Analyze this character image and the user's notes: "${userDescription}".
Provide a concise, objective visual description of the character design.
Focus strictly on:
- Appearance (Species, gender, age, physique).
- Attire (Clothing items, exact colors, accessories).
- Distinctive features (Hair style, face, markings).

Output strictly the description string. Do not include intro/outro text.`;

  try {
    const [descResponse, styleParams, multiViewData] = await Promise.all([
      // Character description
      ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: {
          parts: [
            { text: descPrompt },
            { inlineData: { mimeType: 'image/png', data: cleanBase64 } }
          ]
        }
      }),
      // Style analysis
      analyzeStyleParameters(imageBase64),
      // Multi-view detection
      detectMultiViewCharacter(imageBase64)
    ]);

    const characterDescription = descResponse.text?.trim() || userDescription;

    return {
      characterDescription,
      styleParameters: styleParams,
      isMultiView: multiViewData !== null,
      viewData: multiViewData || undefined
    };

  } catch (e) {
    console.warn("Analysis failed, falling back to user description", e);
    return {
      characterDescription: userDescription,
      styleParameters: await analyzeStyleParameters(imageBase64),
      isMultiView: false,
      viewData: undefined
    };
  }
};

/**
 * ADVANCED STYLE ANALYSIS
 * Extracts detailed style parameters from reference image using Gemini Vision
 */
export const analyzeStyleParameters = async (
  imageBase64: string
): Promise<StyleParameters> => {
  const ai = await getClient();
  const cleanBase64 = imageBase64.split(',')[1] || imageBase64;

  const prompt = `You are a professional digital artist and technical art analyzer specializing in sprite art.
Analyze this image and extract PRECISE technical style parameters.

CRITICAL: Return ONLY valid JSON in the exact format specified. No markdown, no explanation.

Analyze these aspects:

1. LINE & EDGE PROPERTIES:
   - Line weight (ultra-thin, thin, medium, thick, heavy, variable)
   - Line style (clean, sketchy, pixel-perfect, organic, geometric)
   - Edge quality (crisp, soft, anti-aliased, pixelated, feathered)

2. SHADING & RENDERING:
   - Shading technique (flat, cel-shaded, gradient, dithered, hatched, soft-shaded)
   - Lighting model (ambient, directional, rim-lit, dramatic, soft)
   - Contrast level (low, medium, high, very-high)

3. COLOR PROPERTIES:
   - Extract 5-8 primary hex colors used
   - Total color count (approximate)
   - Saturation level (desaturated, moderate, saturated, vibrant)
   - Temperature (cool, neutral, warm)

4. TEXTURE & DETAIL:
   - Texture level (minimal, moderate, detailed, highly-detailed)
   - Detail density (simple, moderate, complex)
   - Surface finish (matte, glossy, metallic, mixed)

5. OVERALL CLASSIFICATION:
   - Art style category (pixel, low-poly, vector, hand-drawn, voxel, watercolor, mixed, custom)
   - Technical notes (array of specific observations)

OUTPUT FORMAT (strict JSON):
{
  "lineWeight": "medium",
  "lineStyle": "clean",
  "edgeQuality": "crisp",
  "shadingTechnique": "cel-shaded",
  "lightingModel": "directional",
  "contrastLevel": "high",
  "colorPalette": {
    "primaryColors": ["#FF5733", "#33FF57", "#3357FF"],
    "colorCount": 12,
    "saturation": "saturated",
    "temperature": "warm"
  },
  "textureLevel": "moderate",
  "detailDensity": "moderate",
  "surfaceFinish": "matte",
  "artStyleCategory": "vector",
  "technicalNotes": ["Bold outlines", "Flat color fills", "No gradients"]
}

Return ONLY the JSON object above, no additional text.`;

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

    const text = response.text?.trim() || '';
    // Remove markdown code blocks if present
    const cleanText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    const styleParams = JSON.parse(cleanText) as StyleParameters;
    return styleParams;

  } catch (e) {
    console.warn("Style analysis failed, using defaults", e);
    // Return safe defaults
    return {
      lineWeight: 'medium',
      lineStyle: 'clean',
      edgeQuality: 'crisp',
      shadingTechnique: 'flat',
      lightingModel: 'ambient',
      contrastLevel: 'medium',
      colorPalette: {
        primaryColors: [],
        colorCount: 0,
        saturation: 'moderate',
        temperature: 'neutral'
      },
      textureLevel: 'moderate',
      detailDensity: 'moderate',
      surfaceFinish: 'matte',
      artStyleCategory: 'custom',
      technicalNotes: ['Style analysis unavailable']
    };
  }
};

/**
 * Convert extracted style parameters to detailed prompt for generation
 */
const styleParametersToPrompt = (params: StyleParameters): string => {
  const parts: string[] = [];

  // Line & Edge
  parts.push(`LINE QUALITY: ${params.lineWeight} ${params.lineStyle} lines with ${params.edgeQuality} edges.`);

  // Shading
  parts.push(`SHADING: ${params.shadingTechnique} shading with ${params.lightingModel} lighting and ${params.contrastLevel} contrast.`);

  // Color
  if (params.colorPalette.primaryColors.length > 0) {
    parts.push(`COLOR PALETTE: Use these exact colors: ${params.colorPalette.primaryColors.join(', ')}. Total ${params.colorPalette.colorCount} colors max, ${params.colorPalette.saturation} saturation, ${params.colorPalette.temperature} temperature.`);
  }

  // Texture
  parts.push(`TEXTURE & DETAIL: ${params.textureLevel} texture level, ${params.detailDensity} detail density, ${params.surfaceFinish} surface finish.`);

  // Technical notes
  if (params.technicalNotes.length > 0) {
    parts.push(`STYLE NOTES: ${params.technicalNotes.join('; ')}.`);
  }

  return parts.join('\n');
};

/**
 * MULTI-VIEW CHARACTER SHEET DETECTION
 * Detects if image contains multiple character views (turnaround sheet)
 * and identifies the direction of each view
 */
export const detectMultiViewCharacter = async (
  imageBase64: string
): Promise<MultiViewData | null> => {
  const ai = await getClient();
  const cleanBase64 = imageBase64.split(',')[1] || imageBase64;

  const prompt = `You are a professional game artist analyzing character reference sheets.

TASK: Determine if this image contains MULTIPLE VIEWS of the SAME CHARACTER (a turnaround sheet),
or just a SINGLE VIEW.

SINGLE VIEW INDICATORS:
- Only one character pose/angle visible
- One figure in the image
- No repeated character at different angles

MULTI-VIEW INDICATORS (Turnaround Sheet):
- Same character shown from different angles (front, back, left, right, 3/4 views)
- Multiple figures that are clearly the same character design
- Organized layout showing character rotation
- Labels like "front", "back", "side" may be present

If MULTI-VIEW detected, identify each view's direction and approximate position.

DIRECTIONS:
- front: Character facing viewer directly
- back: Character's back to viewer
- left: Character facing left (showing right side to viewer)
- right: Character facing right (showing left side to viewer)
- front-left: 3/4 view, mostly front but turned left
- front-right: 3/4 view, mostly front but turned right
- back-left: 3/4 view, mostly back but turned left
- back-right: 3/4 view, mostly back but turned right

OUTPUT FORMAT (strict JSON):

If SINGLE VIEW:
{
  "isMultiView": false
}

If MULTI-VIEW:
{
  "isMultiView": true,
  "viewCount": 4,
  "detectedViews": [
    {
      "direction": "front",
      "position": "left",
      "confidence": 0.95,
      "description": "Character facing forward, centered in leftmost position"
    },
    {
      "direction": "right",
      "position": "center-left",
      "confidence": 0.9,
      "description": "Character facing right, second from left"
    }
  ],
  "layoutType": "horizontal",
  "recommendations": ["Use front view for front-facing sprites", "Use right view for side-facing actions"]
}

Return ONLY valid JSON, no additional text.`;

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

    const text = response.text?.trim() || '';
    const cleanText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const result = JSON.parse(cleanText);

    if (!result.isMultiView) {
      return null; // Single view image
    }

    // Multi-view detected - return the detection data
    return {
      viewCount: result.viewCount,
      detectedViews: result.detectedViews.map((view: any) => ({
        direction: view.direction as SpriteDirection,
        description: view.description,
        position: view.position,
        confidence: view.confidence
      })),
      layoutType: result.layoutType,
      recommendations: result.recommendations || []
    };

  } catch (e) {
    console.warn("Multi-view detection failed", e);
    return null; // Treat as single view on error
  }
};

// Action mapping with directional prompts
interface DirectionalPrompts {
  front: string;
  back: string;
  left: string;
  right: string;
  'front-left': string;
  'front-right': string;
  'back-left': string;
  'back-right': string;
}

interface SpriteAction {
  id: string;
  label: string;
  prompts: DirectionalPrompts;
}

const ACTION_MAP: Record<string, SpriteAction> = {
  'idle': {
    id: 'idle',
    label: 'Idle / Breathing',
    prompts: {
      front: 'idle stance, facing viewer directly, frontal view, subtle breathing motion, eyes blinking, slight bobbing, neutral posture',
      back: 'idle stance, back to viewer, rear view, subtle breathing motion, slight bobbing, relaxed posture',
      left: 'idle stance, facing left, side profile view, subtle breathing motion, eyes blinking, slight bobbing',
      right: 'idle stance, facing right, side profile view, subtle breathing motion, eyes blinking, slight bobbing',
      'front-left': 'idle stance, 3/4 view facing front-left, subtle breathing motion, eyes visible, slight bobbing',
      'front-right': 'idle stance, 3/4 view facing front-right, subtle breathing motion, eyes visible, slight bobbing',
      'back-left': 'idle stance, 3/4 view facing back-left, rear-angle view, subtle breathing, back partially visible',
      'back-right': 'idle stance, 3/4 view facing back-right, rear-angle view, subtle breathing, back partially visible'
    }
  },
  'walk': {
    id: 'walk',
    label: 'Walk Cycle',
    prompts: {
      front: 'smooth walking cycle, facing viewer, frontal walk, legs crossing in perspective, arms swinging naturally, forward movement toward viewer',
      back: 'smooth walking cycle, back to viewer, rear walk, legs crossing, arms swinging, walking away from viewer',
      left: 'smooth walking cycle, facing left, side profile view, legs crossing, arms swinging naturally, standard walk cycle',
      right: 'smooth walking cycle, facing right, side profile view, legs crossing, arms swinging naturally, standard walk cycle',
      'front-left': 'smooth walking cycle, 3/4 front-left view, dynamic diagonal movement, natural stride',
      'front-right': 'smooth walking cycle, 3/4 front-right view, dynamic diagonal movement, natural stride',
      'back-left': 'smooth walking cycle, 3/4 back-left view, walking away at angle, back partially visible',
      'back-right': 'smooth walking cycle, 3/4 back-right view, walking away at angle, back partially visible'
    }
  },
  'run': {
    id: 'run',
    label: 'Run Cycle',
    prompts: {
      front: 'fast running cycle, facing viewer, frontal run, dynamic forward lean, aggressive gait, pumping arms, running toward viewer',
      back: 'fast running cycle, back to viewer, rear run, running away from viewer, arms pumping, dynamic movement',
      left: 'fast running cycle, facing left, side profile view, dynamic forward lean, aggressive gait, clean movement lines',
      right: 'fast running cycle, facing right, side profile view, dynamic forward lean, aggressive gait, clean movement lines',
      'front-left': 'fast running cycle, 3/4 front-left view, diagonal sprint, dynamic lean, powerful stride',
      'front-right': 'fast running cycle, 3/4 front-right view, diagonal sprint, dynamic lean, powerful stride',
      'back-left': 'fast running cycle, 3/4 back-left view, running away at angle, energetic movement',
      'back-right': 'fast running cycle, 3/4 back-right view, running away at angle, energetic movement'
    }
  },
  'jump': {
    id: 'jump',
    label: 'Jump',
    prompts: {
      front: 'jump sequence, facing viewer, frontal view: anticipation crouch, launch upward, mid-air peak arms up, landing crouch',
      back: 'jump sequence, back to viewer, rear view: anticipation crouch, launch upward, mid-air peak, landing',
      left: 'jump sequence, facing left, side profile view: anticipation, launch, mid-air tuck, descent, landing',
      right: 'jump sequence, facing right, side profile view: anticipation, launch, mid-air tuck, descent, landing',
      'front-left': 'jump sequence, 3/4 front-left view, diagonal jump, dynamic aerial pose',
      'front-right': 'jump sequence, 3/4 front-right view, diagonal jump, dynamic aerial pose',
      'back-left': 'jump sequence, 3/4 back-left view, jumping away at angle',
      'back-right': 'jump sequence, 3/4 back-right view, jumping away at angle'
    }
  },
  'attack': {
    id: 'attack',
    label: 'Attack / Slash',
    prompts: {
      front: 'combat attack sequence, facing viewer, frontal strike, wind up, powerful strike forward at viewer, follow through, no enemies, no blood',
      back: 'combat attack sequence, back to viewer, rear attack, striking away from viewer, wind up visible from behind, follow through',
      left: 'combat attack sequence, facing left, side profile strike, wind up, strike across body, follow through, pantomime',
      right: 'combat attack sequence, facing right, side profile strike, wind up, strike across body, follow through, pantomime',
      'front-left': 'combat attack sequence, 3/4 front-left view, diagonal strike, dynamic slashing motion',
      'front-right': 'combat attack sequence, 3/4 front-right view, diagonal strike, dynamic slashing motion',
      'back-left': 'combat attack sequence, 3/4 back-left view, attacking away from viewer',
      'back-right': 'combat attack sequence, 3/4 back-right view, attacking away from viewer'
    }
  },
  'cast': {
    id: 'cast',
    label: 'Cast Spell',
    prompts: {
      front: 'magic casting animation, facing viewer, frontal cast, gathering energy in hands held forward, magical gesture, hands toward viewer, pantomime',
      back: 'magic casting animation, back to viewer, rear cast, gathering energy, hands raised visible from back, magical pose',
      left: 'magic casting animation, facing left, side profile cast, gathering energy in hands (pantomime), mystical gestures',
      right: 'magic casting animation, facing right, side profile cast, gathering energy in hands (pantomime), mystical gestures',
      'front-left': 'magic casting animation, 3/4 front-left view, diagonal spellcast, energy gathering, dynamic pose',
      'front-right': 'magic casting animation, 3/4 front-right view, diagonal spellcast, energy gathering, dynamic pose',
      'back-left': 'magic casting animation, 3/4 back-left view, casting away from viewer, magical gestures',
      'back-right': 'magic casting animation, 3/4 back-right view, casting away from viewer, magical gestures'
    }
  }
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

const DEFAULT_SYSTEM_RULES = `PERSONA: You are a master game artist and technical animator specializing in production-ready sprite sheets for professional 2D game development. You understand the precise technical requirements for game engine integration and prioritize pixel-perfect consistency and clean composition.

QUALITY STANDARDS:
• Invisible grid structure - mathematical spacing only, zero visible borders or separators
• Pixel-perfect consistency - exact character dimensions, proportions, and colors across every frame
• Professional-grade composition - optimal padding, perfect centering, complete character visibility
• Production-ready output - pristine white backgrounds (#FFFFFF), zero artifacts or annotations
• Enhanced detail - leverage advanced model capabilities for superior sprite quality and animation smoothness`;

/**
 * Return type for sprite sheet generation
 */
export interface SpriteSheetResult {
  imageData: string;
  prompt: string;
  modelId: string;
  characterDescription: string;
  styleParameters?: StyleParameters;
  direction: SpriteDirection;
}

/**
 * Generate a single reference image from a text prompt
 * Used when no reference image is uploaded - creates a character portrait for Replicate
 */
export const generateReferenceImage = async (
  userPrompt: string,
  artStyleId: string = 'pixel',
  modelId: string = 'gemini-2.5-flash-image'
): Promise<string> => {
  try {
    const ai = await getClient();

    const stylePrompt = STYLE_MAP[artStyleId] || STYLE_MAP['pixel'];

    const prompt = `Create a single, centered character portrait for game sprite animation reference.

CHARACTER: ${userPrompt}
STYLE: ${stylePrompt}

REQUIREMENTS:
• Full-body character portrait, facing right (side view or 3/4 view)
• Character centered on pure white background (#FFFFFF)
• Clear, detailed rendering showing all features, clothing, and accessories
• Neutral standing pose (idle position)
• Character should occupy 60-70% of the canvas height
• No grid, no multiple views, just ONE clean character portrait
• Professional game art quality with clean edges

OUTPUT: A single, high-quality reference image suitable for video-based sprite generation.`;

    console.log('[generateReferenceImage] Generating reference image with prompt:', userPrompt);
    console.log('[generateReferenceImage] Using model:', modelId);

    const response = await ai.models.generateContent({
      model: modelId,
      contents: { parts: [{ text: prompt }] },
      config: {
        imageConfig: {
          aspectRatio: "1:1",
          imageSize: modelId.includes('pro') ? "2K" : undefined
        }
      }
    });

    for (const candidate of response.candidates || []) {
      if (candidate.content?.parts) {
        for (const part of candidate.content.parts) {
          if (part.inlineData?.data) {
            const imageBase64 = `data:image/png;base64,${part.inlineData.data}`;
            console.log('[generateReferenceImage] Successfully generated reference image');
            return imageBase64;
          }
        }
      }
    }

    throw new Error("No reference image generated by Gemini");

  } catch (error) {
    console.error('[generateReferenceImage] Error:', error);
    throw new Error(`Failed to generate reference image: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

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
  direction: SpriteDirection = 'right',
  rows: number = 2,
  cols: number = 4,
  modelId: string = 'gemini-2.5-flash-image',
  customRules?: string,
  multiViewData?: MultiViewData | null
): Promise<SpriteSheetResult> => {
  // If no custom rules provided, load from localStorage based on model
  if (!customRules && typeof window !== 'undefined') {
    // Check if model is 3.0 variant (not 2.5)
    const is30Model = modelId.includes('gemini-3') || modelId.includes('3.0');
    const key = is30Model ? 'woujamind_gemini_30_rules' : 'woujamind_gemini_25_rules';
    customRules = localStorage.getItem(key) || DEFAULT_SYSTEM_RULES;
  } else if (!customRules) {
    customRules = DEFAULT_SYSTEM_RULES;
  }

  console.log(`[Woujamind] Using model: ${modelId}`);
  console.log(`[Woujamind] Custom rules (first 100 chars):`, customRules?.substring(0, 100));
  try {
    const ai = await getClient();
    
    // Get action and style
    const action = ACTION_MAP[actionId] || ACTION_MAP['idle'];
    const stylePrompt = STYLE_MAP[artStyleId] || STYLE_MAP['pixel'];

    // Build character description and analyze style
    let characterDescription = userPrompt || "A game character sprite";
    let analysis: CharacterAnalysis | null = null;
    if (imageBase64) {
      // If we have an image, analyze it first
      analysis = await analyzeCharacter(imageBase64, userPrompt);
      characterDescription = analysis.characterDescription;
    }

    // Build action instructions with directional prompt
    const totalFrames = rows * cols;
    const actionPrompt = action.prompts[direction] || action.prompts.right;
    const actionInstructions = `
      ACTION: ${action.label} (${actionPrompt})
      DIRECTION: ${direction.toUpperCase()}
      ${expressionId !== 'neutral' ? `EXPRESSION: ${expressionId}` : ''}
      INSTRUCTION: Create a ${totalFrames}-frame animation loop of this action from the ${direction} direction.
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

    // Build style instructions - use extracted parameters if available
    let styleInstructions: string;
    if (artStyleId === 'inherited' && analysis?.styleParameters) {
      styleInstructions = `STYLE REQUIREMENTS:\n${styleParametersToPrompt(analysis.styleParameters)}\nMatch the reference image style EXACTLY.`;
    } else if (stylePrompt) {
      styleInstructions = `STYLE: ${stylePrompt}`;
    } else {
      styleInstructions = 'STYLE: Match the reference image style exactly';
    }

    // Build the prompt - optimized for Gemini 3 Pro Image
    const prompt = `${customRules}

TASK: Create a ${rows}x${cols} sprite sheet (${totalFrames} frames total) for game animation.

CHARACTER: ${characterDescription}
${styleInstructions}

ANIMATION: ${action.label} - ${actionPrompt}
DIRECTION: ${direction.toUpperCase()}${expressionId !== 'neutral' ? `\nEXPRESSION: ${expressionId}` : ''}

CRITICAL: Each of the ${totalFrames} frames MUST show a DIFFERENT pose/position in the animation sequence.
Frame 1: Starting pose
Frame 2: Different pose (progressed in the animation)
Frame 3: Different pose (further progressed)
Frame 4: Different pose (continuing the cycle)
Frame 5: Different pose (mid-cycle)
Frame 6: Different pose (continuing)
Frame 7: Different pose (almost complete)
Frame 8: Different pose (completing the loop back to frame 1)

DO NOT create ${totalFrames} identical copies - each frame must show clear visual progression through the ${action.label} animation.

LAYOUT REQUIREMENTS - CRITICAL FOR ANIMATION:
• Arrange sprites in an invisible ${rows}x${cols} grid (mathematical spacing only)
• CRITICAL POSITIONING: Imagine a vertical centerline running through the middle of each cell
  - The character's SPINE/BODY CENTER must align with this centerline in EVERY frame
  - The character's FEET/BASE must touch an invisible horizontal line at the SAME height in EVERY frame
  - Think of it like the character is standing on a treadmill with a pole through their center
• ABSOLUTE REQUIREMENT: The character CANNOT move left, right, up, or down between frames
  - ONLY the limbs, head tilt, and accessories should move
  - The torso/body core position must be LOCKED in place
  - If the character raises their arms, their body stays at the same position
  - If the character bends, their feet stay planted at the same spot
• 10% padding minimum from cell edges
• All sprites must have identical dimensions when overlaid

COMPOSITION RULES:
• Pure white background (#FFFFFF) - no scenery, ground, or shadows
• No visible grid lines, borders, or cell separators
• No frame numbers, labels, or text annotations
• Each sprite completely isolated - no connecting elements between cells
• PROPS: Character may hold props (swords, items, tools) that stay WITH the character in each frame
• EFFECTS: Magic effects, sparks, or visual effects should stay CLOSE to the character (within 20% of character height)
• FORBIDDEN: No projectiles, beams, or effects that extend far from the character or across multiple frames
• FORBIDDEN: No duplicate or extra limbs/body parts - each character has exactly ONE set of body parts
• Full character body visible in every frame

POSITIONING VERIFICATION (Check each frame):
• Measure from the left edge of the cell to the character's center → MUST be identical in all frames
• Measure from the bottom of the cell to the character's feet → MUST be identical in all frames
• If you were to overlay all frames, the character's body should be in the exact same position
• Think: "If this was a flip book, would the character stay in place?" → Answer must be YES

OUTPUT: ${totalFrames} clean, consistent animation frames in a ${rows}x${cols} invisible grid layout.`;

    console.log(`[Generate] ===== STARTING GENERATION =====`);
    console.log(`[Generate] Grid: ${rows}x${cols}, AR: ${bestRatio}, Model: ${modelId}`);
    console.log(`[Generate] Art Style: ${artStyleId} -> "${stylePrompt?.substring(0, 50)}..."`);
    console.log(`[Generate] Action: ${actionId} -> ${action.label}`);
    console.log(`[Generate] Character: "${characterDescription?.substring(0, 100)}..."`);
    console.log(`[Generate] Has reference image: ${!!imageBase64}`);
    console.log(`[Generate] Full prompt (first 300 chars):\n`, prompt.substring(0, 300));

    const imageConfig: any = { aspectRatio: bestRatio };
    if (modelId.includes('pro')) imageConfig.imageSize = "2K";

    const contents: any[] = [{ text: prompt }];
    if (imageBase64) {
      const cleanBase64 = imageBase64.split(',')[1] || imageBase64;
      contents.push({ inlineData: { mimeType: 'image/png', data: cleanBase64 } });
      console.log(`[Generate] Reference image size: ${cleanBase64.length} chars`);
    }

    console.log(`[Generate] Calling API with model: ${modelId}`);
    const response = await ai.models.generateContent({
      model: modelId,
      contents: { parts: contents },
      config: { imageConfig }
    });
    console.log(`[Generate] Got response from API`);

    for (const candidate of response.candidates || []) {
      if (candidate.content?.parts) {
        for (const part of candidate.content.parts) {
          if (part.inlineData?.data) {
            return {
              imageData: `data:image/png;base64,${part.inlineData.data}`,
              prompt: prompt.trim(),
              modelId: modelId,
              characterDescription: characterDescription,
              styleParameters: analysis?.styleParameters,
              direction: direction
            };
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
 * AI-POWERED PROMPT ENHANCEMENT
 * Uses Gemini 2.5 Flash to intelligently enhance user prompts
 */
export const enhancePrompt = async (userPrompt: string): Promise<string> => {
  if (!userPrompt.trim()) return userPrompt;

  try {
    const ai = await getClient();

    const enhancementPrompt = `You are a professional game artist specializing in sprite sheet character design. Enhance this character description to be more detailed and specific for sprite generation.

USER INPUT: "${userPrompt}"

TASK: Expand this into a detailed character description that includes:
- Physical appearance (species, build, age if relevant)
- Clothing and accessories (colors, style, materials)
- Art style suggestions (pixel art, vector, etc.)
- Any distinctive features or characteristics

RULES:
- Keep it concise (2-3 sentences max)
- Be specific about visual details
- Maintain the user's original intent
- Add professional sprite art terminology
- Focus on what will help generate a consistent sprite sheet

OUTPUT: Return ONLY the enhanced description text, no introduction or explanation.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: { parts: [{ text: enhancementPrompt }] }
    });

    const enhanced = response.text?.trim();
    return enhanced || userPrompt;
  } catch (error) {
    console.error('Prompt enhancement failed:', error);
    return userPrompt; // Fallback to original
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
  console.log('[Edit] ===== STARTING EDIT =====');
  console.log('[Edit] Edit prompt:', editPrompt);
  console.log('[Edit] Model:', modelId);
  console.log('[Edit] Image data length:', imageBase64?.length || 0);

  try {
    const ai = await getClient();
    console.log('[Edit] Got AI client successfully');

    const cleanBase64 = imageBase64.split(',')[1] || imageBase64;
    console.log('[Edit] Cleaned base64 length:', cleanBase64.length);

    // Build a more aggressive edit prompt that ensures changes are visible
    const fullPrompt = `PERSONA: You are a master pixel artist editing a game sprite sheet. Your task is to apply the requested changes CLEARLY and VISIBLY while maintaining sprite sheet structure.

EDIT REQUEST: ${editPrompt}

CRITICAL: You MUST apply the requested changes. If the user asks to remove something, REMOVE IT. If they ask to add something, ADD IT. If they ask to change something, CHANGE IT. DO NOT be conservative - make the changes obvious and complete.

STRUCTURAL RULES (preserve these):
• Keep the EXACT same image dimensions and layout
• Keep the EXACT same background color (pure white #FFFFFF)
• Preserve grid structure and frame count precisely
• Keep sprite positions and spacing consistent

EDIT RULES (apply these changes):
• Apply the requested modification COMPLETELY and VISIBLY
• If removing duplicate body parts, actually remove them from ALL frames
• If changing colors, change them across ALL frames for consistency
• If improving quality, enhance detail across ALL frames
• Make changes obvious - don't be subtle or conservative

OUTPUT: Generate the modified sprite sheet with CLEAR, VISIBLE changes as requested.`;

    console.log(`[Edit] Prompt: "${editPrompt}"`);
    console.log(`[Edit] Model: ${modelId}`);
    console.log(`[Edit] Full prompt (first 200 chars):`, fullPrompt.substring(0, 200));

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
    console.log('[Edit] Response structure:', {
      hasCandidates: !!response.candidates,
      candidatesLength: response.candidates?.length,
      firstCandidate: response.candidates?.[0] ? 'exists' : 'missing',
      finishReason: response.candidates?.[0]?.finishReason,
      parts: response.candidates?.[0]?.content?.parts?.map(p => Object.keys(p)),
      hasBlockedReason: response.candidates?.[0]?.finishReason !== 'STOP'
    });

    // Check for blocked or filtered responses
    if (response.candidates?.[0]?.finishReason && response.candidates[0].finishReason !== 'STOP') {
      console.error('[Edit] Response was blocked or filtered:', response.candidates[0].finishReason);
      throw new Error(`Edit blocked by API: ${response.candidates[0].finishReason}. Try a different prompt or model.`);
    }

    // Try multiple paths to find the image data
    if (response.candidates && response.candidates.length > 0) {
      for (const candidate of response.candidates) {
        if (candidate.content?.parts) {
          for (const part of candidate.content.parts) {
            if (part.inlineData?.data) {
              console.log('[Edit] Successfully extracted edited image');
              return `data:image/png;base64,${part.inlineData.data}`;
            }
          }
        }
      }
    }

    // If no image found, throw detailed error
    console.error('[Edit] No image found in response');
    throw new Error(
      `No image generated in edit response. Response structure: ${JSON.stringify({
        hasCandidates: !!response.candidates,
        candidateCount: response.candidates?.length || 0,
        finishReason: response.candidates?.[0]?.finishReason,
        contentParts: response.candidates?.[0]?.content?.parts?.length
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

/**
 * Generate an in-between frame for smooth animation transitions
 * Takes two adjacent frames and generates a frame that smoothly transitions between them
 */
export const generateInBetweenFrame = async (
  frameBefore: string | null,
  frameAfter: string | null,
  action: string,
  characterDescription: string,
  artStyle: string,
  modelId: string = 'gemini-2.5-flash-image'
): Promise<string> => {
  console.log('[InBetween] ===== STARTING IN-BETWEEN FRAME GENERATION =====');
  console.log('[InBetween] Action:', action);
  console.log('[InBetween] Art style:', artStyle);
  console.log('[InBetween] Has before frame:', !!frameBefore);
  console.log('[InBetween] Has after frame:', !!frameAfter);

  try {
    const ai = await getClient();
    console.log('[InBetween] Got AI client successfully');

    // Build the prompt based on what frames we have
    let prompt = '';
    const parts: any[] = [];

    if (frameBefore && frameAfter) {
      // We have both frames - generate a true in-between
      prompt = `PERSONA: You are a master game sprite animator creating smooth animation transitions.

TASK: Generate a single sprite frame that creates a smooth transition between the two frames shown.

CHARACTER: ${characterDescription}
ACTION: ${action} animation
ART STYLE: ${artStyle}

CRITICAL REQUIREMENTS:
• The frame MUST be visually between the two reference frames (before and after)
• Match the EXACT same art style, proportions, and character design
• Create a natural, fluid motion transition
• Keep the EXACT same dimensions and transparent background
• Ensure the character pose is intermediate between the two shown poses
• Maintain consistent sprite quality and detail level

ANIMATION GUIDANCE:
• Analyze the movement/change between the two frames
• Create a pose/expression that logically bridges them
• Ensure smooth visual flow when played in sequence
• Keep body proportions and character features identical

OUTPUT: A single sprite frame that smoothly transitions from the first to the second frame.`;

      const cleanBefore = frameBefore.split(',')[1] || frameBefore;
      const cleanAfter = frameAfter.split(',')[1] || frameAfter;

      parts.push(
        { text: prompt },
        { inlineData: { mimeType: 'image/png', data: cleanBefore } },
        { text: 'Frame BEFORE (the transition starts here):' },
        { inlineData: { mimeType: 'image/png', data: cleanAfter } },
        { text: 'Frame AFTER (the transition ends here):' }
      );
    } else if (frameBefore) {
      // Only have before frame - create a next logical frame
      prompt = `PERSONA: You are a master game sprite animator creating smooth animation sequences.

TASK: Generate the next logical frame in this animation sequence.

CHARACTER: ${characterDescription}
ACTION: ${action} animation
ART STYLE: ${artStyle}

REFERENCE: You are given the previous frame. Generate the NEXT frame that continues this animation naturally.

CRITICAL REQUIREMENTS:
• Create the next logical pose/expression in the ${action} animation
• Match the EXACT same art style, proportions, and character design
• Keep the EXACT same dimensions and transparent background
• Ensure smooth, natural progression from the reference frame
• Maintain consistent sprite quality and detail level

ANIMATION GUIDANCE:
• Analyze the current pose/expression in the reference
• Determine the next natural position in the ${action} sequence
• Create smooth, incremental movement (not a dramatic jump)
• Keep the animation feeling fluid and professional

OUTPUT: A single sprite frame that naturally follows the reference frame.`;

      const cleanBefore = frameBefore.split(',')[1] || frameBefore;
      parts.push(
        { text: prompt },
        { text: 'Previous frame (generate the NEXT frame after this):' },
        { inlineData: { mimeType: 'image/png', data: cleanBefore } }
      );
    } else if (frameAfter) {
      // Only have after frame - create a preceding frame
      prompt = `PERSONA: You are a master game sprite animator creating smooth animation sequences.

TASK: Generate the frame that comes BEFORE this animation frame.

CHARACTER: ${characterDescription}
ACTION: ${action} animation
ART STYLE: ${artStyle}

REFERENCE: You are given the next frame. Generate the frame that comes BEFORE it in the animation.

CRITICAL REQUIREMENTS:
• Create the logical preceding pose/expression in the ${action} animation
• Match the EXACT same art style, proportions, and character design
• Keep the EXACT same dimensions and transparent background
• Ensure smooth transition TO the reference frame
• Maintain consistent sprite quality and detail level

ANIMATION GUIDANCE:
• Analyze the pose/expression in the reference frame
• Determine what natural position would come before it
• Create smooth, incremental movement (not a dramatic jump)
• Keep the animation feeling fluid and professional

OUTPUT: A single sprite frame that naturally precedes the reference frame.`;

      const cleanAfter = frameAfter.split(',')[1] || frameAfter;
      parts.push(
        { text: prompt },
        { text: 'Next frame (generate the frame BEFORE this):' },
        { inlineData: { mimeType: 'image/png', data: cleanAfter } }
      );
    } else {
      throw new Error('At least one reference frame (before or after) is required');
    }

    console.log('[InBetween] Sending request to Gemini...');
    const response = await ai.models.generateContent({
      model: modelId,
      contents: { parts }
    });

    console.log('[InBetween] Response structure:', {
      hasCandidates: !!response.candidates,
      candidatesLength: response.candidates?.length,
      finishReason: response.candidates?.[0]?.finishReason,
    });

    // Check for blocked or filtered responses
    if (response.candidates?.[0]?.finishReason && response.candidates[0].finishReason !== 'STOP') {
      console.error('[InBetween] Response blocked:', response.candidates[0].finishReason);
      throw new Error(`Generation blocked by API: ${response.candidates[0].finishReason}`);
    }

    // Extract image data
    if (response.candidates && response.candidates.length > 0) {
      for (const candidate of response.candidates) {
        if (candidate.content?.parts) {
          for (const part of candidate.content.parts) {
            if (part.inlineData?.data) {
              console.log('[InBetween] Successfully generated in-between frame');
              return `data:image/png;base64,${part.inlineData.data}`;
            }
          }
        }
      }
    }

    console.error('[InBetween] No image found in response');
    throw new Error('No image generated in response');

  } catch (error) {
    console.error('[InBetween] Generation failed:', error);
    throw error;
  }
};

/**
 * Generate AI-powered character prompt suggestions for a given category
 * @param category The category of character prompts to generate (e.g., "Fantasy Heroes", "Sci-Fi Characters")
 * @param count Number of prompts to generate (default: 5)
 * @returns Array of generated character prompts
 */
export const generateCharacterPrompts = async (
  category: string,
  count: number = 5
): Promise<string[]> => {
  const ai = await getClient();

  const prompt = `You are a creative game character designer. Generate ${count} detailed character prompts for sprite art creation.

CATEGORY: ${category}

REQUIREMENTS FOR EACH PROMPT:
• Front-facing pose/view explicitly mentioned
• Detailed appearance description (species, physique, attire, colors)
• Specific visual details (hair, accessories, features)
• Art style guidance (sprite-ready, clean silhouette, animation-friendly)
• Each prompt should be 1-2 sentences, specific and actionable
• Include exact colors, clothing items, and distinctive features
• Optimized for sprite sheet animation generation

FORMAT: Return ONLY a JSON array of strings, no additional text.
Example: ["prompt 1", "prompt 2", "prompt 3"]

Generate ${count} creative, diverse character prompts for: ${category}`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [{ text: prompt }]
      }
    });

    const text = response.text?.trim() || '';

    // Try to parse JSON response
    try {
      // Remove markdown code blocks if present
      const cleanText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const prompts = JSON.parse(cleanText);

      if (Array.isArray(prompts) && prompts.length > 0) {
        return prompts.slice(0, count);
      }
    } catch (parseError) {
      console.warn('Failed to parse JSON, trying line-based parsing:', parseError);

      // Fallback: try to extract prompts line by line
      const lines = text.split('\n').filter(line => line.trim().length > 0);
      const prompts = lines
        .map(line => line.replace(/^[-•*]\s*/, '').replace(/^"\s*/, '').replace(/\s*"$/, '').trim())
        .filter(line => line.length > 20); // Filter out short lines that aren't prompts

      if (prompts.length > 0) {
        return prompts.slice(0, count);
      }
    }

    throw new Error('Failed to generate prompts');

  } catch (error) {
    console.error('[GeneratePrompts] Generation failed:', error);
    throw error;
  }
};

/**
 * AI-POWERED SPRITE SHEET ALIGNMENT
 * Uses Gemini Vision to analyze sprite sheet and detect optimal grid boundaries
 * Returns alignment data for smooth, consistent animations
 */
export interface AlignmentAnalysis {
  detectedRows: number;
  detectedCols: number;
  frameWidth: number;
  frameHeight: number;
  alignmentIssues: string[];
  recommendations: string[];
}

export const aiAnalyzeSpriteSheet = async (
  imageBase64: string,
  expectedRows: number,
  expectedCols: number
): Promise<AlignmentAnalysis> => {
  try {
    const ai = await getClient();
    const cleanBase64 = imageBase64.split(',')[1] || imageBase64;

    const analysisPrompt = `You are a professional sprite sheet quality analyzer. Analyze this sprite sheet image and provide a detailed technical assessment.

EXPECTED GRID: ${expectedRows} rows × ${expectedCols} columns

TASK: Analyze the sprite sheet and detect:
1. Actual grid structure (rows and columns)
2. Frame boundaries and spacing
3. Character alignment consistency across frames
4. Any misalignment, drift, or positioning issues
5. Grid line visibility (should be invisible)
6. Background consistency

OUTPUT FORMAT (JSON only, no markdown):
{
  "detectedRows": number,
  "detectedCols": number,
  "frameWidth": number (pixels),
  "frameHeight": number (pixels),
  "alignmentIssues": ["issue1", "issue2", ...],
  "recommendations": ["recommendation1", "recommendation2", ...]
}

ISSUES TO DETECT:
- Frames not aligned to consistent grid
- Characters drifting horizontally or vertically between frames
- Inconsistent character sizes across frames
- Visible grid lines or borders
- Background color inconsistencies
- Frames overlapping or too close together
- Missing or empty frames

RECOMMENDATIONS TO PROVIDE:
- Specific alignment corrections needed
- Grid boundary adjustments
- Frame spacing optimizations
- Character positioning fixes

Return ONLY valid JSON, no additional text or explanation.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          { text: analysisPrompt },
          { inlineData: { mimeType: 'image/png', data: cleanBase64 } }
        ]
      }
    });

    const text = response.text?.trim() || '';
    
    // Try to parse JSON response
    try {
      // Remove markdown code blocks if present
      const cleanText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const analysis = JSON.parse(cleanText) as AlignmentAnalysis;
      
      // Validate and fallback to expected values if detection fails
      return {
        detectedRows: analysis.detectedRows || expectedRows,
        detectedCols: analysis.detectedCols || expectedCols,
        frameWidth: analysis.frameWidth || 0,
        frameHeight: analysis.frameHeight || 0,
        alignmentIssues: Array.isArray(analysis.alignmentIssues) ? analysis.alignmentIssues : [],
        recommendations: Array.isArray(analysis.recommendations) ? analysis.recommendations : []
      };
    } catch (parseError) {
      console.warn('Failed to parse AI analysis JSON, using fallback:', parseError);
      // Fallback: return expected values with generic issues
      return {
        detectedRows: expectedRows,
        detectedCols: expectedCols,
        frameWidth: 0,
        frameHeight: 0,
        alignmentIssues: ['Could not analyze sprite sheet structure'],
        recommendations: ['Perform manual alignment check']
      };
    }
  } catch (error) {
    console.error('AI sprite sheet analysis failed:', error);
    // Return safe fallback
    return {
      detectedRows: expectedRows,
      detectedCols: expectedCols,
      frameWidth: 0,
      frameHeight: 0,
      alignmentIssues: ['AI analysis unavailable'],
      recommendations: ['Using standard alignment algorithm']
    };
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

