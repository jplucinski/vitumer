import clsx from 'clsx';
import { ChevronDown, ChevronUp, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { FlowBlock } from '../utils/dslParser';
import { AITurnStatus } from '../types/aiSession';

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return s > 0 ? `${m}m ${s}s` : `${m}m`;
}

interface AISuggestionPreviewProps {
  reasoning: string;
  blocks: FlowBlock[];
  status: AITurnStatus;
  isThinking?: boolean;
}

export function AISuggestionPreview({
  reasoning,
  blocks,
  status,
  isThinking = false,
}: AISuggestionPreviewProps) {
  const [showReasoning, setShowReasoning] = useState(true);

  return (
    <div
      className={clsx(
        'ai-response-card ai-suggestion-preview',
        status === 'rejected' && 'opacity-50',
        status === 'accepted' && 'ring-1 ring-emerald-500/30'
      )}
    >
      <div
        className="flex items-center justify-between gap-2 cursor-pointer"
        onClick={() => setShowReasoning(!showReasoning)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && setShowReasoning(!showReasoning)}
      >
        <div className="flex items-center gap-2 text-xs font-mono text-blue-400">
          <Sparkles size={14} className={isThinking ? 'animate-spin' : ''} />
          <span>{isThinking ? 'Model is thinking...' : 'Model Reasoning'}</span>
        </div>
        {!isThinking && (
          <div className="opacity-50">
            {showReasoning ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </div>
        )}
      </div>

      {showReasoning && reasoning && (
        <div className="mt-2 text-xs font-mono opacity-70 leading-relaxed border-t border-(--border-color) pt-2">
          {reasoning}
        </div>
      )}

      {blocks.length > 0 && (
        <div className="mt-3 space-y-2">
          <div className="text-[10px] font-semibold uppercase tracking-[0.24em] opacity-50">
            AI Suggestion
            {status === 'accepted' && ' — Accepted'}
            {status === 'rejected' && ' — Rejected'}
          </div>
          <div className="grid gap-2">
            {blocks.map((block) => (
              <div
                key={block.id}
                className="rounded-lg bg-black/4 dark:bg-black/25 p-2.5 border border-(--border-color) text-xs font-mono"
              >
                <div className="flex justify-between items-center gap-2">
                  <span className="font-semibold truncate min-w-0">{block.label}</span>
                  <span className="opacity-60 shrink-0">{formatDuration(block.duration)}</span>
                </div>
                {block.description && (
                  <div className="mt-1 text-[11px] opacity-70">{block.description}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
