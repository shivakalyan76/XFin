import type { Metadata } from 'next';
import './globals.css';
import Sidebar from '@/components/Sidebar';
import { BusinessProvider } from '@/lib/businessStore';

export const metadata: Metadata = {
  title: 'XFin — AI Financial Copilot',
  description: 'AI-powered business advisory and financial structuring assistant for micro and small enterprises',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <BusinessProvider>
          <div className="flex flex-col md:flex-row min-h-screen">
            <Sidebar />
            <main className="flex-1 min-w-0">
              <div className="max-w-7xl mx-auto p-4 md:p-8">{children}</div>
            </main>
          </div>
        </BusinessProvider>
      </body>
    </html>
  );
}
