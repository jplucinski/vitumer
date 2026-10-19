// src/components/CommandBar.tsx
import React, { useState, useRef, useEffect } from 'react';
import clsx from 'clsx';
import { CornerDownLeft } from 'lucide-react';
import { parseDSL, FlowBlock } from '../utils/dslParser';
import AISessionThread from './AISessionThread';
import {
  DSL_EDITOR_PLACEHOLDER,
  DSL_REFERENCE_EXAMPLES,
  DSL_SYNTAX_LINES,
} from '../constants/dslReference';
import type { PromptMode } from '../constants/aiPrompts';

interface CommandBarProps {
  setBlocks: React.Dispatch<React.SetStateAction<FlowBlock[]>>;
  apiKey: string | null;
  modelId: string;
  modelLabel: string;
  promptMode: PromptMode;
  onOpenSettings: () => void;
  onModelChange: (modelId: string, label?: string) => void;
  aiFocusToken?: number;
  dslFocusToken?: number;
}

const CommandBar: React.FC<CommandBarProps> = ({
  setBlocks,
  apiKey,
  modelId,
  modelLabel,
  promptMode,
  onOpenSettings,
  onModelChange,
  aiFocusToken = 0,
  dslFocusToken = 0,
}) => {
  const [activeTab, setActiveTab] = useState<'ai' | 'dsl'>('ai');
  const [dslInput, setDslInput] = useState('');
  const [dslError, setDslError] = useState('');
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [feedbackType, setFeedbackType] = useState<'success' | 'error' | 'info'>('info');
  const feedbackTimer = useRef<number | null>(null);

  const showTransientFeedback = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setFeedbackMessage(message);
    setFeedbackType(type);
    if (feedbackTimer.current) {
      window.clearTimeout(feedbackTimer.current);
    }
    feedbackTimer.current = window.setTimeout(() => setFeedbackMessage(''), 3200);
  };

  useEffect(() => {
    if (aiFocusToken > 0) setActiveTab('ai');
  }, [aiFocusToken]);

  useEffect(() => {
    if (dslFocusToken > 0) setActiveTab('dsl');
  }, [dslFocusToken]);

  const handleEditInDsl = (dsl: string) => {
    setActiveTab('dsl');
    setDslInput(dsl);
  };

  const handleDSLSubmit = () => {
    const trimmed = dslInput.trim();
    if (!trimmed) return;
    try {
      const parsed = parseDSL(trimmed);
      if (parsed.length > 0) {
        setBlocks(parsed);
        setDslInput('');
        setDslError('');
        showTransientFeedback('DSL session applied.', 'success');
      } else {
        setDslError('Failed to parse DSL. Try different syntax.');
      }
    } catch (err: any) {
      setDslError(`DSL syntax error: ${err.message}`);
    }
  };

  return (
    <div className="command-workspace space-y-3 lg:sticky lg:top-4 lg:max-h-[calc(100vh-2rem)] lg:max-h-[calc(100dvh-2rem)] lg:overflow-hidden lg:flex lg:flex-col">
      <section className="surface-card overflow-hidden rounded-3xl border border-(--border-color) bg-(--block-color) shadow-sm lg:flex lg:min-h-0 lg:flex-1 lg:flex-col">
        <div className="flex items-center gap-1 p-2 border-b border-(--border-color) bg-black/[0.02] dark:bg-white/[0.02]">
          <button
            className={clsx(
              'rounded-xl px-3.5 py-1.5 text-sm font-semibold transition-colors',
              activeTab === 'ai'
                ? 'tab-active'
                : 'text-(--muted-text) hover:text-(--text-color)'
            )}
            onClick={() => setActiveTab('ai')}
            type="button"
          >
            AI Prompting
          </button>
          <button
            className={clsx(
              'rounded-xl px-3.5 py-1.5 text-sm font-semibold transition-colors',
              activeTab === 'dsl'
                ? 'tab-active'
                : 'text-(--muted-text) hover:text-(--text-color)'
            )}
            onClick={() => setActiveTab('dsl')}
            type="button"
          >
            DSL Editor
          </button>
        </div>

        {activeTab === 'ai' ? (
          <AISessionThread
            setBlocks={setBlocks}
            apiKey={apiKey}
            modelId={modelId}
            modelLabel={modelLabel}
            promptMode={promptMode}
            onEditInDsl={handleEditInDsl}
            onFeedback={showTransientFeedback}
            onOpenSettings={onOpenSettings}
            onModelChange={onModelChange}
          />
        ) : (
          <div className="p-4 space-y-4">
            <div className="relative">
              <textarea
                rows={4}
                value={dslInput}
                onChange={(e) => setDslInput(e.target.value)}
                className="w-full resize-none rounded-2xl border border-(--border-color) bg-(--bg-color)/50 p-4 font-mono text-sm outline-none focus:border-blue-400/50 focus:ring-2 focus:ring-blue-500/20"
                placeholder={DSL_EDITOR_PLACEHOLDER}
              />
              <button
                onClick={handleDSLSubmit}
                className="absolute right-3 bottom-3 inline-flex h-11 w-11 items-center justify-center rounded-full bg-(--text-color) text-(--bg-color) transition-transform hover:scale-105"
                type="button"
              >
                <CornerDownLeft size={15} />
              </button>
            </div>

            {dslError && (
              <div className="rounded-xl border border-rose-600/20 bg-rose-500/10 px-3 py-2.5 font-mono text-xs text-rose-800 dark:text-rose-200">
                {dslError}
              </div>
            )}

            <div className="rounded-2xl border border-(--border-color) bg-(--bg-color)/40 p-4 text-sm font-mono space-y-3">
              <div className="flex items-center justify-between text-xs text-(--muted-text)">
                <span>DSL Reference Guide</span>
                <span>Syntax</span>
              </div>
              <ul className="space-y-1 text-[12px] opacity-60">
                {DSL_SYNTAX_LINES.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[12px] opacity-60">
                {DSL_REFERENCE_EXAMPLES.map((example) => (
                  <div key={example.title}>
                    <p className="font-semibold text-[11px] uppercase opacity-70">{example.title}</p>
                    <p className="break-all overflow-x-auto">{example.dsl}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </section>

      {feedbackMessage && (
        <div
          className={clsx(
            'px-4 py-2.5 text-sm font-medium rounded-xl',
            feedbackType === 'success' && 'border border-emerald-600/20 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200',
            feedbackType === 'error' && 'border border-rose-600/20 bg-rose-500/10 text-rose-800 dark:text-rose-200',
            feedbackType === 'info' && 'border border-(--border-color) bg-(--block-color) text-(--text-color)'
          )}
        >
          {feedbackMessage}
        </div>
      )}
    </div>
  );
};

export default CommandBar;
