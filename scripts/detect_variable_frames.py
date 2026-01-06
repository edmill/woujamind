#!/usr/bin/env python3
"""
Variable Frame Detection for Sprite Sheets
Detects individual sprite frames with varying sizes and orientations
Uses traditional computer vision techniques (no AI required)

Usage:
    python scripts/detect_variable_frames.py <sprite_sheet.png> [options]
    
Options:
    --output-json <file>     Save frame data as JSON
    --output-visual <file>   Save visualization with bounding boxes
    --min-size <pixels>      Minimum frame size (default: 8)
    --background-threshold   Color difference threshold for background (default: 30)
    --padding <pixels>       Padding around detected sprites (default: 2)
"""

import sys
import json
import argparse
from pathlib import Path
from typing import List, Tuple, Dict, Optional
from dataclasses import dataclass, asdict

try:
    from PIL import Image, ImageDraw, ImageFont
    import numpy as np
except ImportError:
    print("Error: Required packages not installed.")
    print("Install with: pip install pillow numpy")
    sys.exit(1)


@dataclass
class Frame:
    """Represents a detected sprite frame"""
    x: int
    y: int
    width: int
    height: int
    index: int
    confidence: float = 1.0


@dataclass
class DetectionResult:
    """Result of frame detection"""
    frames: List[Frame]
    image_width: int
    image_height: int
    background_color: Optional[Tuple[int, int, int, int]] = None
    method: str = "content_segmentation"


