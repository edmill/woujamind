/**
 * Type definitions for Woujamind
 */
import React from 'react';

export type TabMode = 'action' | 'expression';
export type ActionType = 'idle' | 'walk' | 'run' | 'jump' | 'attack' | 'cast';
export type ExpressionType = 'neutral' | 'happy' | 'angry' | 'surprised' | 'pain';
export type Theme = 'dark' | 'light';
export type ArtStyle = 'pixel' | 'low-poly' | 'vector' | 'hand-drawn' | 'voxel' | 'watercolor' | 'inherited';

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

// Direction types for sprite generation
export type SpriteDirection = 'front' | 'back' | 'left' | 'right' |
  'front-left' | 'front-right' | 'back-left' | 'back-right';

// Detailed style parameters extracted from reference images
export interface StyleParameters {
  // Line & Edge Properties
  lineWeight: 'ultra-thin' | 'thin' | 'medium' | 'thick' | 'heavy' | 'variable';
  lineStyle: 'clean' | 'sketchy' | 'pixel-perfect' | 'organic' | 'geometric';
  edgeQuality: 'crisp' | 'soft' | 'anti-aliased' | 'pixelated' | 'feathered';

  // Shading & Rendering
  shadingTechnique: 'flat' | 'cel-shaded' | 'gradient' | 'dithered' | 'hatched' | 'soft-shaded';
  lightingModel: 'ambient' | 'directional' | 'rim-lit' | 'dramatic' | 'soft';
  contrastLevel: 'low' | 'medium' | 'high' | 'very-high';

  // Color Properties
  colorPalette: {
    primaryColors: string[]; // Hex colors extracted
    colorCount: number;
    saturation: 'desaturated' | 'moderate' | 'saturated' | 'vibrant';
    temperature: 'cool' | 'neutral' | 'warm';
  };

  // Texture & Detail
  textureLevel: 'minimal' | 'moderate' | 'detailed' | 'highly-detailed';
  detailDensity: 'simple' | 'moderate' | 'complex';
  surfaceFinish: 'matte' | 'glossy' | 'metallic' | 'mixed';

  // Overall Style Classification
  artStyleCategory: 'pixel' | 'low-poly' | 'vector' | 'hand-drawn' | 'voxel' | 'watercolor' | 'mixed' | 'custom';
  technicalNotes: string[]; // Specific observations
}

// Multi-view detection result
export interface MultiViewData {
  viewCount: number;
  detectedViews: {
    direction: SpriteDirection;
    description: string;
    position: string; // 'left', 'center', etc.
    confidence: number;
  }[];
  layoutType: 'horizontal' | 'vertical' | 'grid' | 'irregular';
  recommendations: string[];
}

// Extended analysis result
export interface CharacterAnalysis {
  characterDescription: string;
  styleParameters: StyleParameters;
  isMultiView: boolean;
  viewData?: MultiViewData;
}
