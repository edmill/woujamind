# Variable Frame Detection Script

A Python script to automatically detect individual sprite frames in sprite sheets where frames may have varying sizes and orientations. Uses traditional computer vision techniques (no AI required).

## Features

- **Variable Frame Sizes**: Detects frames of different sizes (not just uniform grids)
- **Multiple Detection Methods**:
  - Grid line detection (for sprite sheets with visible borders)
  - Content-based segmentation (for sprite sheets without clear grid lines)
- **Background Detection**: Automatically identifies background color
- **Fast & Consistent**: Pure computer vision algorithms, no AI/ML dependencies
- **Visualization**: Optional output with bounding boxes drawn
- **JSON Export**: Export frame coordinates and dimensions for integration

## Installation

```bash
# Install required packages
pip install -r scripts/requirements.txt

# Or install manually:
pip install pillow numpy scipy
```

**Note**: `scipy` is optional but recommended for better performance. The script will work without it using a fallback implementation.

## Usage

### Basic Usage

```bash
python scripts/detect_variable_frames.py sprite_sheet.png
```

### Save Results as JSON

```bash
python scripts/detect_variable_frames.py sprite_sheet.png --output-json frames.json
```

### Generate Visualization

```bash
python scripts/detect_variable_frames.py sprite_sheet.png --output-visual visualization.png
```

### Customize Detection Parameters

```bash
python scripts/detect_variable_frames.py sprite_sheet.png \
  --min-size 16 \
  --background-threshold 40 \
  --padding 4 \
  --output-json frames.json \
  --output-visual vis.png
```

## Parameters

- `--min-size <pixels>`: Minimum frame size to detect (default: 8)
  - Filters out noise and tiny artifacts
  - Increase for cleaner results on high-resolution sheets

- `--background-threshold <value>`: Color difference threshold (default: 30)
  - Lower values = stricter background detection
  - Higher values = more tolerant of color variations
  - Range: 0-255

- `--padding <pixels>`: Padding around detected sprites (default: 2)
  - Adds extra space around each detected frame
  - Useful for sprites that touch edges

## Output Format

### Console Output

The script prints:
- Detection method used
- Image dimensions
- Background color detected
- List of all frames with positions, sizes, and confidence scores

### JSON Output

```json
{
  "image_width": 512,
  "image_height": 256,
  "background_color": [255, 255, 255, 255],
  "method": "content_segmentation",
  "frames": [
    {
      "x": 10,
      "y": 5,
      "width": 48,
      "height": 64,
      "index": 0,
      "confidence": 1.0
    },
    ...
  ]
}
```

### Visualization Output

Saves an image with:
- Colored bounding boxes around each detected frame
- Frame indices labeled on each box
- Original sprite sheet preserved

## How It Works

### Method 1: Grid Line Detection
1. Converts image to grayscale
2. Scans for vertical and horizontal edge lines
3. Creates frames from detected grid intersections
4. **Best for**: Sprite sheets with visible borders/grid lines

### Method 2: Content Segmentation
1. Samples background color from image edges/corners
2. Creates binary mask (content vs background)
3. Finds connected components (individual sprites)
4. Calculates bounding boxes for each component
5. **Best for**: Sprite sheets without clear grid lines, variable-sized sprites

## Integration with Woujamind

The JSON output can be integrated into the Woujamind application:

1. Run the script on uploaded sprite sheets
2. Parse the JSON to get frame coordinates
3. Use frame data to extract individual sprites
4. Update the `extractFrames` function to support variable-sized frames

Example integration:

```typescript
// Load frame data from JSON
const frameData = await fetch('/frames.json').then(r => r.json());

// Extract frames using detected coordinates
frameData.frames.forEach((frame: Frame) => {
  const canvas = document.createElement('canvas');
  canvas.width = frame.width;
  canvas.height = frame.height;
  const ctx = canvas.getContext('2d');
  
  ctx.drawImage(
    spriteSheetImage,
    frame.x, frame.y, frame.width, frame.height,
    0, 0, frame.width, frame.height
  );
  
  frames.push(canvas);
});
```

## Performance

- **Small sprite sheets** (< 1000x1000px): < 1 second
- **Medium sprite sheets** (1000-2000px): 1-3 seconds
- **Large sprite sheets** (> 2000px): 3-10 seconds

Performance depends on:
- Image size
- Number of sprites
- Whether scipy is installed (faster with scipy)

## Limitations

- Works best with sprite sheets that have:
  - Clear background color (solid or transparent)
  - Sprites that don't overlap
  - Reasonable spacing between sprites
  
- May struggle with:
  - Very complex backgrounds
  - Overlapping sprites
  - Sprites that blend into background
  - Extremely large images (> 5000px)

## Troubleshooting

**Too many small frames detected:**
- Increase `--min-size` parameter
- Increase `--background-threshold` to better detect background

**Missing frames:**
- Decrease `--min-size` parameter
- Decrease `--background-threshold` to be more sensitive
- Check if sprites are touching/overlapping

**Incorrect frame boundaries:**
- Adjust `--padding` to add/remove space around frames
- Try different `--background-threshold` values
- Check if sprite sheet has clear background

## Examples

### Example 1: Standard Sprite Sheet
```bash
python scripts/detect_variable_frames.py character_sprites.png \
  --output-json character_frames.json \
  --output-visual character_vis.png
```

### Example 2: Large Sprite Sheet with Custom Settings
```bash
python scripts/detect_variable_frames.py large_sheet.png \
  --min-size 32 \
  --background-threshold 50 \
  --padding 5 \
  --output-json large_frames.json
```

### Example 3: Quick Detection (No Output Files)
```bash
python scripts/detect_variable_frames.py sprites.png
```

