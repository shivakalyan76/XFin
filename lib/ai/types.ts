export interface AIResponse {
  answer: string;
  provider: 'gemini' | 'demo' | 'lyra';
  model?: string;
  isFallback?: boolean;
  error?: string;
}

export interface AIProvider {
  readonly name: 'gemini' | 'demo' | 'lyra';
  ask(question: string, context: unknown): Promise<AIResponse>;
}
