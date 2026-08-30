import { useState } from 'react';
import { ArrowLeft, ChevronDown, ChevronUp, FileText } from 'lucide-react';
import clsx from 'clsx';
import { AI_PROMPT_DOCS, type PromptMode } from '../constants/aiPrompts';

type Props = {
  onNavigate: (path: string) => void;
};

const PromptsPage = ({ onNavigate }: Props) => {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [previewMode, setPreviewMode] = useState<PromptMode>('compact');

  const toggle = (id: string) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="min-h-screen app-container transition-colors duration-300">
      <header className="max-w-3xl mx-auto w-full p-4 sm:p-6 flex items-center gap-4">
        <button
          onClick={() => onNavigate('/')}
          className="inline-flex items-center justify-center min-h-11 min-w-11 rounded-md hover:bg-black/5 dark:hover:bg-white/5 transition-colors opacity-60 hover:opacity-100 shrink-0"
          title="Back to app"
          type="button"
        >
          <ArrowLeft size={18} />
        </button>
        <div className="min-w-0">
          <h1 className="font-mono text-lg sm:text-xl font-semibold flex items-center gap-2">
            <FileText size={18} className="opacity-50 shrink-0" />
            <span className="truncate">AI Prompts</span>
          </h1>
          <p className="text-xs opacity-50 mt-0.5">
            In-app OpenRouter prompts only — not the brief for ChatGPT/Claude. That playbook is{' '}
            <a href="/llms.txt" className="underline hover:opacity-100">
              /llms.txt
            </a>
            .
          </p>
          <div className="flex gap-1 mt-3">
            {(['compact', 'verbose'] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setPreviewMode(mode)}
                className={clsx(
                  'px-3 py-1 rounded-lg text-xs font-mono capitalize transition-colors',
                  previewMode === mode ? 'bg-white/10 opacity-100' : 'opacity-40 hover:opacity-70'
                )}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto w-full px-4 sm:px-6 pb-20 space-y-6">
        {AI_PROMPT_DOCS.map((doc) => (
          <article
            key={doc.id}
            className="rounded-2xl border border-(--border-color) bg-(--block-color) p-5 sm:p-6 space-y-4"
          >
            <div>
              <h2 className="font-mono text-base font-semibold inline-flex items-center flex-wrap gap-x-2">
                {doc.title}
                {doc.promptModes ? (
                  <span className="text-[10px] font-mono uppercase tracking-wider opacity-40">
                    {doc.promptModes.includes(previewMode) ? previewMode : 'single variant'}
                  </span>
                ) : (
                  <span className="text-[10px] font-mono uppercase tracking-wider opacity-40">
                    single variant
                  </span>
                )}
              </h2>
              <p className="text-sm opacity-70 mt-1 leading-relaxed">{doc.purpose}</p>
              {doc.promptModes ? (
                <p className="text-[11px] opacity-45 font-mono mt-2">
                  Active mode follows Settings → Detailed AI prompts
                </p>
              ) : null}
            </div>

            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
              <div>
                <dt className="opacity-40 uppercase tracking-wider mb-0.5">Model</dt>
                <dd className="opacity-80">{doc.modelSetting}</dd>
              </div>
              <div>
                <dt className="opacity-40 uppercase tracking-wider mb-0.5">Response format</dt>
                <dd className="opacity-80">{doc.responseFormat}</dd>
              </div>
            </dl>

            <div>
              <dt className="text-xs opacity-40 uppercase tracking-wider mb-1 font-mono">User message template</dt>
              <pre className="text-xs font-mono bg-[var(--bg-color)] border border-(--border-color) rounded-xl p-3 overflow-x-auto whitespace-pre-wrap break-words">
                {doc.userTemplate}
              </pre>
            </div>

            <div>
              <dt className="text-xs opacity-40 uppercase tracking-wider mb-1 font-mono">Example user message</dt>
              <pre className="text-xs font-mono bg-[var(--bg-color)] border border-(--border-color) rounded-xl p-3 overflow-x-auto whitespace-pre-wrap break-words">
                {doc.exampleUser}
              </pre>
            </div>

            {doc.exampleResponse ? (
              <div>
                <dt className="text-xs opacity-40 uppercase tracking-wider mb-1 font-mono">Example response</dt>
                <pre className="text-xs font-mono bg-[var(--bg-color)] border border-(--border-color) rounded-xl p-3 overflow-x-auto whitespace-pre-wrap break-words">
                  {doc.exampleResponse}
                </pre>
              </div>
            ) : null}

            <div>
              <button
                onClick={() => toggle(doc.id)}
                className="flex items-center justify-between w-full text-xs font-mono uppercase tracking-wider opacity-60 hover:opacity-100 transition-opacity py-2"
                type="button"
              >
                <span>System prompt</span>
                {expanded[doc.id] ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
              <pre
                className={clsx(
                  'text-xs font-mono bg-[var(--bg-color)] border border-(--border-color) rounded-xl p-3 overflow-x-auto whitespace-pre-wrap break-words transition-all',
                  expanded[doc.id] ? 'block' : 'hidden'
                )}
              >
                {doc.getSystemPrompt(previewMode)}
              </pre>
            </div>
          </article>
        ))}

        <p className="text-[11px] opacity-50 font-mono leading-relaxed text-center px-4">
          Vitumer runs entirely in your browser. API keys are stored locally and requests go directly to OpenRouter —
          no intermediary server.
        </p>
      </main>
    </div>
  );
};

export default PromptsPage;