class VariableFrameDetector:
    """Detects variable-sized frames in sprite sheets"""
    
    def __init__(
        self,
        min_size: int = 8,
        background_threshold: int = 30,
        padding: int = 2
    ):
        self.min_size = min_size
        self.background_threshold = background_threshold
        self.padding = padding
    
    def detect_background_color(self, img: Image.Image) -> Tuple[int, int, int, int]:
        """Sample background color from image edges and corners"""
        width, height = img.size
        pixels = []
        
        # Sample corners
        corners = [
            (0, 0), (width-1, 0),
            (0, height-1), (width-1, height-1)
        ]
        
        # Sample edges (every 10 pixels)
        for x in range(0, width, 10):
            pixels.append(img.getpixel((x, 0)))
            pixels.append(img.getpixel((x, height-1)))
        
        for y in range(0, height, 10):
            pixels.append(img.getpixel((0, y)))
            pixels.append(img.getpixel((width-1, y)))
        
        # Find most common color (background)
        if not pixels:
            return (255, 255, 255, 255)
        
        # Convert to RGBA if needed
        if img.mode != 'RGBA':
            img = img.convert('RGBA')
        
        # Count color occurrences
        color_counts = {}
        for pixel in pixels:
            if img.mode == 'RGBA':
                r, g, b, a = pixel
            else:
                r, g, b = pixel[:3]
                a = 255
            
            # Round to nearest 10 to group similar colors
            key = (r // 10 * 10, g // 10 * 10, b // 10 * 10, a)
            color_counts[key] = color_counts.get(key, 0) + 1
        
        # Return most common color
        bg_color = max(color_counts.items(), key=lambda x: x[1])[0]
        return bg_color
    
    def is_background_pixel(
        self,
        pixel: Tuple[int, int, int, int],
        bg_color: Tuple[int, int, int, int],
        threshold: Optional[int] = None
    ) -> bool:
        """Check if pixel matches background color"""
        if threshold is None:
            threshold = self.background_threshold
        
        r, g, b, a = pixel
        bg_r, bg_g, bg_b, bg_a = bg_color
        
        # Transparent pixels are background
        if a < 128:
            return True
        
        # Check color difference
        color_diff = np.sqrt(
            (r - bg_r) ** 2 +
            (g - bg_g) ** 2 +
            (b - bg_b) ** 2
        )
        
        return color_diff < threshold
    
    def detect_frames_by_content(self, img: Image.Image) -> DetectionResult:
        """Detect frames by analyzing sprite content boundaries"""
        width, height = img.size
        
        # Ensure RGBA mode
        if img.mode != 'RGBA':
            img = img.convert('RGBA')
        
        # Detect background color
        bg_color = self.detect_background_color(img)
        
        # Create binary mask: 1 = content, 0 = background
        mask = np.zeros((height, width), dtype=np.uint8)
        
        for y in range(height):
            for x in range(width):
                pixel = img.getpixel((x, y))
                if not self.is_background_pixel(pixel, bg_color):
                    mask[y, x] = 1
        
        # Find connected components (individual sprites)
        try:
            from scipy import ndimage
            labeled, num_features = ndimage.label(mask)
        except ImportError:
            # Fallback: simple flood fill implementation (no scipy required)
            labeled, num_features = self._simple_label(mask)
        
        # Extract bounding boxes for each component
        frames = []
        for label_id in range(1, num_features + 1):
            coords = np.where(labeled == label_id)
            if len(coords[0]) == 0:
                continue
            
            y_min, y_max = int(coords[0].min()), int(coords[0].max())
            x_min, x_max = int(coords[1].min()), int(coords[1].max())
            
            frame_width = x_max - x_min + 1
            frame_height = y_max - y_min + 1
            
            # Filter out tiny noise
            if frame_width < self.min_size or frame_height < self.min_size:
                continue
            
            # Add padding
            x_min = max(0, x_min - self.padding)
            y_min = max(0, y_min - self.padding)
            x_max = min(width - 1, x_max + self.padding)
            y_max = min(height - 1, y_max + self.padding)
            
            frame_width = x_max - x_min + 1
            frame_height = y_max - y_min + 1
            
            frames.append(Frame(
                x=x_min,
                y=y_min,
                width=frame_width,
                height=frame_height,
                index=len(frames),
                confidence=1.0
            ))
        
        # Sort frames by position (top-to-bottom, left-to-right)
        frames.sort(key=lambda f: (f.y, f.x))
        for i, frame in enumerate(frames):
            frame.index = i
        
        return DetectionResult(
            frames=frames,
            image_width=width,
            image_height=height,
            background_color=bg_color,
            method="content_segmentation"
        )
    
    def _simple_label(self, mask: np.ndarray) -> Tuple[np.ndarray, int]:
        """Simple flood fill labeling (fallback if scipy not available)"""
        height, width = mask.shape
        labeled = np.zeros_like(mask, dtype=np.int32)
        label_id = 0
        
        def flood_fill(y, x, current_label):
            stack = [(y, x)]
            while stack:
                cy, cx = stack.pop()
                if (cy < 0 or cy >= height or cx < 0 or cx >= width or
                    labeled[cy, cx] != 0 or mask[cy, cx] == 0):
                    continue
                
                labeled[cy, cx] = current_label
                stack.extend([
                    (cy - 1, cx), (cy + 1, cx),
                    (cy, cx - 1), (cy, cx + 1)
                ])
        
        for y in range(height):
            for x in range(width):
                if mask[y, x] == 1 and labeled[y, x] == 0:
                    label_id += 1
                    flood_fill(y, x, label_id)
        
        return labeled, label_id
    
    def detect_frames_by_grid_lines(self, img: Image.Image) -> Optional[DetectionResult]:
        """Detect frames by finding grid lines (for sprite sheets with visible borders)"""
        width, height = img.size
        
        if img.mode != 'RGBA':
            img = img.convert('RGBA')
        
        # Convert to grayscale for edge detection
        gray = np.array(img.convert('L'))
        
        # Detect vertical lines (column separators)
        vertical_lines = []
        for x in range(1, width - 1):
            # Check if this column is mostly an edge
            edge_pixels = 0
            for y in range(height):
                left = gray[y, x - 1]
                right = gray[y, x + 1]
                if abs(int(left) - int(right)) > 50:
                    edge_pixels += 1
            
            if edge_pixels / height > 0.7:  # 70% of column is edge
                vertical_lines.append(x)
        
        # Detect horizontal lines (row separators)
        horizontal_lines = []
        for y in range(1, height - 1):
            edge_pixels = 0
            for x in range(width):
                top = gray[y - 1, x]
                bottom = gray[y + 1, x]
                if abs(int(top) - int(bottom)) > 50:
                    edge_pixels += 1
            
            if edge_pixels / width > 0.7:
                horizontal_lines.append(y)
        
        # If we found grid lines, create frames from grid
        if len(vertical_lines) > 0 or len(horizontal_lines) > 0:
            # Add image boundaries
            all_v_lines = [0] + sorted(vertical_lines) + [width]
            all_h_lines = [0] + sorted(horizontal_lines) + [height]
            
            frames = []
            for row_idx in range(len(all_h_lines) - 1):
                y_min = all_h_lines[row_idx]
                y_max = all_h_lines[row_idx + 1]
                
                for col_idx in range(len(all_v_lines) - 1):
                    x_min = all_v_lines[col_idx]
                    x_max = all_v_lines[col_idx + 1]
                    
                    frame_width = x_max - x_min
                    frame_height = y_max - y_min
                    
                    if frame_width >= self.min_size and frame_height >= self.min_size:
                        frames.append(Frame(
                            x=x_min,
                            y=y_min,
                            width=frame_width,
                            height=frame_height,
                            index=len(frames),
                            confidence=0.9
                        ))
            
            if frames:
                bg_color = self.detect_background_color(img)
                return DetectionResult(
                    frames=frames,
                    image_width=width,
                    image_height=height,
                    background_color=bg_color,
                    method="grid_lines"
                )
        
        return None
    
    def detect(self, image_path: str) -> DetectionResult:
        """Main detection method - tries grid lines first, then content segmentation"""
        img = Image.open(image_path)
        
        # Try grid line detection first (faster, more accurate if grid exists)
        grid_result = self.detect_frames_by_grid_lines(img)
        if grid_result and len(grid_result.frames) > 0:
            return grid_result
        
        # Fall back to content-based segmentation
        return self.detect_frames_by_content(img)


def save_visualization(
    image_path: str,
    result: DetectionResult,
    output_path: str
):
    """Save visualization with bounding boxes drawn"""
    img = Image.open(image_path).convert('RGBA')
    draw = ImageDraw.Draw(img)
    
    # Draw bounding boxes
    colors = [
        (255, 0, 0, 200),    # Red
        (0, 255, 0, 200),    # Green
        (0, 0, 255, 200),    # Blue
        (255, 255, 0, 200),  # Yellow
        (255, 0, 255, 200),  # Magenta
        (0, 255, 255, 200),  # Cyan
    ]
    
    for frame in result.frames:
        color = colors[frame.index % len(colors)]
        
        # Draw rectangle
        draw.rectangle(
            [(frame.x, frame.y), (frame.x + frame.width, frame.y + frame.height)],
            outline=color,
            width=2
        )
        
        # Draw frame index
        try:
            font = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 12)
        except:
            try:
                font = ImageFont.load_default()
            except:
                font = None
        
        if font:
            text = str(frame.index)
            bbox = draw.textbbox((0, 0), text, font=font)
            text_width = bbox[2] - bbox[0]
            text_height = bbox[3] - bbox[1]
            
            # Draw background for text
            draw.rectangle(
                [(frame.x, frame.y), (frame.x + text_width + 4, frame.y + text_height + 4)],
                fill=(0, 0, 0, 180)
            )
            draw.text(
                (frame.x + 2, frame.y + 2),
                text,
                fill=(255, 255, 255, 255),
                font=font
            )
    
    img.save(output_path)
    print(f"Visualization saved to: {output_path}")


