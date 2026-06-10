'use client';

import { useState } from 'react';
import { adminInputClassName } from './FormField';

interface ReviewPanelProps {
  approveLabel: string;
  rejectLabel: string;
  onReview: (action: 'approve' | 'reject', reason?: string) => Promise<void>;
}

export function ReviewPanel({ approveLabel, rejectLabel, onReview }: ReviewPanelProps) {
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function submit(action: 'approve' | 'reject') {
    setSubmitting(true);
    try {
      await onReview(action, reason || undefined);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="rounded-md border border-white/10 bg-brand-card p-4">
      <textarea
        className={adminInputClassName}
        rows={3}
        value={reason}
        onChange={(event) => setReason(event.target.value)}
        aria-label="驳回原因"
      />
      <div className="mt-3 flex gap-2">
        <button disabled={submitting} className="rounded-md bg-brand-gold px-3 py-2 text-sm text-stone-950" onClick={() => void submit('approve')}>
          {approveLabel}
        </button>
        <button disabled={submitting} className="rounded-md border border-white/10 px-3 py-2 text-sm text-stone-100" onClick={() => void submit('reject')}>
          {rejectLabel}
        </button>
      </div>
    </section>
  );
}
