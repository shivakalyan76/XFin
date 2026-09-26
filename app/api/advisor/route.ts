import { NextRequest, NextResponse } from 'next/server';

/**
 * AI ADVISOR ENDPOINT
 * -------------------
 * This route NEVER performs financial math. The client has already computed
 * every number using lib/financialEngine.ts + lib/riskEngine.ts and sends
 * the finished metrics here. Claude's only job is to explain, flag risks,
 * and suggest actions in plain language.
 *
 * Swap-in point for LYRA later: replace callModel() below with a call to
 * your LYRA endpoint. Nothing else in the app needs to change because the
 * request/response contract (question + context -> { answer }) stays the same.
 */

const SYSTEM_PROMPT = `You are BizPilot AI, a financial advisor for micro and small business owners in India.

You will be given ALREADY-CALCULATED financial metrics, a health score, active risk alerts, and sometimes a what-if scenario comparison. These numbers are ground truth — computed by deterministic code. Do NOT recalculate, second-guess, or invent numbers. Only reference the figures you are given.

Your job:
- Explain the business's financial situation in simple, non-jargon language a small shop or trading business owner would understand.
- Identify the most important risks first, in order of severity.
- Suggest 2-4 practical, concrete actions (not generic advice like "manage cash better" — be specific using the numbers given, e.g. "chase the ₹X owed by customers over 60 days").
- If a what-if scenario is included, clearly explain what changes and whether it's a good idea.
- Keep responses concise: prefer short paragraphs and bullet points over long essays.
- Use ₹ (INR) for all currency figures, matching the input data.
- Never claim to guarantee financial or legal outcomes. This is guidance, not certified financial advice.`;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { question, context } = body as { question: string; context: unknown };

    if (!question || !context) {
      return NextResponse.json({ error: 'question and context are required' }, { status: 400 });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        {
          error: 'ANTHROPIC_API_KEY is not set on the server.',
          answer: mockAnswer(question),
        },
        { status: 200 }
      );
    }

    const userMessage = `BUSINESS FINANCIAL CONTEXT (already calculated, do not recompute):\n${JSON.stringify(
      context,
      null,
      2
    )}\n\nOWNER'S QUESTION: ${question}`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-5-20250929',
        max_tokens: 700,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: userMessage }],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      return NextResponse.json({ error: `Anthropic API error: ${errText}` }, { status: 502 });
    }

    const data = await response.json();
    const answer = (data.content ?? [])
      .map((block: { type: string; text?: string }) => (block.type === 'text' ? block.text : ''))
      .filter(Boolean)
      .join('\n');

    return NextResponse.json({ answer: answer || 'No response generated.' });
  } catch (err) {
    return NextResponse.json({ error: 'Unexpected server error', detail: String(err) }, { status: 500 });
  }
}

// Used only when no API key is configured yet, so the demo still works end-to-end.
function mockAnswer(question: string): string {
  return `[Demo mode - add ANTHROPIC_API_KEY to get real AI answers]\n\nYou asked: "${question}"\n\nOnce your API key is set, Claude will read the calculated metrics (profit, cash, receivables, health score, alerts) and explain risks and next steps in plain language here.`;
}
