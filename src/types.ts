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

// Frame selection data for sprite generation
export interface ExtractedFrameData {
  allFrames: HTMLCanvasElement[];        // All 150 frames from video
  selectedIndices: number[];              // Indices of frames selected for sprite sheet
  frameMetadata: FrameMetadata[];         // Metadata for each frame
}

export interface FrameMetadata {
  index: number;                          // Frame index (0-149)
  timestamp: number;                      // Time in video (seconds)
  qualityScore?: number;                  // Optional quality/sharpness score
  motionScore?: number;                   // Optional motion detection score
  isSelected: boolean;                    // Whether frame is currently selected
}

// ===== CREDIT SYSTEM TYPES =====

/**
 * User credit balance and statistics
 */
export interface UserCredits {
  userId: string;
  balance: number;              // Current credit balance
  balanceUSD: number;           // Balance in USD (balance / 100)
  totalPurchased: number;       // Total credits ever purchased
  totalSpent: number;           // Total credits ever spent
  lastUpdated: Date;
}

/**
 * Credit transaction record
 */
export interface CreditTransaction {
  id: string;
  userId: string;
  amount: number;               // Positive = purchase/refund, negative = spend
  transactionType: 'purchase' | 'spend' | 'refund' | 'admin_adjustment';
  referenceId?: string;         // sprite_job_id or stripe_charge_id
  description: string;
  createdAt: Date;
}

/**
 * Credit package for purchase
 */
export interface CreditPackage {
  id: string;
  credits: number;
  priceCents: number;           // Price in cents (e.g., 5000 = $50.00)
  bonusCredits: number;         // Bonus credits included
  displayName: string;          // "Starter Bundle", "Pro Bundle", etc.
  description: string;
  isActive: boolean;
  isPopular?: boolean;          // Flag for highlighting
}

/**
 * Sprite generation direction count
 */
export type DirectionCount = 1 | 4 | 8;

/**
 * Direction selection for user input (alias for DirectionCount)
 */
export type DirectionSelection = 1 | 4 | 8;

/**
 * Cost estimate for sprite generation
 */
export interface GenerationCostEstimate {
  directions: DirectionCount;
  creditsRequired: number;
  usdEquivalent: number;
  estimatedMinutes: number;
}

/**
 * Generation cost constants (in credits, 1 credit = $0.01)
 */
export const GENERATION_COSTS: Record<DirectionCount, number> = {
  1: 50,    // $0.50
  4: 150,   // $1.50
  8: 350,   // $3.50
};
