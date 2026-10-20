import React, { useLayoutEffect, useMemo, useRef } from 'react';
import clsx from 'clsx';
import type { DslAnalysis, DslTokenKind } from '../utils/dslLint';

interface DslEditorProps {
  value: string;
  analysis: DslAnalysis;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onFocus?: () => void;
  onBlur?: () => void;
  placeholder?: string;
}

const TOKEN_CLASS: Record<DslTokenKind, string> = {
  multiplier: 'text-(--text-color)',
  operator: 'text-(--muted-text)',
  paren: 'text-(--muted-text)',
  duration: 'text-(--color-work)',
  label: 'text-(--text-color)',
  description: 'text-(--muted-text)',
  attrKey: 'text-(--muted-text)',
  attrValue: 'text-(--color-rest)',
  punct: 'text-(--muted-text)',
  invalid: 'text-(--pill-negative-ink)',
};

const SHARED_TEXT = 'p-4 pr-16 font-mono text-sm leading-6 whitespace-pre-wrap [overflow-wrap:anywhere]';

function buildSegments(text: string, analysis: DslAnalysis) {
  const kinds: (DslTokenKind | null)[] = new Array(text.length).fill(null);
  const errors: boolean[] = new Array(text.length).fill(false);
  for (const t of analysis.tokens) kinds.fill(t.kind, t.start, t.end);
  for (const d of analysis.diagnostics) errors.fill(true, d.start, d.end);

  const segments: { text: string; kind: DslTokenKind | null; error: boolean }[] = [];
  for (let i = 0; i < text.length; i++) {
    const last = segments[segments.length - 1];
    if (last && last.kind === kinds[i] && last.error === errors[i]) last.text += text[i];
    else segments.push({ text: text[i], kind: kinds[i], error: errors[i] });
  }
  return segments;
}

export function DslEditor({ value, analysis, onChange, onSubmit, onFocus, onBlur, placeholder }: DslEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const segments = useMemo(() => buildSegments(value, analysis), [value, analysis]);

  useLayoutEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }, [value]);

  return (
    <div className="dsl-editor relative">
      <pre aria-hidden className={clsx(SHARED_TEXT, 'pointer-events-none absolute inset-0 m-0 overflow-hidden')}>
        {segments.map((s, i) => (
          <span
            key={i}
            className={clsx(
              s.kind && TOKEN_CLASS[s.kind],
              s.error && 'dsl-token-error',
            )}
          >
            {s.text}
          </span>
        ))}
        {'\n'}
      </pre>
      <textarea
        ref={textareaRef}
        rows={4}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={onFocus}
        onBlur={onBlur}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
            e.preventDefault();
            onSubmit();
          }
        }}
        spellCheck={false}
        autoCapitalize="off"
        autoComplete="off"
        aria-invalid={analysis.diagnostics.length > 0}
        className={clsx(
          SHARED_TEXT,
          'relative block w-full resize-none overflow-hidden bg-transparent text-transparent caret-(--text-color) outline-none placeholder:text-(--muted-text) selection:bg-(--surface-elevated)',
        )}
        placeholder={placeholder}
      />
    </div>
  );
}
