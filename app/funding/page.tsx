'use client';

import { useMemo } from 'react';
import { useBusiness } from '@/lib/businessStore';
import { computeFundingRequirement, computeMetrics, computeEMI } from '@/lib/financialEngine';
import { Card } from '@/components/Card';
import { inr } from '@/lib/format';
import AIAdvisorPanel from '@/components/AIAdvisorPanel';

export default function FundingPage() {
  const { business } = useBusiness();
  const funding = useMemo(() => computeFundingRequirement(business, 6), [business]);
  const metrics = useMemo(() => computeMetrics(business), [business]);

  // Illustrative funding options at different tenures for the recommended amount
  const amount = funding.requiredFunding || 200000;
  const options = [12, 24, 36].map((tenure) => ({
    tenure,
    rate: 13.5,
    emi: computeEMI(amount, 13.5, tenure),
  }));

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-xl font-bold text-gray-900">Smart Funding Advisor</h1>
        <p className="text-sm text-gray-400">Based on your 6-month cash flow forecast, here's what funding could look like.</p>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <div className="text-xs text-gray-400">Lowest Forecasted Cash</div>
          <div className={`text-xl font-bold mt-1 ${funding.lowestPoint < 0 ? 'text-danger' : 'text-gray-900'}`}>
            {inr(funding.lowestPoint)}
          </div>
        </Card>
        <Card>
          <div className="text-xs text-gray-400">Recommended Funding</div>
          <div className="text-xl font-bold mt-1 text-brand-600">{inr(amount)}</div>
        </Card>
        <Card>
          <div className="text-xs text-gray-400">Current EMI Load</div>
          <div className="text-xl font-bold mt-1 text-gray-900">{inr(metrics.emi)}/mo</div>
        </Card>
      </div>

      <Card
        title="Illustrative Repayment Options"
        subtitle="Assuming a representative 13.5% p.a. interest rate — actual rates depend on your lender"
      >
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-400 border-b border-gray-100">
              <th className="py-2 font-medium">Tenure</th>
              <th className="py-2 font-medium text-right">Est. Monthly EMI</th>
              <th className="py-2 font-medium text-right">Total Repayment</th>
            </tr>
          </thead>
          <tbody>
            {options.map((o) => (
              <tr key={o.tenure} className="border-b border-gray-50 last:border-0">
                <td className="py-2 text-gray-700">{o.tenure} months</td>
                <td className="py-2 text-right font-semibold text-gray-900">{inr(o.emi)}</td>
                <td className="py-2 text-right text-gray-600">{inr(o.emi * o.tenure)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="text-[11px] text-gray-400 mt-3">
          These figures use the standard reducing-balance EMI formula and are for planning purposes only — this is
          not a loan offer or approval.
        </p>
      </Card>

      <AIAdvisorPanel context="funding" />
    </div>
  );
}
