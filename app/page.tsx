'use client';

import { useMemo } from 'react';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  Receipt,
  Boxes,
  Landmark,
  DollarSign,
} from 'lucide-react';
import { useBusiness } from '@/lib/businessStore';
import { computeMetrics, forecastCashFlow } from '@/lib/financialEngine';
import { computeHealthScore, generateAlerts } from '@/lib/riskEngine';
import { inr, pct } from '@/lib/format';
import { Card } from '@/components/Card';
import { MetricCard } from '@/components/MetricCard';
import { ScoreBadge, AlertList } from '@/components/RiskBadge';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import AIAdvisorPanel from '@/components/AIAdvisorPanel';

export default function DashboardPage() {
  const { business, hydrated } = useBusiness();

  const metrics = useMemo(() => computeMetrics(business), [business]);
  const health = useMemo(() => computeHealthScore(business), [business]);
  const alerts = useMemo(() => generateAlerts(business), [business]);
  const forecast = useMemo(() => forecastCashFlow(business, 6), [business]);

  if (!hydrated) return <div className="text-sm text-gray-400">Loading...</div>;

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
        <div>
          <h1 className="text-xl font-bold text-gray-900">{business.businessName || 'Your Business'}</h1>
          <p className="text-sm text-gray-400">{business.industry || 'Set up your business to get started'} · Financial Dashboard</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400">Financial Health</span>
          <ScoreBadge band={health.band} />
          <span className="text-lg font-bold text-gray-900">{health.score}/100</span>
        </div>
      </header>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Revenue (mo)"
          value={inr(metrics.revenue)}
          icon={TrendingUp}
          tone="good"
          trendLabel="Monthly"
        />
        <MetricCard
          label="Expenses (mo)"
          value={inr(metrics.expenses)}
          icon={TrendingDown}
          tone="neutral"
          trendLabel="Monthly"
        />
        <MetricCard
          label="Profit"
          value={inr(metrics.profit)}
          icon={DollarSign}
          tone={metrics.profit >= 0 ? 'good' : 'bad'}
          trendLabel={pct(metrics.profitMarginPct) + ' margin'}
          trend={metrics.profit >= 0 ? 'up' : 'down'}
        />
        <MetricCard
          label="Cash on Hand"
          value={inr(metrics.cash)}
          icon={Wallet}
          tone={metrics.cash > metrics.expenses ? 'good' : 'bad'}
        />
        <MetricCard label="Receivables" value={inr(metrics.receivables)} icon={Receipt} tone="neutral" />
        <MetricCard label="Inventory" value={inr(metrics.inventory)} icon={Boxes} tone="neutral" />
        <MetricCard label="Outstanding Debt" value={inr(metrics.debt)} icon={Landmark} tone="neutral" />
        <MetricCard
          label="Working Capital"
          value={inr(metrics.workingCapital)}
          icon={DollarSign}
          tone={metrics.workingCapital >= 0 ? 'good' : 'bad'}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card title="6-Month Cash Flow Forecast" subtitle="Cumulative cash position" className="lg:col-span-2">
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={forecast}>
              <defs>
                <linearGradient id="cashGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#94a3b8" />
              <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(v: number) => inr(v)} />
              <Area type="monotone" dataKey="cumulativeCash" stroke="#4f46e5" fill="url(#cashGradient)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        <Card title="Risk Alerts" subtitle={`${alerts.length} active alert(s)`}>
          <AlertList alerts={alerts} />
        </Card>
      </div>

      <AIAdvisorPanel context="dashboard" />
    </div>
  );
}
