import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import clsx from 'clsx';
import { AI_PROMPT_DOCS, type PromptMode } from '../constants/aiPrompts';
import { AppNav } from './AppNav';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { useSectionReveal } from '../hooks/useGsapMotion';

type Props = {
  onNavigate: (path: string) => void;
};

const PromptsPage = ({ onNavigate }: Props) => {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [previewMode, setPreviewMode] = useState<PromptMode>('compact');
  const reduced = useReducedMotion();
  const revealRef = useSectionReveal(reduced);

  const toggle = (id: string) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="min-h-screen app-container overflow-x-hidden transition-colors duration-300">
      <AppNav
        variant="subpage"
        current="prompts"
        onBack={() => onNavigate('/')}
        onNavigateHome={() => onNavigate('/')}
        onNavigatePrompts={() => onNavigate('/prompts')}
      />

      <main ref={revealRef} className="app-canvas overflow-x-hidden px-4 pb-24 pt-6 sm:px-6 lg:px-8">
        <header className="pb-8" data-reveal>
          <h1 className="screen-title">Prompts</h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed opacity-70">
            These are the OpenRouter prompts Vitumer sends from the browser. The paste-out playbook for other models lives at{' '}
            <a href="/llms.txt" className="underline hover:opacity-100">
              /llms.txt
            </a>
            .
          </p>
          <div className="mt-6 flex gap-2">
            {(['compact', 'verbose'] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setPreviewMode(mode)}
                className={clsx(
                  'px-1 py-2 text-sm capitalize',
                  previewMode === mode
                    ? 'tab-active'
                    : 'text-(--muted-text) hover:text-(--text-color)'
                )}
              >
                {mode}
              </button>
            ))}
          </div>
        </header>

        <div className="space-y-6">
        {AI_PROMPT_DOCS.map((doc) => (
          <article
            key={doc.id}
            data-reveal
            className="space-y-4 rounded-3xl border border-(--border-color) bg-(--block-color) p-5 sm:p-6"
          >
            <div>
              <h2 className="font-mono text-base font-semibold inline-flex items-center flex-wrap gap-x-2">
                {doc.title}
                {doc.promptModes ? (
                  <span className="text-xs text-(--muted-text)">
                    {doc.promptModes.includes(previewMode) ? previewMode : 'single variant'}
                  </span>
                ) : (
                  <span className="text-xs text-(--muted-text)">
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
                <dt className="mb-0.5 text-xs text-(--muted-text)">Model</dt>
                <dd className="opacity-80">{doc.modelSetting}</dd>
              </div>
              <div>
                <dt className="mb-0.5 text-xs text-(--muted-text)">Response format</dt>
                <dd className="opacity-80">{doc.responseFormat}</dd>
              </div>
            </dl>

            <div>
              <dt className="mb-1 text-xs text-(--muted-text)">User message template</dt>
              <pre className="text-xs font-mono bg-[var(--bg-color)] border border-(--border-color) rounded-xl p-3 overflow-x-auto whitespace-pre-wrap break-words">
                {doc.userTemplate}
              </pre>
            </div>

            <div>
              <dt className="mb-1 text-xs text-(--muted-text)">Example user message</dt>
              <pre className="text-xs font-mono bg-[var(--bg-color)] border border-(--border-color) rounded-xl p-3 overflow-x-auto whitespace-pre-wrap break-words">
                {doc.exampleUser}
              </pre>
            </div>

            {doc.exampleResponse ? (
              <div>
                <dt className="mb-1 text-xs text-(--muted-text)">Example response</dt>
                <pre className="text-xs font-mono bg-[var(--bg-color)] border border-(--border-color) rounded-xl p-3 overflow-x-auto whitespace-pre-wrap break-words">
                  {doc.exampleResponse}
                </pre>
              </div>
            ) : null}

            <div>
              <button
                onClick={() => toggle(doc.id)}
                className="flex w-full items-center justify-between py-2 text-xs text-(--muted-text) hover:text-(--text-color)"
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
        </div>

        <p className="mt-10 px-4 text-center text-sm leading-relaxed opacity-50">
          Vitumer runs entirely in your browser. API keys are stored locally and requests go directly to OpenRouter.
          No intermediary server.
        </p>
      </main>
    </div>
  );
};

export default PromptsPage;
