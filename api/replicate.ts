/**
 * Vercel Serverless Function - Replicate API Proxy
 *
 * This function acts as a proxy to the Replicate API to solve CORS issues
 * when calling from the browser. Users provide their own API keys which are
 * forwarded to Replicate securely.
 *
 * SECURITY: User API keys are passed in request body, validated, and used
 * only for this single request. Keys are never stored on the server.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';

// CORS headers for browser requests
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*', // In production, lock this down to your domain
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400',
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers for all responses
  Object.entries(CORS_HEADERS).forEach(([key, value]) => {
    res.setHeader(key, value);
  });

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({
      error: 'Method not allowed',
      message: 'This endpoint only accepts POST requests'
    });
  }

  try {
    const { action, apiKey, model, input, predictionId } = req.body;

    // Validate API key
    if (!apiKey || typeof apiKey !== 'string') {
      return res.status(400).json({
        error: 'Missing API key',
        message: 'Please provide your Replicate API key'
      });
    }

    // Validate API key format (Replicate keys start with r8_)
    if (!apiKey.startsWith('r8_')) {
      return res.status(400).json({
        error: 'Invalid API key format',
        message: 'Replicate API keys should start with "r8_"'
      });
    }

    let response;
    let result;

    switch (action) {
      case 'create':
        // Create a new prediction
        if (!model || !input) {
          return res.status(400).json({
            error: 'Missing parameters',
            message: 'model and input are required for create action'
          });
        }

        response = await fetch('https://api.replicate.com/v1/predictions', {
          method: 'POST',
          headers: {
            'Authorization': `Token ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            version: model,
            input: input,
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('[Replicate Proxy] Create prediction failed:', response.status, errorText);
          return res.status(response.status).json({
            error: 'Replicate API error',
            message: `Failed to create prediction: ${response.statusText}`,
            details: errorText
          });
        }

        result = await response.json();
        return res.status(200).json(result);

      case 'get':
        // Get prediction status/result
        if (!predictionId) {
          return res.status(400).json({
            error: 'Missing parameter',
            message: 'predictionId is required for get action'
          });
        }

        response = await fetch(
          `https://api.replicate.com/v1/predictions/${predictionId}`,
          {
            headers: {
              'Authorization': `Token ${apiKey}`,
              'Content-Type': 'application/json',
            },
          }
        );

        if (!response.ok) {
          const errorText = await response.text();
          console.error('[Replicate Proxy] Get prediction failed:', response.status, errorText);
          return res.status(response.status).json({
            error: 'Replicate API error',
            message: `Failed to get prediction: ${response.statusText}`,
            details: errorText
          });
        }

        result = await response.json();
        return res.status(200).json(result);

      case 'cancel':
        // Cancel a prediction
        if (!predictionId) {
          return res.status(400).json({
            error: 'Missing parameter',
            message: 'predictionId is required for cancel action'
          });
        }

        response = await fetch(
          `https://api.replicate.com/v1/predictions/${predictionId}/cancel`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Token ${apiKey}`,
              'Content-Type': 'application/json',
            },
          }
        );

        if (!response.ok) {
          const errorText = await response.text();
          console.error('[Replicate Proxy] Cancel prediction failed:', response.status, errorText);
          return res.status(response.status).json({
            error: 'Replicate API error',
            message: `Failed to cancel prediction: ${response.statusText}`,
            details: errorText
          });
        }

        result = await response.json();
        return res.status(200).json(result);

      default:
        return res.status(400).json({
          error: 'Invalid action',
          message: 'Action must be one of: create, get, cancel'
        });
    }

  } catch (error: any) {
    console.error('[Replicate Proxy] Error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message || 'An unexpected error occurred'
    });
  }
}

// Set CORS headers for all responses
export const config = {
  api: {
    bodyParser: true,
  },
};
