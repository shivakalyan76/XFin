'use client';

import { useMemo, useState } from 'react';
import { useBusiness } from '@/lib/businessStore';
import { applyWhatIf, computeMetrics, forecastCashFlow } from '@/lib/financialEngine';
import { WhatIfScenarioInput, WhatIfResult } from '@/lib/types';
import { Card } from '@/components/Card';
import { inr } from '@/lib/format';
import AIAdvisorPanel from '@/components/AIAdvisorPanel';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';

type PresetKey = 'salesDrop' | 'latePay' | 'machine' | 'financing' | 'inventory' | 'custom';

const PRESETS: { key: PresetKey; label: string; scenario: WhatIfScenarioInput }[] = [
  { key: 'salesDrop', label: 'Sales decrease by 20%', scenario: { salesChangePct: -20 } },
  { key: 'latePay', label: 'Customer pays 30 days late', scenario: { extraLatePaymentDays: 30 } },
  { key: 'machine', label: 'Buy a ₹2,00,000 machine', scenario: { machinePurchase: 200000 } },
  {
    key: 'financing',
    label: 'Take ₹3,00,000 financing',
    scenario: { newFinancing: 300000, newFinancingRatePct: 13.5, newFinancingTenureMonths: 24 },
  },
  { key: 'inventory', label: 'Inventory increases by ₹1,00,000', scenario: { inventoryIncrease: 100000 } },
];

export default function SimulatorPage() {
  const { business } = useBusiness();
  const [selected, setSelected] = useState<PresetKey>('salesDrop');
  const [scenario, setScenario] = useState<WhatIfScenarioInput>(PRESETS[0].scenario);

  const result: WhatIfResult = useMemo(() => {
    const baseline = computeMetrics(business);
    const scenarioInputs = applyWhatIf(business, scenario);
    const scenarioMetrics = computeMetrics(scenarioInputs);

    const overrides = {
      revenueMultiplier: scenario.salesChangePct ? 1 + scenario.salesChangePct / 100 : 1,
      extraReceivableDays: scenario.extraLatePaymentDays ?? 0,
      oneTimeCapexMonth1: scenario.machinePurchase ?? 0,
      oneTimeFinancingMonth1: scenario.newFinancing ?? 0,
      extraEmi:
        scenario.newFinancing && scenario.newFinancingRatePct && scenario.newFinancingTenureMonths
          ? computeMetrics(scenarioInputs).emi - baseline.emi
          : 0,
      inventoryDelta: scenario.inventoryIncrease ?? 0,
    };

    const forecastBaseline = forecastCashFlow(business, 6);
    const forecastScenario = forecastCashFlow(business, 6, overrides);

    const cashDeltaMonth1 = forecastScenario[0].cumulativeCash - forecastBaseline[0].cumulativeCash;

    let verdict = 'This scenario has a modest impact on your cash position.';
    const finalDelta = forecastScenario[5].cumulativeCash - forecastBaseline[5].cumulativeCash;
    if (finalDelta < -100000) verdict = 'This scenario significantly weakens your cash position over 6 months.';
    else if (finalDelta < 0) verdict = 'This scenario slightly weakens your cash position.';
    else if (finalDelta > 100000) verdict = 'This scenario significantly strengthens your cash position.';
    else if (finalDelta > 0) verdict = 'This scenario slightly improves your cash position.';

    return {
      baseline,
      scenario: scenarioMetrics,
      cashDeltaMonth1,
      verdict,
      forecastBaseline,
      forecastScenario,
    };
  }, [business, scenario]);

  const chartData = result.forecastBaseline.map((b, i) => ({
    month: b.month,
    baseline: b.cumulativeCash,
    scenario: result.forecastScenario[i].cumulativeCash,
  }));

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-xl font-bold text-gray-900">What-If Business Simulator</h1>
        <p className="text-sm text-gray-400">Test decisions before you make them. All numbers recompute instantly.</p>
      </header>

      <Card title="Choose a scenario">
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((p) => (
            <button
              key={p.key}
              onClick={() => {
                setSelected(p.key);
                setScenario(p.scenario);
              }}
              className={`text-xs px-3 py-2 rounded-xl font-medium border transition-colors ${
                selected === p.key
                  ? 'bg-brand-600 border-brand-600 text-white'
                  : 'bg-white border-gray-200 text-gray-600 hover:border-brand-300'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <div className="text-xs text-gray-400">Baseline Profit</div>
          <div className="text-lg font-bold mt-1 text-gray-900">{inr(result.baseline.profit)}</div>
        </Card>
        <Card>
          <div className="text-xs text-gray-400">Scenario Profit</div>
          <div className={`text-lg font-bold mt-1 ${result.scenario.profit >= result.baseline.profit ? 'text-ok' : 'text-danger'}`}>
            {inr(result.scenario.profit)}
          </div>
        </Card>
        <Card>
          <div className="text-xs text-gray-400">6-Month Cash Impact</div>
          <div
            className={`text-lg font-bold mt-1 ${
              result.forecastScenario[5].cumulativeCash - result.forecastBaseline[5].cumulativeCash >= 0
                ? 'text-ok'
                : 'text-danger'
            }`}
          >
            {inr(result.forecastScenario[5].cumulativeCash - result.forecastBaseline[5].cumulativeCash)}
          </div>
        </Card>
      </div>

      <Card title="Baseline vs Scenario — Cumulative Cash">
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#94a3b8" />
            <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
            <Tooltip formatter={(v: number) => inr(v)} />
            <Legend />
            <Line type="monotone" dataKey="baseline" stroke="#94a3b8" strokeWidth={2} name="Baseline" strokeDasharray="4 4" />
            <Line type="monotone" dataKey="scenario" stroke="#4f46e5" strokeWidth={2.5} name="Scenario" />
          </LineChart>
        </ResponsiveContainer>
        <p className="text-sm text-gray-600 mt-3 font-medium">{result.verdict}</p>
      </Card>

      <AIAdvisorPanel context="what-if simulator" whatIf={result} />
    </div>
  );
}
