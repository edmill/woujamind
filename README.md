# Woujamind

A high-performance, intuitive interface for generating sprite sheets using AI. Designed for game developers and pixel artists who need rapid prototyping tools.

## Features

- **Dual Input Modes**: Generate from text prompts or use image references
- **Action Selection**: Pre-configured animation sets (Idle, Walk, Attack, etc.)
- **Expression Support**: Add facial expressions to your sprites
- **Multiple Art Styles**: Pixel art, vector, low-poly, hand-drawn, voxel, and watercolor
- **Instant Preview**: Live preview of the generated animation loop
- **Export Options**: Download sprite sheets as PNG or animated GIFs
- **AI Studio Integration**: Works seamlessly with Google AI Studio

## Setup

### Prerequisites

- Node.js 18+
- A Gemini API key from [Google AI Studio](https://aistudio.google.com/app/apikey)

### Installation

1. Install dependencies:
```bash
npm install
```

2. Set up your API key:

   **Option A: Environment Variable (Recommended)**
   
   Create a `.env` file in the root directory:
   ```bash
   cp .env.example .env
   ```
   
   Then add your API key:
   ```
   GEMINI_API_KEY=your_api_key_here
   ```
   
   Or use Vite's standard format:
   ```
   VITE_GEMINI_API_KEY=your_api_key_here
   ```

   **Option B: AI Studio Integration**
   
   If running in Google AI Studio, the API key is managed automatically through the `window.aistudio` interface.

3. Run the development server:
```bash
npm run dev
```

## Usage

The app is a complete standalone application. Simply:

1. Enter a character description or upload a reference image
2. Select an art style
3. Choose an action and expression
4. Click "Generate" to create your sprite sheet
5. Download as PNG or GIF

## Integration with spritegen.ai

This project integrates the backend services from `spritegen.ai`:

- **Gemini Service** (`src/services/geminiService.ts`): Handles AI image generation
- **Image Utilities** (`src/utils/imageUtils.ts`): Frame extraction, alignment, and GIF creation
- **API Key Management**: Supports both environment variables and AI Studio integration

The UI provides a modern, user-friendly interface while leveraging the proven sprite generation logic from spritegen.ai.

## Dependencies

- `@google/genai` - Google Gemini AI SDK
- `gifenc` - GIF encoding for animations
- `framer-motion` - Smooth animations
- `lucide-react` - Icon library
- `tailwind-merge` & `clsx` - Utility functions
- `canvas-confetti` - Celebration effects
