'use client';

import AIAdvisorPanel from '@/components/AIAdvisorPanel';
import { Card } from '@/components/Card';
import { useBusiness } from '@/lib/businessStore';
import { computeHealthScore, generateAlerts } from '@/lib/riskEngine';
import { ScoreBadge, AlertList } from '@/components/RiskBadge';
import { useMemo } from 'react';

export default function AdvisorPage() {
  const { business } = useBusiness();
  const health = useMemo(() => computeHealthScore(business), [business]);
  const alerts = useMemo(() => generateAlerts(business), [business]);

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">AI Business Advisor</h1>
          <p className="text-sm text-gray-400">Ask anything about {business.businessName || 'your business'}'s finances.</p>
        </div>
        <ScoreBadge band={health.band} />
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <AIAdvisorPanel context="general advisor" />
        </div>
        <Card title="Active Risk Alerts" subtitle="Feeds directly into what the AI sees">
          <AlertList alerts={alerts} />
        </Card>
      </div>
    </div>
  );
}
