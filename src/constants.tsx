/**
 * Constants and Configuration
 */
import React from 'react';
import { ActionOption, ExpressionOption, ArtStyleOption } from './types';
import { 
  IdleIcon, 
  WalkIcon, 
  RunIcon, 
  JumpIcon, 
  AttackIcon, 
  CastIcon,
  NeutralIcon,
  HappyIcon,
  AngryIcon,
  ShockIcon,
  PainIcon
} from './components/AnimatedIcons';

export const ACTIONS: ActionOption[] = [
  { id: 'idle', label: 'Idle', icon: <IdleIcon className="w-5 h-5" />, frames: 4 },
  { id: 'walk', label: 'Walk', icon: <WalkIcon className="w-5 h-5" />, frames: 6 },
  { id: 'run', label: 'Run', icon: <RunIcon className="w-5 h-5" />, frames: 8 },
  { id: 'jump', label: 'Jump', icon: <JumpIcon className="w-5 h-5" />, frames: 5 },
  { id: 'attack', label: 'Attack', icon: <AttackIcon className="w-5 h-5" />, frames: 6 },
  { id: 'cast', label: 'Cast', icon: <CastIcon className="w-5 h-5" />, frames: 7 },
];

export const EXPRESSIONS: ExpressionOption[] = [
  { id: 'neutral', label: 'Neutral', icon: <NeutralIcon className="w-5 h-5" /> },
  { id: 'happy', label: 'Happy', icon: <HappyIcon className="w-5 h-5" /> },
  { id: 'angry', label: 'Angry', icon: <AngryIcon className="w-5 h-5" /> },
  { id: 'surprised', label: 'Shock', icon: <ShockIcon className="w-5 h-5" /> },
  { id: 'pain', label: 'Pain', icon: <PainIcon className="w-5 h-5" /> },
];

export const ART_STYLES: ArtStyleOption[] = [
  { 
    id: 'pixel', 
    label: 'Pixel Art', 
    description: 'Retro 8-bit/16-bit style with crisp edges',
    previewColor: 'from-purple-500 to-pink-500'
  },
  { 
    id: 'low-poly', 
    label: 'Low Poly', 
    description: 'Geometric shapes with flat shading',
    previewColor: 'from-emerald-400 to-cyan-500'
  },
  { 
    id: 'vector', 
    label: 'Vector', 
    description: 'Clean lines and solid colors',
    previewColor: 'from-orange-400 to-amber-500'
  },
  { 
    id: 'hand-drawn', 
    label: 'Hand Drawn', 
    description: 'Sketchy lines and organic textures',
    previewColor: 'from-slate-600 to-slate-400'
  },
  { 
    id: 'voxel', 
    label: 'Voxel', 
    description: '3D pixel cubes (Minecraft style)',
    previewColor: 'from-blue-500 to-indigo-500'
  },
  { 
    id: 'watercolor', 
    label: 'Watercolor', 
    description: 'Soft edges and blending colors',
    previewColor: 'from-teal-300 to-blue-300'
  }
];
