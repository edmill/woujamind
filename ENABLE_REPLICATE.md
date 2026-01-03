# Enabling Replicate/Seedance Video Generation

## 🎯 Why Enable Replicate?

**Current (Gemini):**
- ❌ Generates entire sprite sheet as one image
- ❌ Alignment issues (AI doesn't always follow positioning instructions)
- ❌ No Frame Gallery
- ❌ No individual frame control
- ✅ Works in browser without backend
- ✅ Faster generation (~10-20 seconds)

**With Replicate/Seedance:**
- ✅ Generates 5-second video animation
- ✅ Perfect frame alignment (each frame centered individually)
- ✅ Frame Gallery with all 150 frames
- ✅ Manual frame selection capability
- ✅ Smoother animations (30-50 frames)
- ❌ Requires backend proxy (CORS restriction)
- ❌ Slower generation (~60-120 seconds)

## 🚀 Implementation Options

### Option 1: Next.js API Route (Recommended for Vercel)

**File:** `pages/api/replicate-proxy.ts` or `app/api/replicate-proxy/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import Replicate from 'replicate';

export async function POST(request: NextRequest) {
  try {
    const { image, prompt, num_frames, guidance_scale, num_inference_steps } = await request.json();
    
    const replicate = new Replicate({
      auth: process.env.REPLICATE_API_KEY,
    });

    const output = await replicate.run(
      "bytedance/seedance-1-pro-fast:a8c7ea67-c9ab-4f71-ac84-4036af08734b",
      {
        input: {
          image,
          prompt,
          num_frames,
          guidance_scale,
          num_inference_steps,
        }
      }
    );

    return NextResponse.json({ output });
  } catch (error: any) {
    console.error('[Replicate Proxy] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Unknown error' },
      { status: 500 }
    );
  }
}
```

**Update replicateService.ts:**
```typescript
// Replace replicate.run() call with fetch to your API route
const response = await fetch('/api/replicate-proxy', {
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

const { output } = await response.json();
```

### Option 2: Express Backend

**File:** `server.js`

```javascript
const express = require('express');
const Replicate = require('replicate');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_KEY,
});

app.post('/api/replicate-proxy', async (req, res) => {
  try {
    const { image, prompt, num_frames, guidance_scale, num_inference_steps } = req.body;

    const output = await replicate.run(
      "bytedance/seedance-1-pro-fast:a8c7ea67-c9ab-4f71-ac84-4036af08734b",
      {
        input: {
          image,
          prompt,
          num_frames,
          guidance_scale,
          num_inference_steps,
        }
      }
    );

    res.json({ output });
  } catch (error) {
    console.error('[Replicate Proxy] Error:', error);
    res.status(500).json({ error: error.message || 'Unknown error' });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Replicate proxy server running on port ${PORT}`);
});
```

### Option 3: Cloudflare Worker

**File:** `worker.js`

```javascript
export default {
  async fetch(request, env) {
    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    try {
      const { image, prompt, num_frames, guidance_scale, num_inference_steps } = await request.json();

      // Call Replicate API directly from worker
      const response = await fetch('https://api.replicate.com/v1/predictions', {
        method: 'POST',
        headers: {
          'Authorization': `Token ${env.REPLICATE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          version: 'a8c7ea67-c9ab-4f71-ac84-4036af08734b',
          input: {
            image,
            prompt,
            num_frames,
            guidance_scale,
            num_inference_steps,
          },
        }),
      });

      const data = await response.json();
      
      // Poll for completion
      let prediction = data;
      while (prediction.status !== 'succeeded' && prediction.status !== 'failed') {
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const statusResponse = await fetch(
          `https://api.replicate.com/v1/predictions/${prediction.id}`,
          {
            headers: {
              'Authorization': `Token ${env.REPLICATE_API_KEY}`,
            },
          }
        );
        prediction = await statusResponse.json();
      }

      return new Response(JSON.stringify({ output: prediction.output }), {
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  },
};
```

## 🔧 Configuration Steps

### 1. Choose Your Backend Option
Pick one of the options above based on your deployment:
- **Vercel/Next.js**: Option 1 (API Route)
- **Traditional Server**: Option 2 (Express)
- **Serverless**: Option 3 (Cloudflare Worker)

### 2. Set Environment Variables

**`.env` file:**
```bash
REPLICATE_API_KEY=r8_your_api_key_here
```

**Get your Replicate API key:**
1. Sign up at https://replicate.com
2. Go to https://replicate.com/account/api-tokens
3. Create a new token
4. Copy and paste into `.env`

### 3. Update Frontend Code

**File:** `src/services/replicateService.ts`

Replace the `generateVideoFromImage` function to use your proxy:

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

    console.log('[generateVideoFromImage] Starting Seedance generation');

    onProgress?.('Generating video with Replicate Seedance...');

    // Call your backend proxy instead of Replicate directly
    const response = await fetch('/api/replicate-proxy', {
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
      throw new Error(`Proxy request failed: ${response.statusText}`);
    }

    const { output, error } = await response.json();
    
    if (error) {
      throw new Error(error);
    }

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
    throw new Error(`Video generation failed: ${error.message || 'Unknown error'}`);
  }
};
```

### 4. Enable Replicate in Component

**File:** `src/Component.tsx`

Change line 642:
```typescript
const useReplicate = true; // Enable video-based generation
```

### 5. Test

1. Restart your development server
2. Upload a reference image
3. Generate a sprite sheet
4. You should see:
   - "Generating video with Replicate Seedance..." status
   - "Extracting all frames from video (150 frames)..." status
   - "Frame Gallery (150)" button appears
   - Perfect frame alignment

## 📊 Cost Considerations

**Replicate Pricing:**
- Seedance model: ~$0.01-0.02 per generation
- 5-second video generation takes ~60-120 seconds
- Pay per second of compute time

**Gemini Pricing:**
- Free tier: 15 requests per minute
- Paid tier: $0.00025 per image
- Generation takes ~10-20 seconds

**Recommendation:**
- Use Gemini for quick iterations and testing
- Use Replicate for final, production-quality sprites

## 🐛 Troubleshooting

### "CORS Error" in Browser Console
- ✅ Backend proxy is working correctly (this is expected)
- ❌ Still getting CORS error → Check proxy configuration

### "REPLICATE_API_KEY_MISSING"
- Check `.env` file has `REPLICATE_API_KEY=...`
- Restart development server after adding env variable
- Verify API key is valid at replicate.com

### "Video generation failed"
- Check Replicate account has credits
- Check API key permissions
- Check backend proxy logs for errors

### "Frame Gallery button not showing"
- Verify `useReplicate = true` in Component.tsx
- Check console for `allExtractedFrames` state
- Verify generation completed successfully

## 🎉 Success Indicators

When Replicate is working correctly, you'll see:

1. **Console logs:**
   ```
   [generateVideoFromImage] Starting Seedance generation
   [generateVideoFromImage] Video downloaded, size: 2456789 bytes
   [generateSpriteSheetFromImage] Extracted 150 total frames
   [Frame Selection] Progress: 30/30
   [FrameCentering] Centering 30 frames
   ```

2. **UI indicators:**
   - Status: "Generating video with Replicate Seedance..."
   - Status: "Extracting all frames from video (150 frames)..."
   - Status: "Selecting optimal frames for smooth animation..."
   - Status: "Centering character frames for smooth animation..."
   - Button: "Frame Gallery (150)" appears in toolbar

3. **Perfect alignment:**
   - All sprites centered in their cells
   - No scattered or misaligned frames
   - Smooth animation in preview

## 📚 Related Documentation

- `FRAME_SELECTION_IMPLEMENTATION.md` - Frame selection system
- `PERSISTENT_FRAME_STORAGE.md` - Frame storage in IndexedDB
- `FRAME_GALLERY_USER_GUIDE.md` - Using the Frame Gallery
- `src/services/replicateService.ts` - Replicate service code

---

**Note:** Enabling Replicate requires a backend proxy due to browser CORS restrictions. This is a one-time setup that unlocks professional-quality sprite generation with perfect alignment!

