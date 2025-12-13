# Sprite Magic Generator

A high-performance, intuitive interface for generating sprite sheets using AI. Designed for game developers and pixel artists who need rapid prototyping tools.

## Features

- **Dual Input Modes**: Generate from text prompts or use image references
- **Action Selection**: Pre-configured animation sets (Idle, Walk, Attack, etc.)
- **Instant Preview**: Live preview of the generated animation loop
- **Export Options**: Download generated sprite sheets

## Usage

```tsx
import SpriteMagic from '@/sd-components/246b0315-9aa0-49d7-be62-97c24bbdd8e8';

function MyGameDevTool() {
  return (
    <div className="p-8">
      <SpriteMagic />
    </div>
  );
}
```

## Props

The component is currently self-contained and manages its own internal state for the demo. Future versions will expose:

| Prop | Type | Description |
|------|------|-------------|
| `onGenerate` | `(data: any) => void` | Callback when sprite is generated |
| `initialMode` | `'prompt' \| 'upload'` | Default input mode |

## Dependencies

- framer-motion
- lucide-react
- tailwind-merge
- clsx
