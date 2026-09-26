import { NextRequest, NextResponse } from 'next/server';
import { executeAIQuery } from '@/lib/ai/aiProvider';

/**
 * AI ADVISOR ENDPOINT
 * -------------------
 * This route NEVER performs financial math. The client has already computed
 * every number using lib/financialEngine.ts + lib/riskEngine.ts and sends
 * the finished metrics here. The AI provider explains, flags risks,
 * and suggests actions in plain language.
 *
 * Current Provider: Google Gemini (via lib/ai/geminiProvider.ts)
 * Future Swap-in: LYRA (via lib/ai/lyraProvider.ts with AI_PROVIDER=lyra)
 */

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { question, context } = body as { question: string; context: unknown };

    if (!question || !context) {
      console.warn('[Advisor] Request rejected: missing question or context.');
      return NextResponse.json({ error: 'question and context are required' }, { status: 400 });
    }

    const providerType = process.env.AI_PROVIDER || 'gemini';
    const qSnippet = question.length > 60 ? `${question.slice(0, 60)}...` : question;
    console.log(`[Advisor] Request received for: "${qSnippet}"`);
    console.log(`[Advisor] Configured provider: ${providerType}`);
    console.log(`[Advisor] AI request started...`);

    const aiResult = await executeAIQuery(question, context);

    if (aiResult.isFallback) {
      console.log(`[Advisor] Fallback active: ${aiResult.error || 'Demo mode'}`);
    } else {
      console.log(`[Advisor] Gemini request succeeded (model: ${aiResult.model || 'default'})`);
    }

    return NextResponse.json(
      {
        answer: aiResult.answer,
        provider: aiResult.provider,
        model: aiResult.model,
        isFallback: aiResult.isFallback,
        error: aiResult.error,
      },
      { status: 200 }
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[Advisor] Unexpected error processing request:', msg);
    return NextResponse.json({ error: 'Unexpected server error', detail: msg }, { status: 500 });
  }
}
