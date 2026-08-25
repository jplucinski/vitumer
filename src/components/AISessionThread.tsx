import React, { useEffect, useRef, useState } from 'react';
import clsx from 'clsx';
import { Check, Code2, CornerDownLeft, Pencil, RotateCcw, Sparkles, X } from 'lucide-react';
import { FlowBlock } from '../utils/dslParser';
import { stringifyBlocks } from '../utils/dslSchema';
import { useAISessionThread } from '../hooks/useAISessionThread';
import { AISuggestionPreview } from './AISuggestionPreview';
import { AIThinkingPanel } from './AIThinkingPanel';
import { AIRefinementSuggestion, AITurn } from '../types/aiSession';
import type { PromptMode } from '../constants/aiPrompts';

const STARTER_PROMPTS = [
  '3 study blocks with 5 min breaks',
  'Morning routine with coffee ritual',
  '25 min pomodoro x4 with longer final break',
] as const;

const FALLBACK_REFINEMENT_CHIPS: AIRefinementSuggestion[] = [
  { label: 'Longer breaks', text: 'Make breaks longer' },
  { label: 'Add warmup', text: 'Add a 5 minute warmup block at the start' },
  { label: 'Shorter session', text: 'Make the overall session shorter' },
  { label: 'Regenerate', text: 'Regenerate with a fresh take on the same request' },
];

interface AISessionThreadProps {
  setBlocks: React.Dispatch<React.SetStateAction<FlowBlock[]>>;
  apiKey: string | null;
  modelId: string;
  promptMode: PromptMode;
  onEditInDsl: (dsl: string) => void;
  onFeedback: (message: string, type?: 'success' | 'error' | 'info') => void;
}