def main():
    parser = argparse.ArgumentParser(
        description="Detect variable-sized frames in sprite sheets"
    )
    parser.add_argument(
        "image",
        type=str,
        help="Path to sprite sheet image"
    )
    parser.add_argument(
        "--output-json",
        type=str,
        help="Save frame data as JSON file"
    )
    parser.add_argument(
        "--output-visual",
        type=str,
        help="Save visualization with bounding boxes"
    )
    parser.add_argument(
        "--min-size",
        type=int,
        default=8,
        help="Minimum frame size in pixels (default: 8)"
    )
    parser.add_argument(
        "--background-threshold",
        type=int,
        default=30,
        help="Color difference threshold for background detection (default: 30)"
    )
    parser.add_argument(
        "--padding",
        type=int,
        default=2,
        help="Padding around detected sprites in pixels (default: 2)"
    )
    
    args = parser.parse_args()
    
    # Check if image exists
    if not Path(args.image).exists():
        print(f"Error: Image file not found: {args.image}")
        sys.exit(1)
    
    # Detect frames
    print(f"Detecting frames in: {args.image}")
    detector = VariableFrameDetector(
        min_size=args.min_size,
        background_threshold=args.background_threshold,
        padding=args.padding
    )
    
    try:
        result = detector.detect(args.image)
    except Exception as e:
        print(f"Error during detection: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
    
    # Print results
    print(f"\nDetection Method: {result.method}")
    print(f"Image Size: {result.image_width} x {result.image_height}")
    print(f"Background Color: {result.background_color}")
    print(f"\nDetected {len(result.frames)} frames:\n")
    
    for frame in result.frames:
        print(f"  Frame {frame.index}:")
        print(f"    Position: ({frame.x}, {frame.y})")
        print(f"    Size: {frame.width} x {frame.height}")
        print(f"    Confidence: {frame.confidence:.2f}")
        print()
    
    # Save JSON output
    if args.output_json:
        json_data = {
            "image_width": result.image_width,
            "image_height": result.image_height,
            "background_color": result.background_color,
            "method": result.method,
            "frames": [asdict(frame) for frame in result.frames]
        }
        
        with open(args.output_json, 'w') as f:
            json.dump(json_data, f, indent=2)
        
        print(f"JSON data saved to: {args.output_json}")
    
    # Save visualization
    if args.output_visual:
        try:
            save_visualization(args.image, result, args.output_visual)
        except Exception as e:
            print(f"Warning: Could not save visualization: {e}")


if __name__ == "__main__":
    main()

