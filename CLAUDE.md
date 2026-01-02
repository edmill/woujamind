# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Woujamind is an AI-powered sprite sheet generator for game developers and pixel artists. It uses Google's Gemini API and Replicate's Seedance model to generate sprite animations from text prompts or reference images. The app is a single-page React application built with Vite and TypeScript.

## Development Commands

```bash
# Install dependencies
npm install

# Start development server (runs on http://localhost:5173 by default)
npm run dev

# Build for production (TypeScript compilation + Vite build)
npm run build

# Preview production build
npm preview
```

## API Key Configuration

The application requires two API keys, stored either in `.env` or in browser localStorage via the Settings modal:

1. **Gemini API Key** (required for all generation):
   - Get from: https://aistudio.google.com/app/apikey
   - Environment variable: `GEMINI_API_KEY` or `VITE_GEMINI_API_KEY`
   - LocalStorage key: `woujamind_api_key`

2. **Replicate API Key** (optional, for video-based generation):
   - Get from: https://replicate.com/account/api-tokens
   - Environment variable: `VITE_REPLICATE_API_KEY`
   - LocalStorage key: `woujamind_replicate_api_key`

The app checks for keys in this order: localStorage → environment variables → AI Studio integration (window.aistudio).

## Architecture Overview

### State Management

The main application state is managed in `Component.tsx` (the `Woujamind` component). This is a large, monolithic React component that orchestrates all UI and generation logic. State includes:

- Generation inputs (prompt, file, action, expression, art style, direction)
- Generation state (isGenerating, result, generatedImage, statusText)
- Editing state (isEditing, history, selectedFrameIndices)
- API key management
- Modal visibility flags
- Animation settings (fps, isTransparent, hasDropShadow)

### Core Services

**geminiService.ts** - Primary AI service using Google Gemini
- `analyzeCharacter()` - Stage 1: Extracts character description and style parameters from reference image
- `analyzeStyleParameters()` - Detailed style analysis (line weight, shading, colors, textures)
- `detectMultiViewCharacter()` - Detects if reference image contains multiple character views
- `generateSpriteSheet()` - Stage 2: Generates sprite sheet using extracted character description and style
- `editSpriteSheet()` - Applies edits to existing sprite sheets
- `generateInBetweenFrame()` - Creates interpolated frames between existing frames

**replicateService.ts** - Video-based generation using Replicate's Seedance model
- `generateSpriteSheetFromImage()` - Generates animated sprite video from reference image + prompt
- `calculateGridDimensions()` - Calculates grid layout based on frame count
- Video is processed into individual frames using `extractFrames()` from videoProcessing.ts

### Image Processing Pipeline

Image utilities are organized into focused modules (all re-exported from `imageUtils.ts`):

**imageHelpers.ts**
- `getVisualBoundingBox()` - Detects actual content area (non-transparent/non-background pixels)
- `getBackgroundColor()` - Samples edge pixels to determine background color
- `loadImage()` - Async image loading helper
- `processRemoveBackground()` - Background removal with transparency detection

**frameExtraction.ts**
- `extractFrames()` - Extracts individual frames from sprite sheet grid
- `createGifBlob()` - Creates animated GIF from frame array using gifenc library

**frameManipulation.ts**
- `cropFrame()` - Crops a single frame from sprite sheet
- `pasteFrame()` - Pastes a frame back into sprite sheet at specific position
- `insertFrame()` - Inserts new frame at index, shifting subsequent frames
- `removeFrame()` - Deletes frame and reflows grid
- `replaceFrameWithImage()` - Swaps frame with uploaded image

**spriteAlignment.ts**
- `cleanSpriteSheet()` - Removes background and ensures transparency
- `alignFrameInSheet()` - Aligns single frame within its grid cell
- `alignWholeSheet()` - Aligns all frames using visual bounding boxes
- `aiSmartAlignSpriteSheet()` - Uses Gemini to intelligently align frames based on anchor points (feet for grounded, head for flying, center for floating)

**videoProcessing.ts**
- `extractFrames()` - Extracts frames from video blob (for Replicate video output)

**gridDetection.ts**
- Auto-detects grid layout from uploaded sprite sheets
- Used by SpriteSheetUploadModal

