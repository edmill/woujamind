# Sprite Sheet Alignment Troubleshooting Guide

## 🔍 Issue: Sprites Scattered Across Sheet

If you see sprites broken up and scattered across the sprite sheet instead of being consistently centered in each frame, this indicates an alignment issue.

## 🎯 Quick Fix: Manual Re-Alignment

### Option 1: Use the "Align Grid" Button
1. Look for the **"Align Grid"** button in the toolbar (left side, near Undo/Redo)
2. Click it to manually trigger full sheet alignment
3. Wait 2-3 seconds for processing
4. Sprites should now be properly centered in each frame

### Option 2: Regenerate with Better Prompt
1. Click "New" to start fresh
2. Add more specific alignment instructions in your prompt:
   ```
   "Character must stay in the exact same position in every frame,
   only limbs and head should move, body center must be locked"
   ```
3. Generate again

## 🔧 Why This Happens

### Root Causes

1. **Gemini Generation Variance**
   - Gemini AI doesn't always follow positioning instructions perfectly
   - Even with detailed prompts, it may place characters differently in each frame
   - This is an AI model limitation, not a bug in Woujamind

2. **Automatic Alignment Runs But May Not Be Aggressive Enough**
   - `aiSmartAlignSpriteSheet` runs automatically after generation
   - It detects character bounds and attempts to align them
   - For severely misaligned sprites, it may need manual triggering

3. **Background Detection Issues**
   - If background color varies across frames, alignment may struggle
   - Green screen or pure white backgrounds work best

## 🛠️ Technical Details

### Alignment Pipeline

```
Generation Complete
    ↓
AI Analysis (detect alignment issues)
    ↓
Clean Sprite Sheet (remove artifacts)
    ↓
Align Whole Sheet (center all frames)
    ↓
Quality Check
    ↓
Display Result
```

### What "Align Grid" Does

1. **First Pass - Analysis**:
   - Extracts each frame from the grid
   - Detects background color (edge sampling)
   - Finds character bounding box (non-background pixels)
   - Calculates character anchor point (body center + feet position)
   - Repeats for all frames

2. **Calculate Median Anchor**:
   - Finds median X position (body center)
   - Finds median Y position (feet/base)
   - This becomes the target alignment point

3. **Second Pass - Alignment**:
   - For each frame:
     - Calculate offset from frame's anchor to median anchor
     - Redraw character at corrected position
     - Maintain background color consistency

### Debug Logging

Check browser console (F12) for alignment logs:
```
[Alignment] Detected X valid frames out of Y total frames
[Alignment] Target anchor point - X: 128 (body center), Y: 200 (feet/base)
[Alignment] X range: 120 to 135, Y range: 195 to 205
```

**Good alignment**: X and Y ranges should be narrow (< 20 pixels)
**Bad alignment**: Wide ranges indicate scattered sprites

## 🎨 Best Practices for Better Alignment

### 1. Use Clear Prompts
```
✅ GOOD:
"A red warrior character in pixel art style. The character's body 
must stay in the exact same position in every frame. Only arms, 
legs, and head should move. Body center must be locked in place."

❌ BAD:
"A cool warrior doing stuff"
```

### 2. Specify Background
```
✅ GOOD: "pure white background"
✅ GOOD: "bright green chroma key background"
❌ BAD: "forest background" (makes alignment harder)
```

### 3. Keep It Simple
- Single character only
- No complex props that extend far from body
- No projectiles or beams
- No ground shadows or scenery

### 4. Use Reference Images
- Upload a well-aligned sprite as reference
- Gemini will try to match the alignment style
- Works better than text-only prompts

## 🔍 Troubleshooting Steps

### Step 1: Check Console Logs
1. Open browser console (F12)
2. Look for `[Alignment]` messages
3. Check how many valid frames were detected
4. Check X/Y range values

### Step 2: Try Manual Alignment
1. Click "Align Grid" button
2. Wait for completion
3. Check if sprites are now centered

### Step 3: Adjust and Regenerate
If manual alignment doesn't help:
1. The sprites may be too scattered for automatic fixing
2. Regenerate with more specific prompt
3. Consider using a reference image

### Step 4: Use Frame Gallery (if available)
If generated with Replicate/Seedance:
1. Click "Frame Gallery" button
2. Review all 150 extracted frames
3. Manually select only well-aligned frames
4. Apply selection to regenerate sheet

## 📊 Known Limitations

### What Alignment CAN Fix
- ✅ Minor position drift (< 30 pixels)
- ✅ Inconsistent centering
- ✅ Small vertical/horizontal offsets
- ✅ Background color inconsistencies

### What Alignment CANNOT Fix
- ❌ Completely different character sizes
- ❌ Characters facing different directions
- ❌ Severely scattered sprites (> 50 pixel variance)
- ❌ Missing body parts or incomplete characters
- ❌ Overlapping frames or grid structure issues

## 🎯 Recommended Workflow

### For Best Results:
1. **Generate** with clear, specific prompt
2. **Review** the initial result
3. **Click "Align Grid"** if needed
4. **Edit** with AI if characters need adjustments
5. **Save** when satisfied

### If Still Not Aligned:
1. **Regenerate** with better prompt
2. **Use reference image** for consistency
3. **Try different art style** (pixel art tends to align better)
4. **Reduce frame count** (fewer frames = easier alignment)

## 💡 Pro Tips

1. **Pixel Art Aligns Best**: The discrete nature of pixels makes alignment more reliable
2. **Fewer Frames First**: Start with 2x4 grid (8 frames), then increase if needed
3. **Test Alignment Early**: Generate a test sprite before committing to complex animations
4. **Use "Inherited" Style**: When using reference images, inherited style preserves original alignment
5. **Check Animation Preview**: The animation preview will show if alignment is working

## 🐛 Reporting Issues

If alignment consistently fails:
1. Save the problematic sprite sheet
2. Note the generation parameters (model, prompt, style)
3. Check console logs for errors
4. Report with example image

## 📚 Related Documentation

- `FRAME_CENTERING_GUIDE.md` - Frame centering for Replicate/video generation
- `src/utils/spriteAlignment.ts` - Alignment algorithm source code
- `src/services/geminiService.ts` - Generation prompts and instructions

---

**Remember**: AI-generated sprites may not always be perfect. The alignment tools are there to help, but sometimes regeneration with a better prompt is the best solution!

