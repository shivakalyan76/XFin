'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Settings,
  LineChart,
  Wallet,
  Boxes,
  Landmark,
  FlaskConical,
  Sparkles,
  Receipt,
  Rocket,
  Menu,
  X,
} from 'lucide-react';
import clsx from 'clsx';

const NAV = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/setup', label: 'Business Setup', icon: Settings },
  { href: '/analysis', label: 'Financial Analysis', icon: LineChart },
  { href: '/cash-flow', label: 'Cash Flow', icon: Wallet },
  { href: '/receivables', label: 'Receivables', icon: Receipt },
  { href: '/inventory', label: 'Inventory', icon: Boxes },
  { href: '/funding', label: 'Funding Advisor', icon: Landmark },
  { href: '/simulator', label: 'What-If Simulator', icon: FlaskConical },
  { href: '/advisor', label: 'AI Advisor', icon: Sparkles },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const activeItem = NAV.find((item) => item.href === pathname) || NAV[0];

  return (
    <>
      {/* Mobile Top Header */}
      <div className="md:hidden sticky top-0 z-40 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-brand-600 flex items-center justify-center">
            <Rocket className="w-3.5 h-3.5 text-white" />
          </div>
          <div>
            <span className="font-bold text-gray-900 text-sm leading-none">XFin</span>
            <span className="block text-[10px] text-gray-400 leading-none mt-0.5">{activeItem.label}</span>
          </div>
        </Link>
        <button
          type="button"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle navigation menu"
          className="p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Navigation Drawer / Dropdown */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 top-[57px] z-30 bg-black/40 backdrop-blur-sm" onClick={() => setMobileOpen(false)}>
          <div
            className="bg-white border-b border-gray-200 p-4 max-h-[80vh] overflow-y-auto shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <nav className="space-y-1">
              {NAV.map((item) => {
                const Icon = item.icon;
                const active = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={clsx(
                      'flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors',
                      active
                        ? 'bg-brand-50 text-brand-700 font-semibold'
                        : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                    )}
                  >
                    <Icon className="w-4 h-4 shrink-0" strokeWidth={2} />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
            <div className="mt-4 pt-3 border-t border-gray-100 text-[11px] text-gray-400 text-center">
              AI layer: Gemini (LYRA-ready) · Demo data
            </div>
          </div>
        </div>
      )}

      {/* Desktop Sticky Sidebar */}
      <aside className="hidden md:flex md:flex-col w-64 shrink-0 bg-white border-r border-gray-200 h-screen sticky top-0">
        <div className="flex items-center gap-2 px-5 py-5 border-b border-gray-100">
          <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center">
            <Rocket className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="font-bold text-gray-900 leading-none">XFin</div>
            <div className="text-[11px] text-gray-400 leading-none mt-1">AI Financial Copilot</div>
          </div>
        </div>
        <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-0.5">
          {NAV.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={clsx(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                  active
                    ? 'bg-brand-50 text-brand-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                )}
              >
                <Icon className="w-4 h-4" strokeWidth={2} />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-gray-100 text-[11px] text-gray-400">
          AI layer: Gemini (LYRA-ready) · Demo data
        </div>
      </aside>
    </>
  );
}
