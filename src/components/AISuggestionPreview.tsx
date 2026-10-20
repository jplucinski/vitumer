import clsx from 'clsx';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import { FlowBlock } from '../utils/dslParser';
import { swatch } from '../constants/blockOptions';
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
        status === 'rejected' && 'opacity-50'
      )}
    >
      <div
        className="flex items-center justify-between gap-2 cursor-pointer"
        onClick={() => setShowReasoning(!showReasoning)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && setShowReasoning(!showReasoning)}
      >
        <div className="text-xs text-(--muted-text)">
          <span>{isThinking ? 'Planning the blocks' : 'Reasoning'}</span>
        </div>
        {!isThinking && (
          <div className="opacity-50">
            {showReasoning ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </div>
        )}
      </div>

      {showReasoning && reasoning && (
        <div className="mt-2 border-t border-(--border-color) pt-2 text-sm leading-relaxed text-(--muted-text)">
          {reasoning}
        </div>
      )}

      {blocks.length > 0 && (
        <div className="mt-3 space-y-2">
          <div className="text-xs font-medium text-(--muted-text)">
            Suggestion
            {status === 'accepted' && ' (accepted)'}
            {status === 'rejected' && ' (rejected)'}
          </div>
          <div className="grid gap-2">
            {blocks.map((block) => (
              <div
                key={block.id}
                className="flex items-stretch overflow-hidden bg-(--block-color) text-sm"
              >
                <span className="w-1 shrink-0" style={{ background: swatch(block.color) }} />
                <div className="min-w-0 flex-1 px-2.5 py-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="min-w-0 truncate font-medium">{block.label}</span>
                  <span className="num shrink-0 text-xs text-(--muted-text)">{formatDuration(block.duration)}</span>
                </div>
                {block.description && (
                  <div className="mt-1 text-xs text-(--muted-text)">{block.description}</div>
                )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
