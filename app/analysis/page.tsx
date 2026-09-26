'use client';

import { useMemo } from 'react';
import { useBusiness } from '@/lib/businessStore';
import { computeMetrics } from '@/lib/financialEngine';
import { computeHealthScore } from '@/lib/riskEngine';
import { Card } from '@/components/Card';
import { ScoreBadge } from '@/components/RiskBadge';
import { inr, pct } from '@/lib/format';

export default function AnalysisPage() {
  const { business } = useBusiness();
  const metrics = useMemo(() => computeMetrics(business), [business]);
  const health = useMemo(() => computeHealthScore(business), [business]);

  const rows: { label: string; value: string }[] = [
    { label: 'Revenue', value: inr(metrics.revenue) },
    { label: 'Expenses', value: inr(metrics.expenses) },
    { label: 'Profit', value: inr(metrics.profit) },
    { label: 'Profit Margin', value: pct(metrics.profitMarginPct) },
    { label: 'Cash on Hand', value: inr(metrics.cash) },
    { label: 'Receivables', value: inr(metrics.receivables) },
    { label: 'Payables', value: inr(metrics.payables) },
    { label: 'Inventory', value: inr(metrics.inventory) },
    { label: 'Outstanding Debt', value: inr(metrics.debt) },
    { label: 'Estimated EMI', value: inr(metrics.emi) },
    { label: 'Working Capital', value: inr(metrics.workingCapital) },
    { label: 'Net Cash Position', value: inr(metrics.netCashPosition) },
    { label: 'Cash Runway (if burning)', value: metrics.burnMonths === null ? 'N/A - not burning' : `${metrics.burnMonths} months` },
  ];

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-xl font-bold text-gray-900">Financial Analysis</h1>
        <p className="text-sm text-gray-400">All figures below are computed deterministically by the Financial Engine.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Core Metrics">
          <table className="w-full text-sm">
            <tbody>
              {rows.map((r) => (
                <tr key={r.label} className="border-b border-gray-50 last:border-0">
                  <td className="py-2 text-gray-500">{r.label}</td>
                  <td className="py-2 text-right font-semibold text-gray-900 tabular-nums">{r.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        <Card
          title="Financial Health Score"
          action={<ScoreBadge band={health.band} />}
          subtitle={`${health.score} / 100 — transparent rule-based scoring`}
        >
          <div className="space-y-3">
            {health.components.map((c) => (
              <div key={c.label}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-medium text-gray-600">{c.label}</span>
                  <span className="text-gray-400">
                    {c.score.toFixed(1)} / {c.weight}
                  </span>
                </div>
                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-brand-600 rounded-full"
                    style={{ width: `${(c.score / c.weight) * 100}%` }}
                  />
                </div>
                <p className="text-[11px] text-gray-400 mt-1">{c.note}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
