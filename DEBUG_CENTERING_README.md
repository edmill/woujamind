# Frame Centering Debug Tool

## 🎯 Purpose

Interactive browser-based tool for testing and debugging the Frame Centering Service. Use this to verify character detection and centering behavior before deploying to production.

## 🚀 Quick Start

### 1. Start Development Server

```bash
npm run dev
```

### 2. Open Debug Tool

Navigate to: `http://localhost:5173/debug_centering.html`

### 3. Test Frame Centering

1. **Upload a test frame** - Click "📁 Upload Test Frame" and select a single frame image
2. **Adjust parameters** (optional):
   - Target Width: 256px (default)
   - Target Height: 256px (default)  
   - Padding: 10% (default)
3. **Process frame** - Click "🎯 Process Frame" to see centered result
4. **Visualize bounds** - Click "👁️ Visualize Bounds" to see detection overlay

## 📊 What You'll See

### Original Frame
- Shows the uploaded frame as-is
- Displays dimensions and stats

### Centered Frame
- Shows the processed result after centering
- Character should be centered horizontally and vertically
- White background fills empty space
- Displays detected bounds information

### Bounds Visualization
- Green box = detected character bounding box
- Red dot = calculated center point
- Helps verify detection accuracy

### Console Log
- Real-time logging of processing steps
- Timestamps for each operation
- Error messages if detection fails
- Performance metrics

## 🧪 Test Cases

### Recommended Tests

#### 1. **Position Tests**
- [ ] Character on left side → should center horizontally
- [ ] Character on right side → should center horizontally
- [ ] Character at top → should center vertically
- [ ] Character at bottom → should center vertically
- [ ] Character in corner → should center both axes

#### 2. **Size Tests**
- [ ] Small character (< 50% of frame) → should enlarge and center
- [ ] Large character (> 80% of frame) → should fit within target
- [ ] Normal character (50-80% of frame) → should maintain relative size

#### 3. **Background Tests**
- [ ] Pure white background (#FFFFFF) → should detect character
- [ ] Light gray background (#F0F0F0) → should detect character
- [ ] Off-white background (#FAFAFA) → should detect character

#### 4. **Character Color Tests**
- [ ] Red character → should detect bounds
- [ ] Blue character → should detect bounds
- [ ] Green character → should detect bounds
- [ ] Multi-colored character → should detect full bounds
- [ ] Dark character on white → should detect clearly

#### 5. **Pose Tests**
- [ ] Standing idle → should center on body
- [ ] Arms raised → should include full height
- [ ] Jumping → should include full character
- [ ] Crouching → should center properly
- [ ] Wide stance → should include full width

## 🔧 Troubleshooting

### Issue: Character Not Detected

**Symptoms:**
- Green box covers entire frame
- Log shows "No character pixels detected"

**Solutions:**
1. Check if character color is too similar to background
2. Verify image has sufficient contrast
3. Try adjusting HSV thresholds in `frameCentering.ts`

### Issue: Character Cropped

**Symptoms:**
- Parts of character missing in centered result
- Bounds box too small in visualization

**Solutions:**
1. Increase padding percentage (try 15% or 20%)
2. Check if character has transparency that's being ignored
3. Verify morphological operations aren't eroding too much

### Issue: Background Not Removed

**Symptoms:**
- Centered frame includes background artifacts
- Character not properly isolated

**Solutions:**
1. Verify background is white or light gray
2. Check HSV detection thresholds
3. Ensure input image has good quality

## 📈 Performance Monitoring

The debug tool displays processing times for:
- Character detection
- Morphological operations  
- Resize and centering
- Total processing time

**Expected Performance:**
- Single frame: 20-35ms
- Detection: 5-10ms
- Morphology: 10-15ms
- Resize: 5-10ms

If times are significantly higher, check:
- Image resolution (should be ~256-512px)
- Browser performance
- Canvas rendering optimization

## 🎨 Visual Indicators

### Console Log Colors
- 🟢 Green = Info (normal operation)
- 🟡 Yellow = Warning (non-critical issues)
- 🔴 Red = Error (processing failed)

### Stats Display
- **Width/Height** - Dimensions of result
- **Bounds** - Detected character bounding box (x, y, w, h)
- **Note** - Additional information about the result

## 💡 Tips

1. **Extract test frames** from existing sprite sheets using image editor
2. **Test edge cases** - unusual poses, colors, sizes
3. **Compare results** - keep original and centered side-by-side
4. **Adjust parameters** - find optimal settings for your use case
5. **Check logs** - detailed information helps diagnose issues

## 🔗 Related Files

- **Service:** `src/utils/frameCentering.ts`
- **Integration:** `src/services/replicateService.ts`
- **Documentation:** `FRAME_CENTERING_GUIDE.md`

## 📞 Support

If you encounter issues:
1. Check console logs for detailed error messages
2. Try different test frames to isolate the problem
3. Adjust parameters to see if behavior improves
4. Review `FRAME_CENTERING_GUIDE.md` for configuration options
5. Check `frameCentering.ts` source code for implementation details

---

**Last Updated:** January 2, 2026  
**Version:** 1.0.0


