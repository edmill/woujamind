
export interface SpriteAction {
  id: string;
  label: string;
  prompt: string;
}

export interface GridConfig {
  rows: number;
  cols: number;
  activeFrames: number; // How many frames to actually use (e.g. 8 frames in a 3x3 grid)
}

export interface GridPreset {
    id: string;
    label: string;
    rows: number;
    cols: number;
}

export interface GenerationState {
  isLoading: boolean;
  error: string | null;
  generatedImageBase64: string | null;
}

export type ThemeColor = 'transparent' | '#1e293b' | '#0f172a' | '#ffffff';

export interface StylePreset {
  id: string;
  label: string;
  prompt: string;
}

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
