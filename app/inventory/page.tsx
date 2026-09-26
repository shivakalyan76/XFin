'use client';

import { useMemo } from 'react';
import { useBusiness } from '@/lib/businessStore';
import { analyzeInventory } from '@/lib/riskEngine';
import { Card } from '@/components/Card';
import { inr } from '@/lib/format';
import AIAdvisorPanel from '@/components/AIAdvisorPanel';
import clsx from 'clsx';

export default function InventoryPage() {
  const { business } = useBusiness();
  const inv = useMemo(() => analyzeInventory(business), [business]);

  const riskColor = {
    low: 'text-ok bg-green-50 border-green-200',
    medium: 'text-warn bg-amber-50 border-amber-200',
    high: 'text-danger bg-red-50 border-red-200',
  }[inv.riskLevel];

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-xl font-bold text-gray-900">Inventory Intelligence</h1>
        <p className="text-sm text-gray-400">How much cash is sitting on the shelf instead of in the bank.</p>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <div className="text-xs text-gray-400">Inventory Value</div>
          <div className="text-xl font-bold mt-1 text-gray-900">{inr(inv.inventoryValue)}</div>
        </Card>
        <Card>
          <div className="text-xs text-gray-400">Avg. Turnover Time</div>
          <div className="text-xl font-bold mt-1 text-gray-900">{inv.turnoverDays} days</div>
        </Card>
        <Card>
          <div className="text-xs text-gray-400">Inventory / Revenue</div>
          <div className={clsx('inline-block mt-1 px-2.5 py-1 rounded-full text-sm font-semibold border', riskColor)}>
            {inv.inventoryToRevenueRatio}x · {inv.riskLevel} risk
          </div>
        </Card>
      </div>

      <Card title="What this means">
        <p className="text-sm text-gray-600 leading-relaxed">
          Inventory currently takes about <span className="font-semibold">{inv.turnoverDays} days</span> to convert
          into a sale. The longer this number, the more cash is locked in stock rather than available for
          operations. Compare this against your industry norm to see if you're over-stocking.
        </p>
      </Card>

      <AIAdvisorPanel context="inventory" />
    </div>
  );
}
