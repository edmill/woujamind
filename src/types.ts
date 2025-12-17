/**
 * Type definitions for Woujamind
 */
import React from 'react';

export type TabMode = 'action' | 'expression';
export type ActionType = 'idle' | 'walk' | 'run' | 'jump' | 'attack' | 'cast';
export type ExpressionType = 'neutral' | 'happy' | 'angry' | 'surprised' | 'pain';
export type Theme = 'dark' | 'light';
export type ArtStyle = 'pixel' | 'low-poly' | 'vector' | 'hand-drawn' | 'voxel' | 'watercolor' | 'inherited';
export type AlignmentMode = 'auto' | 'bottom' | 'center';

export interface ActionOption {
  id: ActionType;
  label: string;
  icon: React.ReactNode;
  frames: number;
}

export interface ExpressionOption {
  id: ExpressionType;
  label: string;
  icon: React.ReactNode;
}

export interface ArtStyleOption {
  id: ArtStyle;
  label: string;
  description: string;
  previewColor: string;
}

export interface AlignmentModeOption {
  id: AlignmentMode;
  label: string;
  description: string;
  icon: string;
}
