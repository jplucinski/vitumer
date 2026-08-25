import { Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';

const STATUS_MESSAGES = [
  'Planning blocks…',
  'Building schedule…',
  'Adjusting timings…',
] as const;

export function AIThinkingPanel() {
  const [elapsed, setElapsed] = useState(0);
  const [msgIndex, setMsgIndex] = useState(0);

  useEffect(() => {
    const startedAt = Date.now();
    const elapsedTimer = window.setInterval(() => {
      setElapsed(Math.floor((Date.now() - startedAt) / 1000));
    }, 1000);
    const msgTimer = window.setInterval(() => {
      setMsgIndex((i) => (i + 1) % STATUS_MESSAGES.length);
    }, 2800);

    return () => {
      window.clearInterval(elapsedTimer);
      window.clearInterval(msgTimer);
    };
  }, []);

  return (
    <div className="ai-thinking-panel ai-response-card" aria-live="polite" aria-busy="true">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs font-mono text-blue-400">
          <Loader2 size={14} className="animate-spin shrink-0" />
          <span>{STATUS_MESSAGES[msgIndex]}</span>
        </div>
        <span className="text-[11px] font-mono opacity-50 tabular-nums">{elapsed}s</span>
      </div>
      <div className="mt-2.5 space-y-1.5">
        {[0, 1, 2].map((i) => (
          <div key={i} className="ai-skeleton-row" style={{ animationDelay: `${i * 120}ms` }} />
        ))}
      </div>
    </div>
  );
}
