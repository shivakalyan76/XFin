'use client';

import { useMemo } from 'react';
import { useBusiness } from '@/lib/businessStore';
import { analyzeReceivables } from '@/lib/riskEngine';
import { Card } from '@/components/Card';
import { inr } from '@/lib/format';
import AIAdvisorPanel from '@/components/AIAdvisorPanel';
import clsx from 'clsx';

export default function ReceivablesPage() {
  const { business } = useBusiness();
  const r = useMemo(() => analyzeReceivables(business), [business]);

  const riskColor = {
    low: 'text-ok bg-green-50 border-green-200',
    medium: 'text-warn bg-amber-50 border-amber-200',
    high: 'text-danger bg-red-50 border-red-200',
  }[r.riskLevel];

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-xl font-bold text-gray-900">Receivables Intelligence</h1>
        <p className="text-sm text-gray-400">How much cash is tied up waiting on customer payments.</p>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <div className="text-xs text-gray-400">Outstanding Receivables</div>
          <div className="text-xl font-bold mt-1 text-gray-900">{inr(r.receivables)}</div>
        </Card>
        <Card>
          <div className="text-xs text-gray-400">Avg. Days to Collect</div>
          <div className="text-xl font-bold mt-1 text-gray-900">{r.avgReceivableDays} days</div>
        </Card>
        <Card>
          <div className="text-xs text-gray-400">Receivables / Revenue</div>
          <div className="text-xl font-bold mt-1 text-gray-900">{r.receivableToRevenueRatio}x</div>
        </Card>
        <Card>
          <div className="text-xs text-gray-400">Risk Level</div>
          <div className={clsx('inline-block mt-1 px-2.5 py-1 rounded-full text-sm font-semibold border capitalize', riskColor)}>
            {r.riskLevel}
          </div>
        </Card>
      </div>

      <Card title="What this means">
        <p className="text-sm text-gray-600 leading-relaxed">
          Roughly <span className="font-semibold">{inr(r.estimatedCashStuck)}</span> is estimated to be tied up in
          unpaid customer invoices right now based on your average collection period. Reducing your average
          collection time directly frees up cash without needing new financing.
        </p>
      </Card>

      <AIAdvisorPanel context="receivables" />
    </div>
  );
}