### Data Persistence

**spriteStorage.ts** - IndexedDB wrapper for local sprite sheet storage
- Database: `woujamind_sprites` (version 1)
- Store: `sprite_sheets`
- Interface: `StoredSpriteSheet` with metadata (prompt, action, art style, fps, grid dimensions, history for undo/redo)
- `initDB()`, `saveSpriteSheet()`, `getSpriteSheetsByDate()`, `deleteSpriteSheet()`

**localStorageMigration.ts**
- Migrates old localStorage-based storage to IndexedDB

### Component Structure

**Component.tsx** - Main orchestrator component (1500+ lines)
- Manages all state and generation logic
- Coordinates between services and UI components
- Handles generation workflow, editing, undo/redo, save/load

**Key UI Components:**
- `InputSidebar.tsx` - Left sidebar with prompt input, action/expression/style selection
- `ResultView.tsx` - Main result display with frame grid, animation preview, editing tools
- `SettingsModal.tsx` - API key management, custom rules, generation settings
- `SpriteSheetUploadModal.tsx` - Upload existing sprite sheets with grid detection
- `FileLibraryView.tsx` - Browse saved sprite sheets (grid/list view)
- `GeneratingOverlay.tsx` - Loading state with status text

**Helper Components:**
- `AnimatedLogo.tsx`, `BackgroundParticles.tsx` - Visual polish
- `BlobPreview.tsx`, `CompactAnimationPreview.tsx` - Animation previews
- `PromptHelper.tsx`, `PromptEnhancer.tsx` - Prompt assistance UI

### Type System

**types.ts** defines core types:
- `ActionType` - Animation actions (idle, walk, run, jump, attack, cast)
- `ExpressionType` - Facial expressions (neutral, happy, angry, surprised, pain)
- `ArtStyle` - Visual styles (pixel, low-poly, vector, hand-drawn, voxel, watercolor, inherited)
- `SpriteDirection` - 8-directional sprite views
- `StyleParameters` - Detailed style analysis result (line weight, shading, colors, textures)
- `CharacterAnalysis` - Complete analysis result including multi-view detection
- `MultiViewData` - Multi-view sprite sheet detection result

### Generation Workflow

**Text Prompt Flow:**
1. User enters description + selects action/expression/style
2. `generateSpriteSheet()` in geminiService.ts creates sprite sheet directly
3. Result displayed in ResultView

**Reference Image Flow:**
1. User uploads reference image
2. `analyzeCharacter()` extracts character description + style parameters + multi-view detection
3. `generateSpriteSheet()` or `generateSpriteSheetFromImage()` (Replicate) creates animation using analyzed data
4. For Replicate: video → frames extracted → assembled into sprite sheet grid
5. Result displayed in ResultView with editing capabilities

**Key Design Patterns:**
- All image processing uses HTML Canvas API
- Frame data stored as base64 data URLs
- Grid-based layout (rows × columns calculated from frame count)
- Undo/redo via history array of base64 images
- Background removal samples edge pixels to detect background color

## Important Implementation Notes

### Image Processing
- Frame extraction assumes grid layout with equal-sized cells
- Visual bounding box detection is used for alignment (non-transparent pixels)
- Background removal supports both solid colors and alpha transparency
- Drop shadow rendering uses multiple layered shadows for depth

### AI Generation
- Gemini prompts are highly detailed to ensure consistent sprite output
- Style parameters are extracted from reference images and embedded in generation prompts
- Multi-view detection prevents generating duplicate views when reference already contains them
- Custom rules from Settings are appended to all generation prompts

### State Persistence
- Current sprite sheet persists across browser refreshes via IndexedDB
- Full generation metadata stored for each sprite (prompt, action, model, etc.)
- History array enables undo/redo, stored with each sprite
- localStorage used only for API keys and migration marker

### Vite Configuration
- Environment variables must use `VITE_` prefix to be exposed to client code
- Exception: `GEMINI_API_KEY` is explicitly mapped in vite.config.ts for backward compatibility
- API keys are injected as `process.env.API_KEY` and `process.env.GEMINI_API_KEY`
