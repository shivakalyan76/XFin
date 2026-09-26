import { AIProvider, AIResponse } from './types';
import { GeminiProvider } from './geminiProvider';
import { DemoProvider } from './demoProvider';
import { LyraProvider } from './lyraProvider';

export function getAIProvider(): AIProvider {
  const providerType = (process.env.AI_PROVIDER || 'gemini').toLowerCase().trim();

  switch (providerType) {
    case 'gemini':
      return new GeminiProvider();
    case 'lyra':
      return new LyraProvider();
    case 'demo':
    default:
      return new DemoProvider();
  }
}

/**
 * High-level AI invocation helper.
 * Executes the configured provider and gracefully falls back to DemoProvider if the provider fails.
 */
export async function executeAIQuery(question: string, context: unknown): Promise<AIResponse> {
  const provider = getAIProvider();

  try {
    return await provider.ask(question, context);
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.warn(`[XFin] Provider '${provider.name}' failed. Falling back to DemoProvider. Reason: ${errorMsg}`);

    const demo = new DemoProvider();
    const fallbackResponse = await demo.ask(question, context);

    return {
      ...fallbackResponse,
      error: `Notice: Live AI response unavailable (${errorMsg}). Showing local advisory analysis.`,
      isFallback: true,
    };
  }
}
