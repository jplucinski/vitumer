// src/components/CommandBar.tsx
import React, { useState, useRef, useEffect, useMemo } from 'react';
import clsx from 'clsx';
import { CornerDownLeft } from 'lucide-react';
import { parseDSL, FlowBlock } from '../utils/dslParser';
import { stringifyBlocks } from '../utils/dslSchema';
import { analyzeDSL, getLineColumn } from '../utils/dslLint';
import AISessionThread from './AISessionThread';
import { DslEditor } from './DslEditor';
import {
  DSL_EDITOR_PLACEHOLDER,
  DSL_REFERENCE_EXAMPLES,
  DSL_SYNTAX_LINES,
} from '../constants/dslReference';
import type { PromptMode } from '../constants/aiPrompts';

interface CommandBarProps {
  blocks: FlowBlock[];
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
  blocks,
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
  const canonicalDsl = useMemo(() => stringifyBlocks(blocks), [blocks]);
  const [dslInput, setDslInput] = useState(canonicalDsl);
  const dslFocused = useRef(false);
  const [dslError, setDslError] = useState('');
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [feedbackType, setFeedbackType] = useState<'success' | 'error' | 'info'>('info');
  const feedbackTimer = useRef<number | null>(null);
  const dslAnalysis = useMemo(() => analyzeDSL(dslInput), [dslInput]);

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

  useEffect(() => {
    if (dslFocused.current) return;
    setDslInput(canonicalDsl);
  }, [canonicalDsl]);

  const handleEditInDsl = (dsl: string) => {
    setActiveTab('dsl');
    setDslInput(dsl);
  };

  const handleDSLSubmit = () => {
    const trimmed = dslInput.trim();
    if (!trimmed || dslAnalysis.diagnostics.length > 0) return;
    try {
      const parsed = parseDSL(trimmed);
      if (parsed.length > 0) {
        setDslInput(stringifyBlocks(parsed));
        setBlocks(parsed);
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
      <section className="surface-card overflow-hidden bg-(--block-color) lg:flex lg:min-h-0 lg:flex-1 lg:flex-col">
        <div className="flex items-end gap-5 border-b border-(--border-color) px-4">
          <button
            className={clsx(
              'px-0.5 py-3 text-sm',
              activeTab === 'ai'
                ? 'tab-active'
                : 'text-(--muted-text) hover:text-(--text-color)'
            )}
            onClick={() => setActiveTab('ai')}
            type="button"
          >
            AI prompting
          </button>
          <button
            className={clsx(
              'px-0.5 py-3 text-sm',
              activeTab === 'dsl'
                ? 'tab-active'
                : 'text-(--muted-text) hover:text-(--text-color)'
            )}
            onClick={() => setActiveTab('dsl')}
            type="button"
          >
            DSL editor
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
              <DslEditor
                value={dslInput}
                analysis={dslAnalysis}
                onChange={(value) => {
                  setDslInput(value);
                  setDslError('');
                }}
                onFocus={() => {
                  dslFocused.current = true;
                }}
                onBlur={() => {
                  dslFocused.current = false;
                }}
                onSubmit={handleDSLSubmit}
                placeholder={DSL_EDITOR_PLACEHOLDER}
              />
              <button
                onClick={handleDSLSubmit}
                disabled={dslAnalysis.diagnostics.length > 0}
                aria-label="Apply DSL (Ctrl+Enter)"
                title="Apply (Ctrl+Enter)"
                className="absolute right-3 bottom-3 inline-flex h-11 w-11 items-center justify-center rounded-full bg-(--text-color) text-(--bg-color) disabled:cursor-not-allowed disabled:opacity-40"
                type="button"
              >
                <CornerDownLeft size={15} />
              </button>
            </div>

            {dslAnalysis.diagnostics.length > 0 && (
              <ul
                aria-live="polite"
                className="alert alert-danger space-y-1 px-3 py-2.5 font-mono text-xs"
              >
                {dslAnalysis.diagnostics.slice(0, 5).map((d) => {
                  const { line, column } = getLineColumn(dslInput, d.start);
                  return (
                    <li key={`${d.start}-${d.message}`}>
                      <span className="opacity-60">{line}:{column}</span> {d.message}
                    </li>
                  );
                })}
                {dslAnalysis.diagnostics.length > 5 && (
                  <li className="opacity-60">+{dslAnalysis.diagnostics.length - 5} more</li>
                )}
              </ul>
            )}

            {dslError && (
              <div className="alert alert-danger px-3 py-2.5 text-sm">
                {dslError}
              </div>
            )}

            <div className="space-y-3 bg-(--bg-color) p-4 text-sm">
              <p className="text-xs text-(--muted-text)">Syntax</p>
              <ul className="space-y-1 font-mono text-xs text-(--muted-text)">
                {DSL_SYNTAX_LINES.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {DSL_REFERENCE_EXAMPLES.map((example) => (
                  <div key={example.title}>
                    <p className="text-sm">{example.title}</p>
                    <p className="mt-1 overflow-x-auto font-mono text-xs break-all text-(--muted-text)">{example.dsl}</p>
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
            'px-4 py-2.5 text-sm',
            feedbackType === 'success' && 'bg-(--pill-positive-bg) text-(--pill-positive-ink)',
            feedbackType === 'error' && 'bg-(--pill-negative-bg) text-(--pill-negative-ink)',
            feedbackType === 'info' && 'bg-(--surface-elevated) text-(--text-color)'
          )}
        >
          {feedbackMessage}
        </div>
      )}
    </div>
  );
};

export default CommandBar;
