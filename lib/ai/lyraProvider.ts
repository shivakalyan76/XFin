import { AIProvider, AIResponse } from './types';

/**
 * Placeholder for future LYRA model integration.
 * When LYRA is ready, implement the model connection here.
 */
export class LyraProvider implements AIProvider {
  readonly name = 'lyra' as const;

  async ask(question: string, context: unknown): Promise<AIResponse> {
    return {
      answer: `[LYRA Provider Placeholder]\n\nLYRA integration is configured but pending endpoint provisioning. Question received: "${question}". Financial context is fully linked.`,
      provider: 'lyra',
      isFallback: true,
    };
  }
}
