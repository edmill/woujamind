/**
 * Constants and Configuration
 */
import React from 'react';
import { ActionOption, ExpressionOption, ArtStyleOption, AlignmentModeOption } from './types';
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

export const SUGGESTED_PROMPTS = [
  {
    category: 'Fantasy Heroes',
    prompts: [
      'A heroic knight character, front-facing view, silver plate armor with gold trim, crimson cape flowing behind, sword and shield visible, clean sprite art style, sharp details, high contrast lighting, game-ready asset',
      'An elven archer character, front-facing pose, forest green tunic with leather accents, long platinum blonde hair, ornate bow held at side, mystical aura particles, detailed facial features, professional game sprite quality',
      'A dragon-humanoid warrior, front view, iridescent scaled armor in deep purple and gold, draconic wings folded on back, glowing amber eyes, medieval fantasy style, clear silhouette for animation',
      'A powerful mage character, front-facing stance, flowing midnight blue robes with constellation patterns, glowing staff with crystal orb, pointed wizard hat, magical energy swirls, vibrant colors, sprite-optimized design',
      'A fairy companion character, front view, delicate translucent butterfly wings with shimmer effects, flower petal dress in pastel pink, sparkling dust trail, expressive large eyes, whimsical fantasy style'
    ]
  },
  {
    category: 'Sci-Fi Characters',
    prompts: [
      'A space marine soldier, front-facing pose, advanced powered armor in matte black with neon blue accents, helmet with glowing HUD visor, pulse rifle at ready position, military sci-fi aesthetic, hard edges for sprite animation',
      'A cyberpunk netrunner, front view, asymmetric tech wear with holographic interfaces, neon pink and cyan circuitry tattoos, augmented reality glasses, data cables on arms, urban futuristic style, high detail sprite',
      'An android character, front-facing stance, sleek white chassis with exposed mechanical joints, glowing blue circuit patterns, humanoid proportions, polished metallic finish, clean sci-fi design, animation-ready',
      'A mech pilot in exosuit, front view, industrial grey armor with orange hazard stripes, mechanical enhancement ports, transparent helmet showing face, utility belts with tools, detailed hard-surface design',
      'An alien species character, front-facing design, bioluminescent teal skin patterns, crystalline protrusions on shoulders, four-fingered hands, unique head crest, otherworldly yet approachable, sprite-friendly silhouette'
    ]
  },
  {
    category: 'Creatures & Companions',
    prompts: [
      'A white fluffy dog companion, front-facing pose, cotton-ball fur texture, shiny black button eyes, pink tongue out, happy expression, simple clean shapes, vibrant colors, perfect for sprite animation cycles',
      'A majestic lion character, front view, golden mane with detailed fur strands, amber eyes with intense gaze, muscular build, regal posture, warm color palette, high contrast for readability, game-ready design',
      'An orange tabby cat character, front-facing stance, striped pattern clearly defined, large emerald green eyes, playful sitting pose, soft rounded shapes, appealing expression, sprite-optimized features',
      'A wise owl character, front view, brown and cream feathers with pattern detail, large round glasses, small graduation cap, perched pose with visible talons, scholarly accessories, charming personality design',
      'A friendly bear cub, front-facing position, soft brown fur with lighter belly, holding honey pot with both paws, cute round face, expressive eyes, warm inviting colors, animation-friendly proportions'
    ]
  },
  {
    category: 'Cute & Stylized',
    prompts: [
      'A mushroom character, front view, red cap with white polka dots, cream-colored stem body, tiny arms and legs, big kawaii eyes with sparkles, rosy cheeks, chibi proportions, vibrant saturated colors, sprite-perfect design',
      'A penguin character, front-facing pose, black and white plumage, wearing cozy red scarf and knit winter hat with pompom, flippers at sides, waddle-ready stance, cheerful expression, clear simple shapes',
      'A slime creature character, front view, translucent teal gelatinous body with shimmer highlights, large sparkling anime eyes, simple rounded blob shape, internal bubbles visible, glossy finish, easy-to-animate form',
      'A tiny robot character, front-facing stance, rounded retro-futuristic design in pastel blue, heart-shaped glowing eyes, antenna with blinking light, segmented limbs, cute proportions, friendly mechanical aesthetic',
      'A cloud spirit character, front view, fluffy cumulus form in soft white, rainbow gradient flowing from bottom, cute smiling face, small arms emerging from sides, whimsical magical aura, sprite-friendly silhouette'
    ]
  },
  {
    category: 'Warriors & Fighters',
    prompts: [
      'A samurai warrior, front-facing combat stance, black lacquered armor with red cord detailing, traditional kabuto helmet, dual katanas in defensive position, family mon crest visible, sharp angular design, dynamic pose ready for animation',
      'A viking berserker, front view, fur-trimmed leather armor with chain mail, horned helmet with battle damage, massive double-bladed axe over shoulder, braided beard with war paint, intimidating yet heroic proportions',
      'A shinobi assassin, front-facing crouch position, midnight black gi with utility wraps, traditional mask covering lower face, kunai and shuriken visible on belt, stealthy athletic build, shadow-ready color palette',
      'A roman gladiator, front stance, bronze muscled armor with leather straps, iconic helmet with red plume, large rectangular shield and trident weapon combo, battle-scarred warrior aesthetic, historical accuracy',
      'A tribal barbarian, front-facing warrior pose, minimal leather armor showing muscular build, ceremonial war paint in bold patterns, oversized claymore sword, fur pelts and bone accessories, primal fierce energy'
    ]
  }
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

export const ALIGNMENT_MODES: AlignmentModeOption[] = [
  {
    id: 'auto',
    label: 'Auto',
    description: 'Smart alignment - centers tall sprites with effects, bottom-aligns normal sprites',
    icon: '✨'
  },
  {
    id: 'bottom',
    label: 'Bottom',
    description: 'Bottom alignment - sprites stand on baseline (best for walk/run)',
    icon: '⬇️'
  },
  {
    id: 'center',
    label: 'Center',
    description: 'Center alignment - sprites centered in frame (best for flying/floating)',
    icon: '◯'
  }
];
