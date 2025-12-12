
import { SpriteAction, StylePreset, GridPreset } from './types';

export const SPRITE_ACTIONS: SpriteAction[] = [
  { id: 'idle', label: 'Idle / Breathing', prompt: 'idle stance, facing right, subtle breathing motion, eyes blinking, slight bobbing' },
  { id: 'walk', label: 'Walk Cycle', prompt: 'smooth walking cycle, facing right, side view, legs crossing, arms swinging naturally' },
  { id: 'run', label: 'Run Cycle', prompt: 'fast running cycle, facing right, dynamic forward lean, clean movement lines, aggressive gait' },
  { id: 'jump', label: 'Jump', prompt: 'jump sequence, facing right: anticipation, launch, mid-air tuck, landing' },
  { id: 'attack', label: 'Attack / Slash', prompt: 'combat attack sequence, facing right, striking thin air (pantomime), wind up, strike, follow through, no enemies, no blood' },
  { id: 'climb', label: 'Climb Ladder', prompt: 'climbing motion, back view or side view, upward movement, using hands and feet to climb air (pantomime), do not draw ladder' },
  { id: 'cast', label: 'Cast Spell', prompt: 'magic casting animation, facing right, gathering energy in hands (pantomime), no projectiles leaving the frame' },
  { id: 'hit', label: 'Take Damage', prompt: 'impact reaction, facing right, recoiling from invisible force, flashing white, recovery' },
  { id: 'die', label: 'Death', prompt: 'falling to knees, facing right, collapsing forward onto invisible floor, laying still' },
];

export const STYLE_PRESETS: StylePreset[] = [
  { 
    id: 'snes', 
    label: '16-Bit SNES (Pixel Art)', 
    prompt: 'Pixel Art Style, 16-bit Super Nintendo aesthetic, sharp hard edges, limited color palette, no anti-aliasing, retro gaming feel.' 
  },
  { 
    id: 'gb', 
    label: 'Gameboy (Green/Gray)', 
    prompt: 'Gameboy Retro Style, 4-color green scale palette, 8-bit pixel art, very low resolution feel, nostalgic.' 
  },
  { 
    id: 'modern_pixel', 
    label: 'Modern HD Pixel (Stardew/Terraria)', 
    prompt: 'Modern High-Bit Pixel Art, detailed shading, vibrant colors, "Stardew Valley" or "Terraria" aesthetic, clean outlines.' 
  },
  { 
    id: 'vector', 
    label: 'Flash / Vector (Clean Lines)', 
    prompt: 'Vector Art Style, thick clean outlines, cel-shaded flat colors, "Castle Crashers" or "Scribblenauts" aesthetic, smooth curves.' 
  },
  { 
    id: 'fighting', 
    label: '90s Arcade Fighter (Capcom/SNK)', 
    prompt: '90s Arcade Fighting Game Style, detailed musculature, dramatic lighting, "Street Fighter III" or "King of Fighters" sprite aesthetic.' 
  },
  { 
    id: 'rpg_maker', 
    label: 'RPG Maker (Chibi/Top-Down)', 
    prompt: 'RPG Maker Style, Chibi proportions, large head small body, 3/4 top-down perspective, cute aesthetic.' 
  }
];

export const GRID_PRESETS: GridPreset[] = [
    { id: '2x2', label: '2x2 (4 Frames - Simple Loop)', rows: 2, cols: 2 },
    { id: '2x3', label: '2x3 (6 Frames - Standard)', rows: 2, cols: 3 },
    { id: '2x4', label: '2x4 (8 Frames - Walk Cycle)', rows: 2, cols: 4 },
    { id: '3x3', label: '3x3 (9 Frames - Box)', rows: 3, cols: 3 },
    { id: '3x4', label: '3x4 (12 Frames - Fluid)', rows: 3, cols: 4 },
    { id: '4x4', label: '4x4 (16 Frames - Complex)', rows: 4, cols: 4 },
];

export const DEFAULT_GRID_ROWS = 2;
export const DEFAULT_GRID_COLS = 4;
