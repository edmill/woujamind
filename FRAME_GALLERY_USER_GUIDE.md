# Frame Gallery User Guide

## 🎬 What is the Frame Gallery?

The Frame Gallery is a powerful tool that lets you see and choose exactly which frames are included in your sprite sheet. When Woujamind generates a sprite animation from a reference image, it creates a 5-second video with 150 frames. The Frame Gallery gives you access to ALL of these frames.

## 🎯 When to Use It

### Default Behavior (No Action Needed)
Woujamind automatically selects the best frames for smooth animation:
- **Idle**: 30 frames
- **Walk**: 40 frames  
- **Run**: 40 frames
- **Jump**: 35 frames
- **Attack**: 35 frames
- **Cast**: 40 frames

### Open Frame Gallery When You Want To:
- ✅ See all 150 extracted frames from your video
- ✅ Preview the animation at different speeds
- ✅ Manually select specific frames
- ✅ Remove frames that don't look right
- ✅ Add more frames for extra smooth animation
- ✅ Create custom frame sequences

## 📍 How to Access

1. Generate a sprite sheet using a **reference image** (not text prompt)
2. Wait for generation to complete
3. Look for the **"Frame Gallery (150)"** button in the toolbar
4. Click to open the gallery

> **Note**: Frame Gallery only appears for video-based generation (Replicate/Seedance), not Gemini text-to-image generation.

## 🎮 Using the Frame Gallery

### Main Interface

```
┌─────────────────────────────────────────────────┐
│  Frame Selection Gallery                    ✕  │
│  40 of 150 frames selected                      │
├─────────────────────────────────────────────────┤
│                                                 │
│  ┌──────────────┐    Playback Controls         │
│  │   Preview    │    ▶ Play / ⏸ Pause          │
│  │   Canvas     │    Speed: 30 FPS [slider]    │
│  └──────────────┘                               │
├─────────────────────────────────────────────────┤
│  [Select All] [Deselect All] [First 50]        │
│  [Middle 50] [Last 50]                          │
├─────────────────────────────────────────────────┤
│  ┌───┬───┬───┬───┬───┬───┬───┬───┐            │
│  │ 0 │ 1 │ 2 │ 3 │ 4 │ 5 │ 6 │ 7 │  ← Frames  │
│  └───┴───┴───┴───┴───┴───┴───┴───┘            │
│  ┌───┬───┬───┬───┬───┬───┬───┬───┐            │
│  │ 8 │ 9 │10 │11 │12 │13 │14 │15 │            │
│  └───┴───┴───┴───┴───┴───┴───┴───┘            │
│  ... (scrollable grid of all 150 frames)       │
├─────────────────────────────────────────────────┤
│              [Cancel] [Apply Selection (40)]    │
└─────────────────────────────────────────────────┘
```

### Frame Visual States

- **Selected Frame**: 
  - Cyan/blue border
  - Full opacity (100%)
  - Checkmark (✓) in top-right corner
  - Frame number in bottom-left

- **Unselected Frame**:
  - No border
  - Dimmed (40% opacity)
  - No checkmark
  - Frame number in bottom-left

- **Currently Playing Frame**:
  - Green glowing border
  - Highlighted during playback preview

### Controls

#### Playback Preview
- **▶ Play / ⏸ Pause**: Start/stop animation preview
- **Speed Slider**: Adjust playback speed from 10-60 FPS
- **Preview Canvas**: Shows current frame in real-time

#### Selection Tools
- **Select All**: Select all 150 frames
- **Deselect All**: Clear all selections
- **First 50**: Select frames 0-49
- **Middle 50**: Select frames 50-99
- **Last 50**: Select frames 100-149

#### Individual Selection
- **Click any frame**: Toggle selection on/off
- **Multiple clicks**: Build custom selection

#### Apply Changes
- **Cancel**: Close gallery without changes
- **Apply Selection (N)**: Regenerate sprite sheet with selected frames

## 💡 Tips & Best Practices

