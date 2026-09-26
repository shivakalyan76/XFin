import clsx from 'clsx';
import { AlertTriangle, AlertCircle, Info } from 'lucide-react';
import { Alert, HealthScoreResult } from '@/lib/types';

export function ScoreBadge({ band }: { band: HealthScoreResult['band'] }) {
  const styles: Record<HealthScoreResult['band'], string> = {
    Excellent: 'bg-green-50 text-ok border-green-200',
    Good: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    Fair: 'bg-amber-50 text-warn border-amber-200',
    Weak: 'bg-orange-50 text-orange-600 border-orange-200',
    Critical: 'bg-red-50 text-danger border-red-200',
  };
  return (
    <span className={clsx('px-2.5 py-1 rounded-full text-xs font-semibold border', styles[band])}>{band}</span>
  );
}

export function AlertList({ alerts }: { alerts: Alert[] }) {
  if (alerts.length === 0) {
    return <p className="text-sm text-gray-400">No active risk alerts. Your business looks stable.</p>;
  }
  return (
    <div className="space-y-2">
      {alerts.map((a) => (
        <div
          key={a.id}
          className={clsx(
            'flex gap-3 p-3 rounded-xl border text-sm',
            a.severity === 'critical' && 'bg-red-50 border-red-200',
            a.severity === 'warning' && 'bg-amber-50 border-amber-200',
            a.severity === 'info' && 'bg-blue-50 border-blue-200'
          )}
        >
          {a.severity === 'critical' && <AlertCircle className="w-4 h-4 text-danger shrink-0 mt-0.5" />}
          {a.severity === 'warning' && <AlertTriangle className="w-4 h-4 text-warn shrink-0 mt-0.5" />}
          {a.severity === 'info' && <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />}
          <div>
            <div className="font-semibold text-gray-900">{a.title}</div>
            <div className="text-gray-500 text-xs mt-0.5">{a.detail}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
