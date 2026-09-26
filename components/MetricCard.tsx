import clsx from 'clsx';
import { LucideIcon, ArrowUpRight, ArrowDownRight } from 'lucide-react';

export function MetricCard({
  label,
  value,
  icon: Icon,
  trend,
  trendLabel,
  tone = 'neutral',
}: {
  label: string;
  value: string;
  icon: LucideIcon;
  trend?: 'up' | 'down';
  trendLabel?: string;
  tone?: 'neutral' | 'good' | 'bad';
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-gray-400">{label}</span>
        <div
          className={clsx(
            'w-8 h-8 rounded-lg flex items-center justify-center',
            tone === 'good' && 'bg-green-50 text-ok',
            tone === 'bad' && 'bg-red-50 text-danger',
            tone === 'neutral' && 'bg-brand-50 text-brand-600'
          )}
        >
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <div className="mt-3 text-2xl font-bold text-gray-900 tabular-nums">{value}</div>
      {trendLabel && (
        <div
          className={clsx(
            'mt-2 inline-flex items-center gap-1 text-xs font-medium',
            trend === 'up' ? 'text-ok' : trend === 'down' ? 'text-danger' : 'text-gray-400'
          )}
        >
          {trend === 'up' && <ArrowUpRight className="w-3 h-3" />}
          {trend === 'down' && <ArrowDownRight className="w-3 h-3" />}
          {trendLabel}
        </div>
      )}
    </div>
  );
}
