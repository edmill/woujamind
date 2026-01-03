/**
 * Simple Express server to proxy Replicate API calls
 * Solves CORS issues when calling Replicate from browser
 * 
 * Usage:
 *   1. npm install express cors replicate dotenv
 *   2. Add REPLICATE_API_KEY to .env
 *   3. node server/replicate-proxy.js
 *   4. Set useReplicate = true in Component.tsx
 */

import express from 'express';
import cors from 'cors';
import Replicate from 'replicate';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PROXY_PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' })); // Large limit for base64 images

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Replicate proxy server is running' });
});

// Replicate proxy endpoint
app.post('/api/replicate-proxy', async (req, res) => {
  try {
    const { image, prompt, num_frames, guidance_scale, num_inference_steps, apiKey } = req.body;

    console.log('[Replicate Proxy] Starting Seedance generation');
    console.log('[Replicate Proxy] Prompt:', prompt?.substring(0, 100) + '...');
    console.log('[Replicate Proxy] Frames:', num_frames);

    // Use API key from request body (frontend localStorage) or environment variable
    const replicateApiKey = apiKey || process.env.REPLICATE_API_KEY;
    
    if (!replicateApiKey) {
      throw new Error('REPLICATE_API_KEY_MISSING: No API key provided in request or environment');
    }

    // Create Replicate client with the provided API key
    const replicateClient = new Replicate({
      auth: replicateApiKey,
    });

    console.log('[Replicate Proxy] Creating prediction...');

    // Create prediction using predictions API
    const prediction = await replicateClient.predictions.create({
      model: "bytedance/seedance-1-pro-fast",
      input: {
        image,
        prompt,
        num_frames: num_frames || 150,
        guidance_scale: guidance_scale || 7.5,
        num_inference_steps: num_inference_steps || 20,
      }
    });

    console.log('[Replicate Proxy] Prediction created:', prediction.id);
    console.log('[Replicate Proxy] Status:', prediction.status);

    // Wait for completion
    let finalPrediction = prediction;
    while (finalPrediction.status !== 'succeeded' && finalPrediction.status !== 'failed' && finalPrediction.status !== 'canceled') {
      await new Promise(resolve => setTimeout(resolve, 1000));
      finalPrediction = await replicateClient.predictions.get(prediction.id);
      console.log('[Replicate Proxy] Status:', finalPrediction.status);
    }

    if (finalPrediction.status === 'failed') {
      throw new Error(`Prediction failed: ${finalPrediction.error || 'Unknown error'}`);
    }

    if (finalPrediction.status === 'canceled') {
      throw new Error('Prediction was canceled');
    }

    console.log('[Replicate Proxy] Generation complete');
    console.log('[Replicate Proxy] Output type:', typeof finalPrediction.output);
    console.log('[Replicate Proxy] Output:', JSON.stringify(finalPrediction.output, null, 2));

    res.json({ output: finalPrediction.output });
  } catch (error) {
    console.error('[Replicate Proxy] Error:', error);
    res.status(500).json({ 
      error: error.message || 'Unknown error',
      details: error.toString()
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════════════╗
║  Replicate Proxy Server                                    ║
║  Running on: http://localhost:${PORT}                        ║
║  Health check: http://localhost:${PORT}/health              ║
║  Proxy endpoint: http://localhost:${PORT}/api/replicate-proxy ║
╚════════════════════════════════════════════════════════════╝
  `);
  
  if (!process.env.REPLICATE_API_KEY) {
    console.log('ℹ️  No REPLICATE_API_KEY in .env file');
    console.log('   API key will be passed from frontend (localStorage)');
    console.log('   Or add REPLICATE_API_KEY=r8_your_key_here to .env');
  } else {
    console.log('✅ Replicate API key loaded from .env');
  }
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
  });
});

