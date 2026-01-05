# 🚀 Start Woujamind with Replicate (Video Generation)

## ⚠️ Important: CORS Requires Backend Proxy

**Why?** Replicate's API does NOT have CORS headers enabled for browser requests. You must use a backend proxy.

## 🎯 Quick Start (3 Steps)

### Step 1: Add API Keys to `.env`

Edit `.env` file:
```bash
# Get from: https://replicate.com/account/api-tokens
REPLICATE_API_KEY=r8_your_actual_key_here

# Get from: https://aistudio.google.com/app/apikey  
GEMINI_API_KEY=your_actual_gemini_key_here
VITE_GEMINI_API_KEY=your_actual_gemini_key_here
```

### Step 2: Start Backend Proxy (Terminal 1)

```bash
node server/replicate-proxy.js
```

You should see:
```
╔════════════════════════════════════════════════════════════╗
║  Replicate Proxy Server                                    ║
║  Running on: http://localhost:3001                         ║
╚════════════════════════════════════════════════════════════╝
✅ Replicate API key loaded
```

### Step 3: Start Frontend (Terminal 2)

```bash
npm run dev
```

Then open: http://localhost:5173

## ✅ How to Test

1. **Upload a reference image** (or use text prompt)
2. **Click "Generate"**
3. **Watch the console** for these messages:

**Backend Proxy (Terminal 1):**
```
[Replicate Proxy] Starting Seedance generation
[Replicate Proxy] Prompt: A red warrior character...
[Replicate Proxy] Frames: 150
[Replicate Proxy] Generation complete
```

**Frontend (Browser Console):**
```
[generateVideoFromImage] Starting Seedance generation
[generateVideoFromImage] Video downloaded, size: 2456789 bytes
[extractFramesFromVideo] Extracting 150 frames
[Frame Selection] Progress: 30/30
[FrameCentering] Centering 30 frames
```

**UI:**
- Status updates showing video generation progress
- **"Frame Gallery (150)"** button appears after generation
- Perfectly aligned sprite sheet!

## 🐛 Troubleshooting

### "Failed to fetch" or CORS Error

**Problem:** Backend proxy is not running

**Solution:**
```bash
# Terminal 1: Start proxy
node server/replicate-proxy.js

# Wait for "✅ Replicate API key loaded"
# Then try generating again
```

### "REPLICATE_API_KEY_MISSING"

**Problem:** API key not in `.env` file

**Solution:**
1. Edit `.env` file
2. Add: `REPLICATE_API_KEY=r8_your_key_here`
3. Restart proxy: `node server/replicate-proxy.js`

### "Connection refused" to localhost:3001

**Problem:** Proxy server not running or wrong port

**Solution:**
```bash
# Check if proxy is running
curl http://localhost:3001/health

# Should return: {"status":"ok","message":"Replicate proxy server is running"}

# If not, start proxy:
node server/replicate-proxy.js
```

### Video generation takes forever

**Normal:** Seedance takes 60-120 seconds to generate a 5-second video

**Check:**
- Backend proxy logs show "Generation complete"
- Frontend shows "Downloading video..." status
- Be patient! Video generation is compute-intensive

### Sprites still misaligned

**This should NOT happen** with video extraction!

**Debug:**
1. Check browser console for frame centering logs
2. Verify "Frame Gallery (150)" button appears
3. If button doesn't appear, video path isn't being used
4. Check for errors in proxy server logs

## 📊 Expected Performance

- **Video Generation:** 60-120 seconds (Replicate Seedance)
- **Frame Extraction:** 2-3 seconds (150 frames)
- **Frame Selection:** <1 second (smart selection)
- **Frame Centering:** 1-2 seconds (30-50 frames)
- **Grid Assembly:** <1 second
- **Total:** ~70-130 seconds for complete sprite sheet

## 🎉 Success Indicators

When everything is working:
- ✅ Proxy server shows generation logs
- ✅ Browser console shows frame processing logs
- ✅ "Frame Gallery (150)" button appears
- ✅ Sprites are perfectly aligned
- ✅ Smooth 30-50 frame animations
- ✅ No scattered/misaligned frames

## 💡 Pro Tips

1. **Keep proxy running** - Leave it in Terminal 1, don't close it
2. **Check proxy health** - Visit http://localhost:3001/health
3. **Monitor both logs** - Watch proxy (Terminal 1) and browser console
4. **Be patient** - Video generation takes time, don't refresh!
5. **Test with simple image first** - Verify setup before complex generations

## 🔄 Alternative: Use Gemini Only (No Proxy Needed)

If you don't want to run a backend proxy, you can disable Replicate:

**File:** `src/Component.tsx` (line 645)
```typescript
const useReplicate = false; // Disable video generation, use Gemini only
```

**Trade-offs:**
- ✅ No backend proxy needed
- ✅ Faster generation (10-20 seconds)
- ❌ May have alignment issues
- ❌ No Frame Gallery
- ❌ Fewer frames (8 vs 30-50)

## 📚 Architecture

```
┌─────────────┐      ┌──────────────────┐      ┌─────────────┐
│   Browser   │─────▶│  Backend Proxy   │─────▶│  Replicate  │
│ (localhost: │      │  (localhost:3001)│      │     API     │
│    5173)    │◀─────│                  │◀─────│             │
└─────────────┘      └──────────────────┘      └─────────────┘
     │                                                │
     │                                                │
     ▼                                                ▼
┌─────────────┐                              ┌─────────────┐
│   Gemini    │                              │   Seedance  │
│     API     │                              │    Model    │
│  (analysis) │                              │   (video)   │
└─────────────┘                              └─────────────┘
```

**Why proxy is needed:**
- Replicate API doesn't have CORS headers
- Browser blocks direct API calls
- Proxy adds CORS headers and forwards requests
- This is a Replicate API limitation, not our code

---

**Ready?** Start the proxy, start the frontend, and generate amazing sprites! 🎨


