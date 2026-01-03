# ✅ Replicate CORS Solution: Backend Proxy Required

## 🎯 The Problem

**Error:**
```
Access to fetch at 'https://api.replicate.com/v1/predictions' from origin 'http://localhost:5173' 
has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present
```

**Root Cause:** Replicate's API does NOT have CORS headers enabled for browser requests. This is a Replicate API limitation, not a bug in our code.

## ✅ The Solution: Backend Proxy

A simple Express server that:
1. Receives requests from the browser (localhost:5173)
2. Forwards them to Replicate API with proper authentication
3. Returns the response with CORS headers enabled

**File:** `server/replicate-proxy.js` (already created)

## 🚀 Quick Start

### Option 1: Start Both Servers Together (Recommended)

```bash
npm run start:all
```

This starts:
- **Backend Proxy** on port 3001 (cyan logs)
- **Frontend** on port 5173 (magenta logs)

### Option 2: Start Separately

**Terminal 1 - Backend Proxy:**
```bash
npm run proxy
# or
node server/replicate-proxy.js
```

**Terminal 2 - Frontend:**
```bash
npm run dev
```

## ⚙️ Configuration

### 1. Add API Keys to `.env`

```bash
# Required: Get from https://replicate.com/account/api-tokens
REPLICATE_API_KEY=r8_your_actual_key_here

# Required: Get from https://aistudio.google.com/app/apikey
GEMINI_API_KEY=your_actual_gemini_key_here
VITE_GEMINI_API_KEY=your_actual_gemini_key_here

# Optional: Proxy port (default: 3001)
PROXY_PORT=3001
```

### 2. Restart Proxy Server

After adding API keys:
```bash
# Stop proxy (Ctrl+C)
# Start proxy again
npm run proxy
```

You should see:
```
╔════════════════════════════════════════════════════════════╗
║  Replicate Proxy Server                                    ║
║  Running on: http://localhost:3001                         ║
╚════════════════════════════════════════════════════════════╝
✅ Replicate API key loaded
```

## ✅ Verification

### 1. Test Proxy Health

```bash
curl http://localhost:3001/health
```

Should return:
```json
{"status":"ok","message":"Replicate proxy server is running"}
```

### 2. Generate a Sprite Sheet

1. Open http://localhost:5173
2. Upload a reference image
3. Click "Generate"
4. Watch the logs!

**Backend Proxy Logs (Terminal 1):**
```
[Replicate Proxy] Starting Seedance generation
[Replicate Proxy] Prompt: A red warrior character...
[Replicate Proxy] Frames: 150
[Replicate Proxy] Generation complete
[Replicate Proxy] Output type: string
```

**Frontend Console (Browser):**
```
[generateVideoFromImage] Starting Seedance generation
[generateVideoFromImage] Video downloaded, size: 2456789 bytes
[extractFramesFromVideo] Extracting 150 frames
[Frame Selection] Progress: 30/30
[FrameCentering] Centering 30 frames
```

**UI:**
- Status: "Generating video with Replicate Seedance..."
- **"Frame Gallery (150)"** button appears
- Perfectly aligned sprite sheet!

## 🐛 Troubleshooting

### "Failed to fetch" or CORS Error

**Cause:** Backend proxy is not running

**Fix:**
```bash
# Terminal 1: Start proxy
npm run proxy

# Wait for "✅ Replicate API key loaded"
# Then try generating again in browser
```

### "REPLICATE_API_KEY_MISSING"

**Cause:** API key not in `.env` or proxy not restarted

**Fix:**
1. Edit `.env` file: `REPLICATE_API_KEY=r8_your_key_here`
2. Restart proxy: `npm run proxy`

### "Connection refused" to localhost:3001

**Cause:** Proxy server not running

**Fix:**
```bash
# Check if proxy is running
curl http://localhost:3001/health

# If not, start it
npm run proxy
```

### "Proxy request failed: 401 Unauthorized"

**Cause:** Invalid Replicate API key

**Fix:**
1. Get a new key from https://replicate.com/account/api-tokens
2. Update `.env`: `REPLICATE_API_KEY=r8_new_key_here`
3. Restart proxy: `npm run proxy`

### Video generation takes forever

**Normal:** Seedance takes 60-120 seconds to generate a 5-second video

**Check:**
- Backend proxy logs show "Generation complete"
- Frontend shows "Downloading video..." status
- Be patient! Video generation is compute-intensive

## 📊 Architecture

```
┌─────────────────┐
│   Browser       │
│ (localhost:5173)│
└────────┬────────┘
         │ fetch('http://localhost:3001/api/replicate-proxy')
         │ ✅ CORS allowed (same origin policy relaxed by proxy)
         ▼
┌─────────────────┐
│ Backend Proxy   │
│ (localhost:3001)│
│ • Adds CORS     │
│ • Adds Auth     │
└────────┬────────┘
         │ fetch('https://api.replicate.com/v1/predictions')
         │ ✅ Server-to-server (no CORS issues)
         ▼
┌─────────────────┐
│ Replicate API   │
│ • Seedance Model│
│ • Video Output  │
└─────────────────┘
```

## 🎯 Why This is Necessary

**Replicate's API Design:**
- ❌ No CORS headers for browser requests
- ✅ Designed for server-to-server communication
- ✅ Requires `Authorization: Bearer` header

**Browser Security:**
- ❌ Blocks cross-origin requests without CORS headers
- ✅ Allows same-origin requests (localhost:5173 → localhost:3001)

**Our Proxy:**
- ✅ Runs on same origin (localhost)
- ✅ Adds CORS headers for browser
- ✅ Forwards requests to Replicate with auth
- ✅ Returns responses to browser

## 💡 Pro Tips

1. **Keep proxy running** - Leave it in a separate terminal
2. **Use `npm run start:all`** - Starts both servers together
3. **Check proxy health** - `curl http://localhost:3001/health`
4. **Monitor both logs** - Watch proxy and browser console
5. **Restart proxy after .env changes** - API keys are loaded on startup

## 🔄 Alternative: Disable Replicate (No Proxy Needed)

If you don't want to run a backend proxy:

**File:** `src/Component.tsx` (line 645)
```typescript
const useReplicate = false; // Disable video generation, use Gemini only
```

**Trade-offs:**
- ✅ No backend proxy needed
- ✅ Faster generation (10-20 seconds)
- ✅ Works entirely in browser
- ❌ May have alignment issues
- ❌ No Frame Gallery
- ❌ Fewer frames (8 vs 30-50)
- ❌ Lower quality animations

## 📚 Related Files

- **`server/replicate-proxy.js`** - Backend proxy server
- **`src/services/replicateService.ts`** - Frontend service (calls proxy)
- **`START_WITH_REPLICATE.md`** - Detailed startup guide
- **`.env`** - API key configuration

## 🎉 Success!

When working correctly:
- ✅ Proxy server running on port 3001
- ✅ Frontend running on port 5173
- ✅ No CORS errors in console
- ✅ "Frame Gallery (150)" button appears
- ✅ Perfectly aligned sprite sheets
- ✅ Smooth 30-50 frame animations

---

**Summary:** Replicate requires a backend proxy due to CORS restrictions. Use `npm run start:all` to start both servers, add your API keys to `.env`, and enjoy perfect sprite alignment! 🚀

