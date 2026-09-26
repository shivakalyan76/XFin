import { AIProvider, AIResponse } from './types';

const SYSTEM_PROMPT = `You are XFin, an AI-powered financial and business decision-support assistant for micro and small businesses.

You will receive ALREADY-CALCULATED ground-truth financial metrics, a health score, active risk alerts, cash flow projections, and optional what-if scenario comparisons. These figures are computed deterministically by the financial engine. 

Rules:
1. Do NOT recalculate, second-guess, or invent financial figures. Only reference the figures provided in the context.
2. Explain the business's situation in simple, direct, non-jargon language suitable for a small shop, trader, or manufacturer.
3. Highlight the most urgent financial and liquidity risks first.
4. Provide 2-4 concrete, actionable next steps (e.g. specific collection targets, inventory adjustments, or supplier renegotiations using actual figures).
5. Always use Indian Rupees (₹) for currency amounts, matching the provided figures.
6. If what-if simulation data is included, explain whether the decision strengthens or strains cash flow and why.
7. Keep responses concise and formatted with short paragraphs or bullet points.
8. Never claim to certify loans, approve funding, or guarantee financial outcomes. This is advisory guidance.`;

export class GeminiProvider implements AIProvider {
  readonly name = 'gemini' as const;

  async ask(question: string, context: unknown): Promise<AIResponse> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not configured in environment.');
    }

    const configuredModel = process.env.GEMINI_MODEL;
    const defaultModels = ['gemini-3.5-flash-lite', 'gemini-3.5-flash', 'gemini-flash-latest', 'gemini-3.8-flash'];
    const modelsToTry = configuredModel
      ? [configuredModel, ...defaultModels.filter((m) => m !== configuredModel)]
      : defaultModels;

    const userContent = `BUSINESS FINANCIAL CONTEXT (already calculated ground truth, do not recompute):\n${JSON.stringify(
      context,
      null,
      2
    )}\n\nOWNER'S QUESTION: ${question}`;

    const requestBody = {
      systemInstruction: {
        parts: [{ text: SYSTEM_PROMPT }],
      },
      contents: [
        {
          role: 'user',
          parts: [{ text: userContent }],
        },
      ],
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 1000,
      },
    };

    let lastError: Error | null = null;

    for (const model of modelsToTry) {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;

      for (let attempt = 1; attempt <= 2; attempt++) {
        try {
          const response = await fetch(url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody),
          });

          if (!response.ok) {
            const errText = await response.text();
            let safeErrorMsg = `Gemini API (${model}) responded with status ${response.status}`;
            try {
              const parsed = JSON.parse(errText);
              if (parsed.error?.message) {
                safeErrorMsg += `: ${parsed.error.message}`;
              }
            } catch {
              // use status
            }

            if ((response.status === 503 || response.status === 429) && attempt < 2) {
              await new Promise((resolve) => setTimeout(resolve, 1000));
              continue;
            }

            lastError = new Error(safeErrorMsg);
            break; // Break inner retry loop to try next model
          }

          const data = await response.json();
          const candidate = data.candidates?.[0];
          const parts = candidate?.content?.parts ?? [];
          const text = parts
            .map((p: { text?: string }) => p.text || '')
            .filter(Boolean)
            .join('\n')
            .trim();

          if (!text) {
            lastError = new Error(`Gemini API (${model}) returned an empty response.`);
            break;
          }

          return {
            answer: text,
            provider: 'gemini',
            model,
          };
        } catch (err) {
          lastError = err instanceof Error ? err : new Error(String(err));
          if (attempt < 2) {
            await new Promise((resolve) => setTimeout(resolve, 1000));
          }
        }
      }
    }

    throw lastError || new Error('Gemini query failed after model fallback attempts.');
  }
}

