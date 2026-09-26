'use client';

import { useMemo } from 'react';
import { useBusiness } from '@/lib/businessStore';
import { forecastCashFlow, computeFundingRequirement } from '@/lib/financialEngine';
import { Card } from '@/components/Card';
import { inr } from '@/lib/format';
import AIAdvisorPanel from '@/components/AIAdvisorPanel';
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';

export default function CashFlowPage() {
  const { business } = useBusiness();
  const forecast = useMemo(() => forecastCashFlow(business, 6), [business]);
  const funding = useMemo(() => computeFundingRequirement(business, 6), [business]);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-xl font-bold text-gray-900">Cash Flow Forecast</h1>
        <p className="text-sm text-gray-400">6-month projection based on current revenue, expenses, and collection speed.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card>
          <div className="text-xs text-gray-400">Lowest projected cash point</div>
          <div className={`text-xl font-bold mt-1 ${funding.lowestPoint < 0 ? 'text-danger' : 'text-gray-900'}`}>
            {inr(funding.lowestPoint)}
          </div>
        </Card>
        <Card>
          <div className="text-xs text-gray-400">Recommended safety buffer</div>
          <div className="text-xl font-bold mt-1 text-gray-900">{inr(funding.safetyBuffer)}</div>
        </Card>
        <Card>
          <div className="text-xs text-gray-400">Funding needed to stay safe</div>
          <div className={`text-xl font-bold mt-1 ${funding.requiredFunding > 0 ? 'text-warn' : 'text-ok'}`}>
            {funding.requiredFunding > 0 ? inr(funding.requiredFunding) : 'None needed'}
          </div>
        </Card>
      </div>

      <Card title="Monthly Inflow vs Outflow">
        <ResponsiveContainer width="100%" height={300}>
          <ComposedChart data={forecast}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#94a3b8" />
            <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
            <Tooltip formatter={(v: number) => inr(v)} />
            <Legend />
            <Bar dataKey="inflow" fill="#16a34a" name="Inflow" radius={[4, 4, 0, 0]} />
            <Bar dataKey="outflow" fill="#dc2626" name="Outflow" radius={[4, 4, 0, 0]} />
            <Line type="monotone" dataKey="cumulativeCash" stroke="#4f46e5" strokeWidth={2} name="Cumulative Cash" />
          </ComposedChart>
        </ResponsiveContainer>
      </Card>

      <Card title="Month-by-Month Detail">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-400 border-b border-gray-100">
              <th className="py-2 font-medium">Month</th>
              <th className="py-2 font-medium text-right">Inflow</th>
              <th className="py-2 font-medium text-right">Outflow</th>
              <th className="py-2 font-medium text-right">Net</th>
              <th className="py-2 font-medium text-right">Cumulative Cash</th>
            </tr>
          </thead>
          <tbody>
            {forecast.map((f) => (
              <tr key={f.month} className="border-b border-gray-50 last:border-0">
                <td className="py-2 font-medium text-gray-700">{f.month}</td>
                <td className="py-2 text-right text-ok">{inr(f.inflow)}</td>
                <td className="py-2 text-right text-danger">{inr(f.outflow)}</td>
                <td className={`py-2 text-right ${f.netCash >= 0 ? 'text-ok' : 'text-danger'}`}>{inr(f.netCash)}</td>
                <td className={`py-2 text-right font-semibold ${f.cumulativeCash >= 0 ? 'text-gray-900' : 'text-danger'}`}>
                  {inr(f.cumulativeCash)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <AIAdvisorPanel context="cash-flow" />
    </div>
  );
}