function UserTurnBubble({
  turn,
  canEdit,
  onEdit,
}: {
  turn: AITurn;
  canEdit: boolean;
  onEdit: (turnId: string, newText: string) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(turn.userMessage);

  const handleResend = () => {
    const trimmed = editText.trim();
    if (!trimmed) return;
    onEdit(turn.id, trimmed);
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="user-msg w-full max-w-[88%] ml-auto space-y-2">
        <textarea
          value={editText}
          onChange={(e) => setEditText(e.target.value)}
          rows={3}
          className="w-full bg-transparent text-white placeholder-white/50 outline-none resize-none text-sm font-mono"
          autoFocus
        />
        <div className="flex gap-2">
          <button
            onClick={handleResend}
            className="px-3 py-1 rounded-lg bg-white/20 text-xs font-semibold hover:bg-white/30"
            type="button"
          >
            Resend
          </button>
          <button
            onClick={() => {
              setEditText(turn.userMessage);
              setIsEditing(false);
            }}
            className="px-3 py-1 rounded-lg bg-white/10 text-xs font-semibold hover:bg-white/20"
            type="button"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={clsx(
        'user-msg group inline-flex items-start gap-1 max-w-[88%] ml-auto',
        turn.status === 'rejected' && 'opacity-50'
      )}
    >
      <span className="flex-1">{turn.userMessage}</span>
      {canEdit && (
        <button
          onClick={() => setIsEditing(true)}
          className="edit-prompt-btn shrink-0 p-0.5 hover:opacity-100"
          title="Edit prompt"
          type="button"
        >
          <Pencil size={12} />
        </button>
      )}
    </div>
  );
}

const AISessionThread: React.FC<AISessionThreadProps> = ({
  setBlocks,
  apiKey,
  modelId,
  promptMode,
  onEditInDsl,
  onFeedback,
}) => {
  const [composerText, setComposerText] = useState('');
  const threadEndRef = useRef<HTMLDivElement>(null);
  const composerRef = useRef<HTMLTextAreaElement>(null);

  const {
    thread,
    isThinking,
    thinkingTurnId,
    error,
    latestPendingTurn,
    sendMessage,
    editAndResend,
    acceptTurn,
    rejectTurn,
    resetThread,
    clearError,
  } = useAISessionThread({
    apiKey,
    modelId,
    promptMode,
    onAccept: (blocks) => {
      setBlocks(blocks);
      onFeedback('AI suggestion accepted.', 'success');
    },
  });

  const hasConversation = thread.turns.length > 0 || isThinking;

  useEffect(() => {
    if (typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches) {
      return;
    }
    threadEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [thread.turns.length, isThinking]);

  const handleSend = async () => {
    if (!composerText.trim()) return;
    if (!apiKey) {
      onFeedback('Connect OpenRouter in Settings to generate a session with AI.', 'error');
      return;
    }
    const text = composerText;
    setComposerText('');
    await sendMessage(text);
  };

  const handleComposerKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleAccept = (turnId: string) => {
    acceptTurn(turnId);
  };

  const handleReject = (turnId: string) => {
    rejectTurn(turnId);
    onFeedback('AI suggestion rejected. Add a follow-up to refine.', 'info');
  };

  const handleEditInDsl = (turn: AITurn) => {
    onEditInDsl(stringifyBlocks(turn.blocks));
    rejectTurn(turn.id);
    onFeedback('AI suggestion opened in DSL editor.', 'info');
  };

  const handleChipClick = async (text: string) => {
    if (!apiKey) {
      setComposerText(text);
      composerRef.current?.focus();
      return;
    }
    if (isThinking) return;
    setComposerText('');
    await sendMessage(text);
  };

  const placeholder = hasConversation
    ? 'Add details or ask for changes…'
    : 'Describe your session in plain language…';

  const pendingActions =
    latestPendingTurn &&
    !isThinking &&
    latestPendingTurn.blocks.length > 0
      ? latestPendingTurn
      : null;

  const footerChips =
    pendingActions &&
    (pendingActions.suggestions.length > 0
      ? pendingActions.suggestions
      : FALLBACK_REFINEMENT_CHIPS);

  return (
    <div className="ai-session-panel">
      <div className="ai-session-header">
        <div className="flex items-center gap-2 min-w-0">
          <Sparkles size={15} className="text-blue-400 shrink-0" />
          <div className="min-w-0">
            <p className="text-sm font-semibold leading-tight">Session builder</p>
            <p className="text-[11px] font-mono opacity-45">
              {hasConversation
                ? `${thread.turns.length} turn${thread.turns.length === 1 ? '' : 's'}`
                : 'Natural language → timed blocks'}
            </p>
          </div>
        </div>
        {thread.turns.length > 0 && (
          <button
            onClick={resetThread}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold opacity-55 hover:opacity-100 border border-(--border-color) hover:bg-white/5 transition-all shrink-0"
            type="button"
            aria-label="Clear conversation"
          >
            <RotateCcw size={12} />
            Clear
          </button>
        )}
      </div>

      <div
        className={clsx(
          'ai-session-body',
          !hasConversation && 'ai-session-body--empty'
        )}
      >
        {!hasConversation ? (
          <div className="ai-session-empty">
            <p className="text-sm opacity-60 text-center max-w-sm leading-relaxed">
              Tell the AI what you want to work on — it returns blocks you can accept or tweak.
            </p>
            <div className="flex flex-wrap justify-center gap-2 mt-4">
              {STARTER_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => handleChipClick(prompt)}
                  className="px-3 py-1.5 rounded-full text-[11px] font-mono border border-(--border-color) bg-black/3 dark:bg-white/4 hover:bg-black/6 dark:hover:bg-white/8 transition-colors text-left"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="ai-thread-messages">
            {thread.turns.map((turn) => {
              const isLatestPending = latestPendingTurn?.id === turn.id;
              const turnIsThinking = thinkingTurnId === turn.id;
              const canEdit =
                !isThinking && (isLatestPending || turn === thread.turns[thread.turns.length - 1]);

              return (
                <div key={turn.id} className="ai-turn">
                  <UserTurnBubble
                    turn={turn}
                    canEdit={canEdit && turn.status === 'pending' && !turnIsThinking}
                    onEdit={editAndResend}
                  />
                  {turnIsThinking ? (
                    <AIThinkingPanel />
                  ) : (
                    <AISuggestionPreview
                      reasoning={turn.reasoning}
                      blocks={turn.blocks}
                      status={turn.status}
                    />
                  )}
                </div>
              );
            })}
            <div ref={threadEndRef} />
          </div>
        )}
      </div>

      {error && (
        <div className="mx-3 mb-2 rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2.5 text-xs text-red-200 font-mono flex items-start justify-between gap-3">
          <span>{error}</span>
          <button
            onClick={clearError}
            className="opacity-60 hover:opacity-100 shrink-0"
            type="button"
            aria-label="Dismiss"
          >
            <X size={14} />
          </button>
        </div>
      )}

      <div className="ai-session-footer">
        <div className={clsx('ai-composer-dock', pendingActions && 'ai-composer-dock--pending')}>
          {footerChips && (
            <div className="ai-chip-rail" role="list" aria-label="Suggested refinements">
              {footerChips.map((chip) => (
                <button
                  key={`${chip.label}:${chip.text}`}
                  role="listitem"
                  onClick={() => handleChipClick(chip.text)}
                  className="ai-chip"
                  type="button"
                  title={chip.text}
                >
                  {chip.label}
                </button>
              ))}
            </div>
          )}

          <div className="ai-composer-field">
            <textarea
              ref={composerRef}
              rows={pendingActions ? 1 : hasConversation ? 2 : 3}
              disabled={isThinking}
              aria-busy={isThinking}
              aria-label="Session prompt"
              className="ai-composer w-full pl-3.5 pr-11 py-2.5 bg-transparent border-0 outline-none font-mono text-sm placeholder:text-(--muted-text) placeholder:opacity-80 resize-none"
              placeholder={placeholder}
              value={composerText}
              onChange={(e) => setComposerText(e.target.value)}
              onKeyDown={handleComposerKeyDown}
            />
            <button
              onClick={handleSend}
              disabled={isThinking || !composerText.trim()}
              className="ai-composer-send"
              type="button"
              aria-label="Send prompt"
            >
              <CornerDownLeft size={15} />
            </button>
          </div>

          {pendingActions && (
            <div className="ai-decision-bar">
              <button
                onClick={() => handleAccept(pendingActions.id)}
                className="ai-decision-accept"
                type="button"
              >
                <Check size={15} strokeWidth={2.5} />
                Accept
              </button>
              <button
                onClick={() => handleEditInDsl(pendingActions)}
                className="ai-decision-icon"
                type="button"
                title="Edit in DSL"
                aria-label="Edit in DSL"
              >
                <Code2 size={15} />
              </button>
              <button
                onClick={() => handleReject(pendingActions.id)}
                className="ai-decision-icon ai-decision-reject"
                type="button"
                title="Reject"
                aria-label="Reject"
              >
                <X size={15} />
              </button>
            </div>
          )}
        </div>

        {!pendingActions && (
          <p className="text-[10px] opacity-35 font-mono mt-2 px-1">
            Enter to send · Shift+Enter for new line
            {!apiKey && ' · Connect OpenRouter in Settings'}
          </p>
        )}
      </div>
    </div>
  );
};

export default AISessionThread;
