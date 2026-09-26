import { AIProvider, AIResponse } from './types';

export class DemoProvider implements AIProvider {
  readonly name = 'demo' as const;

  async ask(question: string, context: unknown): Promise<AIResponse> {
    const ctx = (context || {}) as {
      business?: { name?: string; industry?: string };
      metrics?: {
        revenue?: number;
        expenses?: number;
        profit?: number;
        profitMarginPct?: number;
        cash?: number;
        receivables?: number;
        workingCapital?: number;
        emi?: number;
      };
      healthScore?: { score?: number; band?: string };
      alerts?: { title: string; detail: string }[];
    };

    const businessName = ctx.business?.name || 'your business';
    const profit = ctx.metrics?.profit ?? 0;
    const cash = ctx.metrics?.cash ?? 0;
    const receivables = ctx.metrics?.receivables ?? 0;
    const healthBand = ctx.healthScore?.band || 'Fair';
    const healthScore = ctx.healthScore?.score ?? 50;

    let advice = `[Demo Mode - Configure GEMINI_API_KEY in .env.local for live Gemini responses]\n\n`;
    advice += `Financial Assessment for ${businessName} (Health: ${healthBand}, Score: ${healthScore}/100):\n\n`;

    const qLower = question.toLowerCase();

    if (qLower.includes('cash flow') || qLower.includes('short of cash')) {
      advice += `1. **Cash Flow Dynamics:** While your monthly operating profit is ₹${profit.toLocaleString('en-IN')}, cash flow depends heavily on your ₹${receivables.toLocaleString('en-IN')} in customer receivables.\n`;
      advice += `2. **Action Item:** Shorten credit terms with customers or offer a 2% discount for prompt payment within 10 days to unlock trapped liquidity without taking high-interest loans.\n`;
      advice += `3. **Safety Buffer:** Maintain a minimum cash buffer of 1-2 months of operating expenses.`;
    } else if (qLower.includes('risk') || qLower.includes('safe')) {
      advice += `1. **Key Vulnerabilities:** Your primary risk factor is working capital velocity. With ₹${cash.toLocaleString('en-IN')} cash on hand, any payment delay from major customers strains liquidity.\n`;
      advice += `2. **Mitigation:** Implement weekly receivables tracking and align supplier payable schedules with customer payment milestones.`;
    } else if (qLower.includes('machine') || qLower.includes('afford') || qLower.includes('capex')) {
      advice += `1. **Capex Viability:** Direct outright cash purchase could deplete your immediate buffer. Consider equipment financing or asset leasing spread over 24-36 months.\n`;
      advice += `2. **ROI Threshold:** Ensure the new machinery generates incremental monthly gross margin that comfortably exceeds the monthly EMI.`;
    } else if (qLower.includes('funding') || qLower.includes('loan')) {
      advice += `1. **Funding Evaluation:** Check if internal working capital optimization (recovering overdue receivables and reducing slow inventory) can bridge the gap before incurring debt interest.\n`;
      advice += `2. **Debt Service:** Keep total monthly debt obligations (EMI) below 30-40% of operating profit to maintain safety.`;
    } else {
      advice += `1. **Overview:** Current monthly profit is ₹${profit.toLocaleString('en-IN')} with ₹${cash.toLocaleString('en-IN')} liquid cash and ₹${receivables.toLocaleString('en-IN')} in receivables.\n`;
      advice += `2. **Recommendation:** Focus on accelerating customer collections and controlling inventory turnover to strengthen your baseline cash runway.`;
    }

    return {
      answer: advice,
      provider: 'demo',
      isFallback: true,
    };
  }
}
