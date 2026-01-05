// Service for interacting with Gemini (or other LLM services)

export const systemPrompt = `You are Woujamind, a helpful assistant specialized in generating sprite prompts and metadata.`;

export async function callGemini(prompt: string, options: Record<string, any> = {}) {
  // Placeholder implementation: integrate with actual Gemini/LLM client in production
  const fullPrompt = `${systemPrompt}\nUser: ${prompt}`;

  // Simulated API call — replace with real HTTP/fetch/SDK call
  return {
    prompt: fullPrompt,
    response: 'Simulated response from Woujamind service',
  };
}