### For Smooth Animation
- **Minimum 25 frames**: Less than 25 may look choppy
- **Even distribution**: Select frames evenly across the video
- **Watch the preview**: Use playback to check smoothness before applying

### For Action Sequences
- **More frames = smoother**: 40-50 frames for walk/run cycles
- **Fewer frames = snappier**: 30-35 frames for attacks/jumps
- **Test different speeds**: Adjust FPS to find the right feel

### For Custom Sequences
- **Start of video**: Usually has the initial pose/setup
- **Middle of video**: Peak action and movement
- **End of video**: Return to rest or follow-through

### Common Use Cases

#### Remove Bad Frames
1. Open Frame Gallery
2. Find frames that look off (blurry, distorted, etc.)
3. Click to deselect them
4. Click "Apply Selection"

#### Add More Frames
1. Open Frame Gallery
2. Click "Select All" (150 frames)
3. Watch preview - may be slower but ultra-smooth
4. Click "Apply Selection"

#### Create Custom Loop
1. Open Frame Gallery
2. Deselect all
3. Manually select frames that create a good loop
4. Test with playback preview
5. Adjust speed if needed
6. Click "Apply Selection"

## ⚙️ Technical Details

### Video Specifications
- **Duration**: 5 seconds
- **Frame Rate**: 30 FPS
- **Total Frames**: 150
- **Frame Size**: 256x256 pixels (after centering)

### Selection Algorithm
By default, Woujamind uses "Smart Selection":
1. Divides video into equal segments
2. Analyzes quality (sharpness) of each frame
3. Selects best quality frame from each segment
4. Ensures even distribution + high quality

### Performance
- **Loading**: ~2-3 seconds to extract all frames
- **Playback**: Smooth at 10-60 FPS
- **Regeneration**: ~4-6 seconds to create new sprite sheet

## 🐛 Troubleshooting

### Frame Gallery Button Not Showing
- **Cause**: Only available for video-based generation (Replicate)
- **Solution**: Make sure you're using a reference image, not just text

### Preview Not Playing
- **Cause**: No frames selected
- **Solution**: Select at least one frame

### Regeneration Failed
- **Cause**: No frames selected or browser memory issue
- **Solution**: Select at least 25 frames and try again

### Frames Look Blurry
- **Cause**: Low quality frames in video
- **Solution**: Use higher quality reference image or try different frames

## 🎓 Example Workflows

### Workflow 1: Quick Quality Check
```
1. Generate sprite sheet
2. Open Frame Gallery
3. Watch playback preview at 30 FPS
4. If satisfied → Close gallery
5. If not → Deselect bad frames → Apply
```

### Workflow 2: Maximum Smoothness
```
1. Generate sprite sheet
2. Open Frame Gallery
3. Click "Select All" (150 frames)
4. Adjust speed to 60 FPS
5. Watch preview
6. Click "Apply Selection"
```

### Workflow 3: Custom Animation
```
1. Generate sprite sheet
2. Open Frame Gallery
3. Click "Deselect All"
4. Manually click frames: 0, 5, 10, 15, 20, 25...
5. Watch preview
6. Adjust selection until satisfied
7. Click "Apply Selection"
```

## 📊 Frame Count Recommendations

| Action Type | Minimum | Recommended | Maximum |
|-------------|---------|-------------|---------|
| Idle        | 20      | 30          | 60      |
| Walk        | 30      | 40          | 80      |
| Run         | 30      | 40          | 80      |
| Jump        | 25      | 35          | 70      |
| Attack      | 25      | 35          | 70      |
| Cast        | 30      | 40          | 80      |

## 🎉 Summary

The Frame Gallery puts you in complete control of your sprite animations. Start with the smart auto-selection, then fine-tune to perfection. Whether you want ultra-smooth 150-frame animations or carefully curated 30-frame sequences, the Frame Gallery makes it easy.

**Remember**: More frames = smoother animation, but larger file size. Find the sweet spot for your game!

