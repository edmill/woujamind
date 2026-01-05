# ✅ Replicate/Seedance Now Enabled!

## 🎉 What Changed

**Fixed:** Replicate now works directly in the browser using the [HTTP API](https://replicate.com/docs/reference/http) - no backend proxy needed!

**Previous approach (incorrect):**
- ❌ Used Replicate Node.js SDK (`replicate.run()`)
- ❌ Required backend proxy for CORS
- ❌ Disabled by default

**New approach (correct):**
- ✅ Uses Replicate HTTP API directly (`fetch()`)
- ✅ Works in browser without backend
- ✅ **Enabled by default** (`useReplicate = true`)

## 🚀 How It Works Now

### API Calls

**Create Prediction:**
```typescript
POST https://api.replicate.com/v1/predictions
Authorization: Bearer YOUR_API_KEY
Content-Type: application/json
Prefer: wait

{
  "version": "a8c7ea67-c9ab-4f71-ac84-4036af08734b",
  "input": {
    "image": "data:image/png;base64,...",
    "prompt": "character animation",
    "num_frames": 150
  }
}
```

**Poll for Status:**
```typescript
GET https://api.replicate.com/v1/predictions/{prediction_id}
Authorization: Bearer YOUR_API_KEY
```

**Download Video:**
```typescript
GET {output_url}
// Returns video blob
```

## 📋 Setup (2 steps)

### 1. Add Replicate API Key

Add to `.env` or localStorage:
```bash
VITE_REPLICATE_API_KEY=r8_your_api_key_here
```

Or add via Settings modal in the app.

Get your API key: https://replicate.com/account/api-tokens

### 2. That's it!

No backend proxy needed. Just start the app:
```bash
npm run dev
```

## ✅ Verification

When working correctly, you'll see:

**Console logs:**
```
[generateVideoFromImage] Starting Seedance generation
[generateVideoFromImage] Prediction created: abc123 Status: starting
[generateVideoFromImage] Status: processing
[generateVideoFromImage] Status: succeeded
[generateVideoFromImage] Video downloaded, size: 2456789 bytes
[extractFramesFromVideo] Extracting 150 frames
[Frame Selection] Progress: 30/30
[FrameCentering] Centering 30 frames
```

**UI:**
- Status: "Generating video with Replicate Seedance..."
- Status: "Extracting all frames from video (150 frames)..."
- Status: "Selecting optimal frames for smooth animation..."
- Status: "Centering character frames for smooth animation..."
- Button: **"Frame Gallery (150)"** appears
- **Perfect alignment** - no scattered sprites!

## 🎯 The Correct Workflow (Now Active)

1. **Gemini** → Analyze character (if no reference image)
2. **Seedance** → Generate 5-second video (150 frames @ 30 FPS)
3. **Extract** → Get all 150 frames from video
4. **Smart Selection** → Pick optimal 30-50 frames
5. **Frame Centering** → Center each frame individually
6. **Assemble** → Create perfectly aligned sprite sheet

## 🔍 Troubleshooting

### "REPLICATE_API_KEY_MISSING"
- Add `VITE_REPLICATE_API_KEY` to `.env` file
- Or add via Settings modal
- Restart dev server after adding to `.env`

### "Failed to create prediction"
- Check API key is valid
- Check Replicate account has credits
- Check console for detailed error message

### "Rate limit exceeded"
- Replicate limits: 600 requests/minute for predictions
- Wait a moment and try again

### Frame Gallery button not showing
- Verify generation completed successfully
- Check console for `allExtractedFrames` logs
- Verify `useReplicate = true` in Component.tsx (should be enabled by default now)

### Sprites still misaligned
- This should NOT happen with video extraction!
- Check console logs to verify video path is being used
- If you see "Generating sprite sheet with Gemini AI..." then Replicate isn't being used
- Check that `useReplicate = true` in Component.tsx

## 📊 API Reference

**Replicate HTTP API Documentation:**
https://replicate.com/docs/reference/http

**Key Endpoints:**
- `POST /v1/predictions` - Create prediction
- `GET /v1/predictions/{id}` - Get prediction status
- `POST /v1/predictions/{id}/cancel` - Cancel prediction

**Seedance Model:**
- Model: `bytedance/seedance-1-pro-fast`
- Version: `a8c7ea67-c9ab-4f71-ac84-4036af08734b`
- Input: image (base64), prompt, num_frames (150)
- Output: video URL

## 💰 Pricing

**Replicate Seedance:**
- ~$0.01-0.02 per generation
- ~60-120 seconds generation time
- Pay per second of compute time

**Gemini (fallback if Replicate disabled):**
- Free tier: 15 requests/minute
- Paid: ~$0.00025 per image
- ~10-20 seconds generation time

## 🎉 Benefits

With Replicate enabled:
- ✅ **Perfect frame alignment** (each frame centered individually)
- ✅ **Frame Gallery** with all 150 frames
- ✅ **Manual frame selection** capability
- ✅ **Smoother animations** (30-50 frames vs 8)
- ✅ **No alignment issues** - video extraction ensures consistency
- ✅ **Professional quality** sprites

## 🔄 Migration Notes

**No migration needed!** The code automatically:
- Uses Replicate HTTP API when `useReplicate = true`
- Falls back to Gemini when `useReplicate = false`
- Stores all 150 frames in IndexedDB for persistence
- Shows Frame Gallery button when frames are available

**Old backend proxy files (no longer needed):**
- `server/replicate-proxy.js` - Can be deleted
- `ENABLE_REPLICATE.md` - Outdated (kept for reference)
- `QUICK_START_REPLICATE.md` - Outdated (kept for reference)

## 📚 Related Documentation

- `FRAME_SELECTION_IMPLEMENTATION.md` - Frame selection system
- `PERSISTENT_FRAME_STORAGE.md` - Frame storage in IndexedDB
- `FRAME_GALLERY_USER_GUIDE.md` - Using the Frame Gallery
- `src/services/replicateService.ts` - HTTP API implementation

---

**Summary:** Replicate now works out of the box using the HTTP API! Just add your API key and enjoy perfect sprite alignment with video-based generation. 🚀


