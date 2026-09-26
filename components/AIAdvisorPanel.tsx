'use client';

import { useState } from 'react';
import { Sparkles, Send, Loader2 } from 'lucide-react';
import { Card } from './Card';
import { useBusiness } from '@/lib/businessStore';
import { buildAdvisorContext } from '@/lib/aiContext';
import { WhatIfResult } from '@/lib/types';

const PRESET_QUESTIONS = [
  'Why is my cash flow risky?',
  'Why am I profitable but short of cash?',
  'How much funding might I need?',
  'What should I do about overdue payments?',
  'Where is my money currently stuck?',
];

export default function AIAdvisorPanel({
  context,
  whatIf,
  compact = false,
}: {
  context: string;
  whatIf?: WhatIfResult;
  compact?: boolean;
}) {
  const { business } = useBusiness();
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function ask(q: string) {
    if (!q.trim()) return;
    setLoading(true);
    setError(null);
    setAnswer(null);
    try {
      const advisorContext = buildAdvisorContext(business, whatIf);
      const res = await fetch('/api/advisor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: q, context: advisorContext }),
      });
      const data = await res.json();
      if (data.error && !data.answer) {
        setError(data.error);
      } else {
        setAnswer(data.answer);
        if (data.error) setError(data.error);
      }
    } catch (e) {
      setError('Could not reach the AI advisor. Check your connection.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card
      title="AI Business Advisor"
      subtitle={`Powered by Claude · context: ${context}`}
      className={compact ? '' : ''}
    >
      <div className="flex flex-wrap gap-2 mb-4">
        {PRESET_QUESTIONS.map((q) => (
          <button
            key={q}
            onClick={() => {
              setQuestion(q);
              ask(q);
            }}
            className="text-xs px-3 py-1.5 rounded-full bg-brand-50 text-brand-700 hover:bg-brand-100 font-medium transition-colors"
          >
            {q}
          </button>
        ))}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          ask(question);
        }}
        className="flex gap-2 mb-4"
      >
        <input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Ask about your business finances..."
          className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
        <button
          type="submit"
          disabled={loading}
          className="bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white rounded-xl px-4 py-2 text-sm font-medium flex items-center gap-1.5"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          Ask
        </button>
      </form>

      {loading && (
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <Sparkles className="w-4 h-4 animate-pulse" /> Thinking through your numbers...
        </div>
      )}

      {error && <div className="text-xs text-danger mb-2">{error}</div>}

      {answer && (
        <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
          {answer}
        </div>
      )}

      {!answer && !loading && (
        <p className="text-xs text-gray-400">
          Tap a question above or type your own. Claude explains the numbers already calculated by the Financial
          Engine — it never invents figures.
        </p>
      )}
    </Card>
  );
}
