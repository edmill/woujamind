# Parallax Background Image Generation Guide

## Overview
To create a true parallax scrolling effect, you need to generate **4 separate background images**, each representing a different depth layer. These layers will move at different speeds to create a sense of depth and movement.

## Image Specifications

### Dimensions
- **Recommended**: `2400px × 1350px` (best for seamless scrolling and high quality)
- **Minimum**: `1920px × 1080px` (Full HD, good quality)
- **Format**: **PNG with transparency** (REQUIRED for parallax effect)
- **Aspect Ratio**: 16:9 (must be consistent across all 4 layers)
- **Important**: All 4 images must have the EXACT same dimensions

### ⚠️ CRITICAL: Transparency Requirements

**For the parallax effect to work, your images MUST have transparency:**

1. **Sky Layer**: Can be fully opaque (it's the background)
2. **Mountains Layer**: Must have **transparent areas** in the sky portion (top 40-50%) so the sky layer shows through
3. **Midground Layer**: Must have **transparent areas** in the sky and mountains portions so previous layers show through
4. **Foreground Layer**: Must have **transparent areas** everywhere EXCEPT the foreground elements (ground, close trees, etc.) so all previous layers show through

**Without transparency, layers will cover each other and you won't see the parallax effect!**

### Layer Breakdown

Generate these 4 images in this exact order:

#### 1. **Sky Layer** (Farthest Back)
- **Speed**: 0.05x (moves barely)
- **Content**: Sky, clouds, distant atmospheric elements
- **Transparency**: Can be fully opaque (it's the background)
- **Prompt Example**: 
  ```
  A clear winter sky with sparse white clouds, light blue gradient background, 
  no ground elements, top portion of winter landscape scene, 16:9 aspect ratio, 
  2400x1350 pixels, PNG format, cartoon style, pixel art style, high resolution
  ```

#### 2. **Mountains Layer** (Distant Background)
- **Speed**: 0.3x (moves slowly)
- **Content**: Snow-capped mountains, distant peaks
- **Transparency**: **MUST have transparent sky area** (top 40-50% should be transparent so sky shows through)
- **Prompt Example**:
  ```
  Snow-capped mountains in the distance, winter landscape, middle-background elements, 
  no foreground details, transparent sky area at top, 16:9 aspect ratio, 2400x1350 pixels, 
  PNG format with transparency, cartoon style, pixel art style, matches the sky layer above, high resolution
  ```

#### 3. **Midground Layer** (Middle Distance)
- **Speed**: 0.6x (moves at medium speed)
- **Content**: Trees, river, midground elements
- **Transparency**: **MUST have transparent areas** in sky and mountains portions (top 60-70% should be transparent)
- **Prompt Example**:
  ```
  Winter landscape midground with stylized trees, winding blue river, 
  snow-dusted elements, no close-up details, transparent sky and mountains areas, 
  16:9 aspect ratio, 2400x1350 pixels, PNG format with transparency, 
  cartoon style, pixel art style, matches previous layers, high resolution
  ```

#### 4. **Foreground Layer** (Closest)
- **Speed**: 1.0x (moves fastest)
- **Content**: Ground surface, foreground trees, path, snow banks
- **Transparency**: **MUST have transparent areas** everywhere EXCEPT foreground elements (only ground, close trees, and foreground details should be opaque)
- **Prompt Example**:
  ```
  Winter landscape foreground with snowy ground surface, foreground tree trunks, 
  winding blue path, snow banks, ground level details, transparent background everywhere except foreground elements, 
  16:9 aspect ratio, 2400x1350 pixels, PNG format with transparency, 
  cartoon style, pixel art style, matches previous layers, high resolution,
  character will be placed on this ground surface
  ```

## Important Requirements

### Alignment
- All 4 images must be **perfectly aligned** horizontally
- The ground surface in the **foreground layer** should be at the **bottom 30-40%** of the image
- Elements should align vertically across layers (e.g., a mountain peak should be in the same X position across layers)

### Seamless Scrolling
- For infinite scrolling, make images **wider than the viewport** (2400px+ recommended)
- Or design them to **tile seamlessly** (left edge matches right edge)

### Character Placement
- The **foreground layer** should have a clear **ground surface** at the bottom
- The character will be positioned at approximately **10-15% from the bottom** of the container
- Ensure the ground surface is visible and well-defined in the foreground layer

### Style Consistency
- All 4 images must use the **same art style**
- Colors should be consistent across layers
- Lighting direction should match
- Use the same character/theme from your sprite animation

## Upload Instructions

1. Click the **LayoutList icon button** (next to the background image button)
2. Select all **4 images at once** (use Cmd/Ctrl+Click to select multiple)
3. **Order matters**: Select in this order:
   - Sky (1st)
   - Mountains (2nd)
   - Midground (3rd)
   - Foreground (4th)
4. The system will automatically assign them to the correct layers

## Alternative: Single Background Image

If you only upload a single background image (using the FileImage button), it will scroll smoothly but won't have the parallax depth effect. This is useful for testing or simpler backgrounds.

## Tips for Best Results

1. **Generate all 4 images in one session** to ensure style consistency
2. **Use the same prompt base** and modify only the layer-specific elements
3. **Test alignment** - elements should line up vertically across layers
4. **Ground surface is critical** - make sure the foreground layer has a clear ground line
5. **Wider images = smoother scrolling** - 2400px+ width recommended for seamless loops

## Example Full Prompt Structure

```
Base prompt: "Winter landscape, cartoon style, pixel art, 16:9 aspect ratio, 2400x1350 pixels, high resolution"

Layer 1 (Sky): [Base] + "top portion only, sky and clouds, no ground, atmospheric background"
Layer 2 (Mountains): [Base] + "distant snow-capped mountains, middle-background, no foreground"
Layer 3 (Midground): [Base] + "trees and river, midground elements, no close details"
Layer 4 (Foreground): [Base] + "ground surface, snow banks, foreground details, ground at bottom 30-40%"
```

## Key Phrases to Include for Larger Images

Add these to your prompts to ensure larger dimensions:
- `"2400x1350 pixels"` or `"1920x1080 pixels"` (be explicit about dimensions)
- `"high resolution"` or `"high quality"`
- `"detailed"` or `"detailed pixel art"`
- `"full width landscape"` or `"wide format"`

## Common AI Model Tips

**For Gemini/Claude/OpenAI:**
- Explicitly state: `"Generate at 2400 pixels wide by 1350 pixels tall"`
- Add: `"Output resolution: 2400x1350"`
- Include: `"Maximum quality, high resolution output"`

**For Stable Diffusion/Midjourney:**
- Use `--ar 16:9` or `--aspect 16:9`
- Add `--quality 2` or `--v 6` for higher resolution
- Specify: `"2400x1350, 8k, ultra detailed"`
