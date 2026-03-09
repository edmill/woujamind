
import { GoogleGenAI } from "@google/genai";
import { SpriteAction } from "../types";

const getClient = () => {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("API_KEY_MISSING: Set VITE_GEMINI_API_KEY in .env or provide key via UI.");
    }
    return new GoogleGenAI({ apiKey });
}

/**
 * STAGE 1: THE ANALYST
 * Extracts a consistent character definition.
 */
export const analyzeCharacter = async (
    imageBase64: string,
    userDescription: string
): Promise<string> => {
    const ai = getClient();
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
}

/**
 * STAGE 2: THE GENERATOR
 * Creates the sprite sheet.
 */
export const generateSpriteSheet = async (
  imageBase64: string,
  actions: SpriteAction[],
  stylePrompt: string,
  rows: number,
  cols: number,
  additionalNotes: string = "",
  refinedDescription: string,
  modelId: string = 'gemini-2.5-flash-image',
  customRules: string // NEW PARAMETER
): Promise<string> => {
  try {
    const ai = getClient();
    const cleanBase64 = imageBase64.split(',')[1] || imageBase64;

    // Construct simple, direct action instructions
    let actionInstructions = "";
    const totalFrames = rows * cols;

    if (actions.length === 1) {
        const a = actions[0];
        actionInstructions = `
        ACTION: ${a.label} (${a.prompt})
        INSTRUCTION: Create a ${totalFrames}-frame animation loop of this action.
        IMPORTANT: Animate the character IN-PLACE (like a treadmill). Do not move the character across the screen. Center the character in every grid cell.
        `;
    } else {
        actionInstructions = "ACTIONS PER ROW:\n";
        actions.forEach((a, index) => {
            if (index < rows) {
                actionInstructions += `- ROW ${index + 1}: ${a.label} (${a.prompt})\n`;
            }
        });
        if (actions.length < rows) {
             actionInstructions += `- REMAINING ROWS: Idle or variation of previous action.\n`;
        }
    }

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

    // SIMPLIFIED PROMPT FOR BETTER COMPLIANCE
    const prompt = `
      You are an expert game artist creating a specialized Sprite Sheet with an INVISIBLE GRID LAYOUT.
      
      STRICT GRID SPECIFICATION:
      - The output MUST be a precise grid of exactly ${rows} ROWS and ${cols} COLUMNS.
      - TOTAL FRAMES: ${totalFrames}.
      - You MUST fill EVERY cell in the grid with a sprite. Do not leave any empty cells or partial rows.
      - COMPOSITION: Draw exactly ONE character centered in EACH grid cell.
      
      CHARACTER DESIGN:
      - Description: ${refinedDescription}
      - Style: ${stylePrompt} ${additionalNotes}
      - CONSISTENCY: The character must look identical in every frame (same size, colors, proportions).
      
      ANIMATION TASKS:
      ${actionInstructions}
      
      CRITICAL RESTRICTIONS (DO NOT IGNORE):
      1. INVISIBLE GRID ONLY: The grid layout is strictly mathematical. Do NOT draw visible grid lines, boxes, borders, or separators between sprites.
      2. SOLID BACKGROUND: The background must be one continuous color (or transparent). Do not draw ground lines, floors, or scenery.
      3. NO PROPS OR SCENERY: Do NOT draw environment objects like ladders, boxes, or background elements.
      4. PANTOMIME RULE: If the action involves an object (e.g. climbing, hitting), the character must PANTOMIME the action in thin air.
      5. NO PROJECTILES: Do NOT draw fireballs, bullets, or magic spells leaving the character's hand that would cross into other grid cells.
      6. NO CONNECTING PIXELS: Each sprite is an isolated asset. Do NOT draw horizontal bars, ropes, or lines that connect multiple frames together.
      
      ${customRules}
    `;

    console.log(`Generating ${rows}x${cols} sheet. AR: ${bestRatio}. Model: ${modelId}`);

    const imageConfig: any = { aspectRatio: bestRatio };
    if (modelId.includes('pro')) imageConfig.imageSize = "2K";

    const response = await ai.models.generateContent({
      model: modelId,
      contents: {
        parts: [
          { text: prompt },
          { inlineData: { mimeType: 'image/png', data: cleanBase64 } },
        ],
      },
      config: { imageConfig }
    });

    for (const candidate of response.candidates || []) {
        for (const part of candidate.content.parts) {
            if (part.inlineData?.data) {
                return `data:image/png;base64,${part.inlineData.data}`;
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
        const ai = getClient();
        const cleanBase64 = imageBase64.split(',')[1] || imageBase64;

        console.log(`Editing sprite sheet. Prompt: "${editPrompt}". Model: ${modelId}`);

        const response = await ai.models.generateContent({
            model: modelId,
            contents: {
                parts: [
                    { text: `Edit this sprite sheet. Maintain the exact grid structure. ${editPrompt}` },
                    { inlineData: { mimeType: 'image/png', data: cleanBase64 } }
                ]
            }
        });

        if (response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data) {
            return `data:image/png;base64,${response.candidates[0].content.parts[0].inlineData.data}`;
        }

        throw new Error("No image generated in edit response.");

    } catch (error) {
        console.error("Edit failed:", error);
        throw error;
    }
}
