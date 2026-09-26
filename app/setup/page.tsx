'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useBusiness } from '@/lib/businessStore';
import { BusinessInputs } from '@/lib/types';
import { Card } from '@/components/Card';
import { DEMO_BUSINESS } from '@/lib/mockData';
import { Save, RotateCcw } from 'lucide-react';

const FIELDS: {
  key: keyof BusinessInputs;
  label: string;
  type: 'text' | 'number';
  hint?: string;
}[] = [
  { key: 'businessName', label: 'Business Name', type: 'text' },
  { key: 'industry', label: 'Industry', type: 'text' },
  { key: 'monthsInBusiness', label: 'Months in Business', type: 'number' },
  { key: 'monthlyRevenue', label: 'Monthly Revenue (₹)', type: 'number' },
  { key: 'monthlyExpenses', label: 'Monthly Expenses (₹)', type: 'number' },
  { key: 'cashOnHand', label: 'Cash on Hand (₹)', type: 'number' },
  { key: 'accountsReceivable', label: 'Accounts Receivable (₹)', type: 'number', hint: 'Money owed to you' },
  { key: 'avgReceivableDays', label: 'Avg. Days to Collect Payment', type: 'number' },
  { key: 'accountsPayable', label: 'Accounts Payable (₹)', type: 'number', hint: 'Money you owe suppliers' },
  { key: 'avgPayableDays', label: 'Avg. Days You Take to Pay', type: 'number' },
  { key: 'inventoryValue', label: 'Inventory Value (₹)', type: 'number' },
  { key: 'monthlyInventoryTurnoverDays', label: 'Inventory Turnover (days)', type: 'number' },
  { key: 'outstandingDebt', label: 'Outstanding Debt / Loan (₹)', type: 'number' },
  { key: 'debtInterestRatePct', label: 'Debt Interest Rate (% p.a.)', type: 'number' },
  { key: 'debtTenureMonths', label: 'Debt Tenure (months)', type: 'number' },
];

export default function SetupPage() {
  const { business, setBusiness, resetToDemo } = useBusiness();
  const [form, setForm] = useState<Record<keyof BusinessInputs, string | number>>(business);
  const [saved, setSaved] = useState(false);
  const router = useRouter();

  function update(key: keyof BusinessInputs, value: string) {
    const isNumberField = FIELDS.find((f) => f.key === key)?.type === 'number';
    setForm((prev) => ({
      ...prev,
      [key]: isNumberField ? (value === '' ? '' : value) : value,
    }));
    setSaved(false);
  }

  function handleSave() {
    const cleaned = { ...business } as Record<string, unknown>;
    for (const f of FIELDS) {
      if (f.type === 'number') {
        const val = form[f.key];
        cleaned[f.key] = val === '' ? 0 : Number(val) || 0;
      } else {
        cleaned[f.key] = String(form[f.key] || '');
      }
    }
    setBusiness(cleaned as unknown as BusinessInputs);
    setSaved(true);
    setTimeout(() => router.push('/'), 500);
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Business Setup</h1>
          <p className="text-sm text-gray-400">Enter your business figures. Every dashboard number is derived from this.</p>
        </div>
        <button
          onClick={() => {
            setForm(DEMO_BUSINESS);
            resetToDemo();
          }}
          className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-gray-800 border border-gray-200 rounded-lg px-3 py-1.5"
        >
          <RotateCcw className="w-3.5 h-3.5" /> Load demo data
        </button>
      </header>

      <Card>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {FIELDS.map((f) => (
            <div key={f.key} className={f.key === 'businessName' || f.key === 'industry' ? 'sm:col-span-2' : ''}>
              <label className="block text-xs font-medium text-gray-500 mb-1">{f.label}</label>
              <input
                type={f.type}
                value={form[f.key] as string | number}
                onChange={(e) => update(f.key, e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
              {f.hint && <p className="text-[11px] text-gray-400 mt-1">{f.hint}</p>}
            </div>
          ))}
        </div>

        <div className="mt-6 flex items-center gap-3">
          <button
            onClick={handleSave}
            className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl px-5 py-2.5 text-sm font-medium"
          >
            <Save className="w-4 h-4" /> Save & View Dashboard
          </button>
          {saved && <span className="text-xs text-ok font-medium">Saved!</span>}
        </div>
      </Card>
    </div>
  );
}
