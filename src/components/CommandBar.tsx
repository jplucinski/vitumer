// src/components/CommandBar.tsx
import React, { useState, useRef } from 'react';
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
  promptMode: PromptMode;
}

const CommandBar: React.FC<CommandBarProps> = ({ setBlocks, apiKey, modelId, promptMode }) => {
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
      <section className="rounded-3xl border border-(--border-color) bg-(--block-color) overflow-hidden shadow-sm lg:flex lg:flex-col lg:flex-1 lg:min-h-0">
        <div className="flex items-center gap-1 p-2 border-b border-(--border-color) bg-black/[0.02] dark:bg-white/[0.02]">
          <button
            className={clsx(
              'px-3.5 py-1.5 rounded-xl text-sm font-semibold transition-all',
              activeTab === 'ai'
                ? 'bg-white text-black dark:bg-white dark:text-black shadow-sm'
                : 'opacity-55 hover:opacity-100'
            )}
            onClick={() => setActiveTab('ai')}
            type="button"
          >
            AI Prompting
          </button>
          <button
            className={clsx(
              'px-3.5 py-1.5 rounded-xl text-sm font-semibold transition-all',
              activeTab === 'dsl'
                ? 'bg-white text-black dark:bg-white dark:text-black shadow-sm'
                : 'opacity-55 hover:opacity-100'
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
            promptMode={promptMode}
            onEditInDsl={handleEditInDsl}
            onFeedback={showTransientFeedback}
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
                className="absolute right-3 bottom-3 rounded-full bg-white text-black p-2.5 shadow-md hover:scale-105 transition-transform"
                type="button"
              >
                <CornerDownLeft size={15} />
              </button>
            </div>

            {dslError && (
              <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2.5 text-xs text-red-200 font-mono">
                {dslError}
              </div>
            )}

            <div className="rounded-2xl border border-(--border-color) bg-(--bg-color)/40 p-4 text-sm font-mono space-y-3">
              <div className="flex items-center justify-between text-xs uppercase tracking-[0.24em] opacity-50">
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
            feedbackType === 'success' && 'bg-emerald-500/10 text-emerald-200 border border-emerald-400/10',
            feedbackType === 'error' && 'bg-rose-500/10 text-rose-200 border border-rose-400/10',
            feedbackType === 'info' && 'bg-slate-800/70 text-slate-100 border border-slate-700/50'
          )}
        >
          {feedbackMessage}
        </div>
      )}
    </div>
  );
};

export default CommandBar;
