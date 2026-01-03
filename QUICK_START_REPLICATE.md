# Quick Start: Enable Replicate/Seedance

## 🎯 Goal

Enable the correct workflow:
1. **Gemini** → Generate/analyze character (if no reference)
2. **Seedance** → Generate 5-second video from character
3. **Extract** → Get all 150 frames from video
4. **Center** → Align each frame individually  
5. **Assemble** → Create sprite sheet grid

## ⚡ Quick Setup (5 minutes)

### Step 1: Install Dependencies

```bash
npm install express cors replicate dotenv
```

### Step 2: Add Replicate API Key

Add to `.env` file:
```bash
REPLICATE_API_KEY=r8_your_api_key_here
PROXY_PORT=3001
```

Get your API key from: https://replicate.com/account/api-tokens

### Step 3: Update replicateService.ts

Replace the `generateVideoFromImage` function:

**File:** `src/services/replicateService.ts` (around line 173)

```typescript
export const generateVideoFromImage = async (
  imageBase64: string,
  prompt: string,
  onProgress?: (status: string) => void
): Promise<Blob> => {
  try {
    onProgress?.('Initializing video generation...');

    const imageDataUri = imageBase64.startsWith('data:')
      ? imageBase64
      : `data:image/png;base64,${imageBase64}`;

    console.log('[generateVideoFromImage] Starting Seedance generation via proxy');

    onProgress?.('Generating video with Replicate Seedance...');

    // Call backend proxy instead of Replicate directly (solves CORS)
    const response = await fetch('http://localhost:3001/api/replicate-proxy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        image: imageDataUri,
        prompt: prompt,
        num_frames: 150,
        guidance_scale: 7.5,
        num_inference_steps: 20,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `Proxy request failed: ${response.statusText}`);
    }

    const { output, error } = await response.json();
    
    if (error) {
      throw new Error(error);
    }

    console.log('[generateVideoFromImage] Seedance output:', output);

    // Output should be a video URL
    let videoUrl: string;
    if (typeof output === 'string') {
      videoUrl = output;
    } else if (Array.isArray(output) && output.length > 0) {
      videoUrl = output[0];
    } else {
      throw new Error('Unexpected output format from Seedance');
    }

    onProgress?.('Downloading video...');

    // Download the video
    const videoResponse = await fetch(videoUrl);
    if (!videoResponse.ok) {
      throw new Error(`Failed to download video: ${videoResponse.statusText}`);
    }

    const videoBlob = await videoResponse.blob();
    console.log('[generateVideoFromImage] Video downloaded, size:', videoBlob.size, 'bytes');

    return videoBlob;

  } catch (error: any) {
    console.error('[generateVideoFromImage] Error:', error);

    // Handle specific error types
    if (error.message?.includes('REPLICATE_API_KEY_MISSING')) {
      throw error;
    } else if (error.message?.includes('rate limit')) {
      throw new Error('RATE_LIMIT: Replicate API rate limit exceeded. Please wait a moment and try again.');
    } else if (error.message?.includes('timeout')) {
      throw new Error('TIMEOUT: Video generation timed out after 5 minutes. Please try again with a simpler prompt.');
    } else if (error.message?.includes('fetch')) {
      throw new Error('PROXY_ERROR: Could not connect to proxy server. Make sure the proxy server is running on port 3001.');
    } else {
      throw new Error(`Video generation failed: ${error.message || 'Unknown error'}`);
    }
  }
};
```

### Step 4: Enable Replicate in Component

**File:** `src/Component.tsx` (line 645)

Change:
```typescript
const useReplicate = true; // Enable video-based generation
```

### Step 5: Start Both Servers

**Terminal 1 - Backend Proxy:**
```bash
node server/replicate-proxy.js
```

**Terminal 2 - Frontend:**
```bash
npm run dev
```

## ✅ Verify It's Working

1. Open http://localhost:5173
2. Upload a reference image (or use text prompt)
3. Click "Generate"
4. You should see these status messages:
   - "Analyzing character design..."
   - "Optimizing prompt for animation..."
   - "Generating video with Replicate Seedance..."
   - "Extracting all frames from video (150 frames)..."
   - "Selecting optimal frames for smooth animation..."
   - "Centering character frames for smooth animation..."
   - "Creating sprite sheet..."

5. After generation:
   - ✅ Sprites should be perfectly aligned
   - ✅ "Frame Gallery (150)" button should appear
   - ✅ No scattered/misaligned frames

## 🐛 Troubleshooting

### "Could not connect to proxy server"
- Make sure proxy server is running: `node server/replicate-proxy.js`
- Check it's on port 3001: http://localhost:3001/health
- Check terminal for error messages

### "REPLICATE_API_KEY_MISSING"
- Add `REPLICATE_API_KEY=r8_...` to `.env` file
- Restart proxy server after adding key
- Get key from: https://replicate.com/account/api-tokens

### "Video generation failed"
- Check Replicate account has credits
- Check API key is valid
- Check proxy server logs for detailed error

### Sprites still misaligned
- Check console logs for frame extraction messages
- Verify `useReplicate = true` in Component.tsx
- Check that Frame Gallery button appears (confirms video path)

## 📊 Expected Console Output

**Backend Proxy:**
```
[Replicate Proxy] Starting Seedance generation
[Replicate Proxy] Prompt: A red warrior character...
[Replicate Proxy] Frames: 150
[Replicate Proxy] Generation complete
[Replicate Proxy] Output type: string
```

**Frontend:**
```
[generateVideoFromImage] Starting Seedance generation via proxy
[generateVideoFromImage] Seedance output: https://...
[generateVideoFromImage] Video downloaded, size: 2456789 bytes
[extractFramesFromVideo] Extracting 150 frames from video
[generateSpriteSheetFromImage] Extracted 150 total frames
[Frame Selection] Progress: 30/30
[FrameCentering] Centering 30 frames
[generateSpriteSheetFromImage] Successfully centered all frames
```

## 🎉 Success!

When working correctly:
- ✅ Perfect frame alignment (no scattered sprites)
- ✅ Frame Gallery button with 150 frames
- ✅ Smooth 30-50 frame animations
- ✅ Manual frame selection capability
- ✅ No alignment issues!

## 💡 Pro Tips

1. **Keep proxy server running** - Leave it in a separate terminal
2. **Check proxy health** - Visit http://localhost:3001/health
3. **Monitor logs** - Watch both terminals for errors
4. **Test with simple image first** - Verify setup before complex generations

## 📚 Alternative: Production Deployment

For production, use a proper backend:
- **Vercel**: Next.js API route (see `ENABLE_REPLICATE.md`)
- **Cloudflare**: Worker function (see `ENABLE_REPLICATE.md`)
- **AWS**: Lambda function
- **Railway/Render**: Deploy Express server

The local proxy is perfect for development!

