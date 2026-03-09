# Woujamind

AI-powered sprite sheet generator for game developers and pixel artists. Generate sprite animations from text prompts or reference images using Google Gemini and Replicate's Seedance model.

## Quick start

```bash
npm install
npm run dev
```

Open http://localhost:5173

## API keys

Add your keys in the app via **Settings** (top right), or use `.env`:

- **Gemini** (required): get from [Google AI Studio](https://aistudio.google.com/app/apikey). Use `VITE_GEMINI_API_KEY` in `.env`.
- **Replicate** (optional, for video-based generation): get from [Replicate](https://replicate.com/account/api-tokens). Use `VITE_REPLICATE_API_KEY` in `.env`.

## Scripts

| Command       | Description              |
|---------------|--------------------------|
| `npm run dev` | Start dev server         |
| `npm run build` | Production build       |
| `npm run preview` | Preview production build |

## Tech

- React, TypeScript, Vite
- Gemini (character analysis + image generation)
- Replicate Seedance (video → sprite frames)
