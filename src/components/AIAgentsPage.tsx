import { ArrowLeft, Sparkles, ExternalLink } from 'lucide-react';

interface AIAgentsPageProps {
  onNavigate: (path: string) => void;
}

const POMO_LINK =
  'https://vitumer.jplucinski.dev/?flow=MyAqICgyNW0gcG9tbyBbY29sb3I6b3JhbmdlXSArIDVtIGJyZWFrIFtjb2xvcjp0ZWFsXSk=';
const KNEE_DSL =
  '4 * (3m stretch {Knee mobility} [emoji:🦵, color:teal] + 2m rest [emoji:💧, color:teal])';
const KNEE_LINK =
  'https://vitumer.jplucinski.dev/?flow=NCAqICgzbSBzdHJldGNoIHtLbmVlIG1vYmlsaXR5fSBbZW1vamk68J+mtSwgY29sb3I6dGVhbF0gKyAybSByZXN0IFtlbW9qaTrwn5KnLCBjb2xvcjp0ZWFsXSk=';

export default function AIAgentsPage({ onNavigate }: AIAgentsPageProps) {
  return (
    <div className="min-h-screen app-container">
      <header className="max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-[max(0.75rem,env(safe-area-inset-top))] pb-3 flex items-center gap-4 border-b border-(--border-color)/50">
        <button
          onClick={() => onNavigate('/')}
          className="inline-flex items-center justify-center min-h-11 min-w-11 rounded-md hover:bg-black/5 dark:hover:bg-white/5 transition-colors opacity-60 hover:opacity-100"
          title="Back to app"
          type="button"
        >
          <ArrowLeft size={18} />
        </button>
        <h1 className="app-title">Vitumer for AI Agents</h1>
      </header>

      <main className="max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          <section className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles size={24} className="text-(--color-primary)" />
              <h2 className="text-2xl font-bold">What to return</h2>
            </div>
            <p className="text-lg opacity-90 leading-relaxed">
              Vitumer is a frontend-only timer. There is no API. When someone asks you to create a
              session on{' '}
              <span className="font-mono text-base">https://vitumer.jplucinski.dev/</span>, return
              English DSL plus one ready share link.
            </p>
            <ol className="list-decimal list-inside space-y-2 opacity-80 pl-4">
              <li>Short English explanation of the schedule</li>
              <li>Valid Vitumer DSL (loops OK; attributes on each block, not after the loop)</li>
              <li>
                One link:{' '}
                <code className="px-1.5 py-0.5 bg-black/20 dark:bg-white/5 rounded">
                  https://vitumer.jplucinski.dev/?flow=
                </code>
                + UTF-8 base64 of that DSL
              </li>
              <li>
                English labels even if the user wrote another language. Focus/work → orange,
                rest/break → teal. Emoji on every block.
              </li>
            </ol>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">Example use cases</h2>
            <div className="space-y-4">
              <div className="surface-card p-4 rounded-lg border border-(--border-color)">
                <p className="font-mono text-sm opacity-70 mb-2">User request:</p>
                <p className="font-semibold mb-3">
                  zrob mi plan cwiczenia na kolano w https://vitumer.jplucinski.dev/
                </p>
                <p className="font-mono text-sm opacity-70 mb-2">Return DSL:</p>
                <pre className="bg-black/20 dark:bg-white/5 p-3 rounded text-sm overflow-x-auto">
                  <code>{KNEE_DSL}</code>
                </pre>
                <p className="font-mono text-sm opacity-70 mt-3 mb-2">Ready link:</p>
                <p className="text-xs opacity-60 break-all font-mono">{KNEE_LINK}</p>
              </div>

              <div className="surface-card p-4 rounded-lg border border-(--border-color)">
                <p className="font-mono text-sm opacity-70 mb-2">User request:</p>
                <p className="font-semibold mb-3">3 Pomodoro sessions with 5-minute breaks</p>
                <p className="font-mono text-sm opacity-70 mb-2">Return DSL:</p>
                <pre className="bg-black/20 dark:bg-white/5 p-3 rounded text-sm overflow-x-auto">
                  <code>3 * (25m pomo [color:orange] + 5m break [color:teal])</code>
                </pre>
                <p className="font-mono text-sm opacity-70 mt-3 mb-2">Ready link:</p>
                <p className="text-xs opacity-60 break-all font-mono">{POMO_LINK}</p>
              </div>

              <div className="surface-card p-4 rounded-lg border border-(--border-color)">
                <p className="font-mono text-sm opacity-70 mb-2">User request:</p>
                <p className="font-semibold mb-3">5-minute HIIT</p>
                <p className="font-mono text-sm opacity-70 mb-2">Return DSL:</p>
                <pre className="bg-black/20 dark:bg-white/5 p-3 rounded text-sm overflow-x-auto">
                  <code>10 * (20s work [emoji:💪, color:orange] + 10s rest [color:teal])</code>
                </pre>
              </div>

              <div className="surface-card p-4 rounded-lg border border-(--border-color)">
                <p className="font-mono text-sm opacity-70 mb-2">Hold before the next slot:</p>
                <pre className="bg-black/20 dark:bg-white/5 p-3 rounded text-sm overflow-x-auto">
                  <code>25m work [hold] + 5m rest [color:teal]</code>
                </pre>
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">DSL quick reference</h2>
            <div className="bg-black/20 dark:bg-white/5 p-6 rounded-lg space-y-3 font-mono text-sm">
              <div>
                <span className="opacity-70">Single block:</span>
                <code className="block mt-1 ml-4">25m work [emoji:💻, color:orange]</code>
              </div>
              <div>
                <span className="opacity-70">Sequence:</span>
                <code className="block mt-1 ml-4">25m work + 5m rest</code>
              </div>
              <div>
                <span className="opacity-70">Loop:</span>
                <code className="block mt-1 ml-4">4 * (25m work + 5m rest)</code>
              </div>
              <div className="pt-2 border-t border-white/10">
                <span className="opacity-70">Time units:</span>
                <code className="block mt-1 ml-4">h (hours), m (minutes), s (seconds)</code>
              </div>
              <div>
                <span className="opacity-70">Attributes:</span>
                <code className="block mt-1 ml-4">color, emoji, skippable, retry, hold</code>
              </div>
              <div>
                <span className="opacity-70">Colors:</span>
                <code className="block mt-1 ml-4">orange, teal, blue, purple, rose, amber</code>
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">Machine-readable playbook</h2>
            <p className="opacity-80 leading-relaxed">
              Full syntax, encoding, and examples (no JavaScript required):
            </p>
            <a
              href="/llms.txt"
              className="inline-flex items-center gap-2 px-4 py-3 rounded-lg border border-(--border-color) hover:bg-(--block-color) transition-colors"
            >
              <ExternalLink size={18} />
              <span className="font-mono font-semibold">/llms.txt</span>
            </a>
          </section>

          <section className="space-y-4 pt-4 border-t border-(--border-color)/30">
            <h2 className="text-xl font-semibold">Notes</h2>
            <ul className="space-y-2 opacity-80 list-disc list-inside pl-4">
              <li>Frontend-only — no accounts, no backend API</li>
              <li>
                Session lives in{' '}
                <code className="px-1.5 py-0.5 bg-black/20 dark:bg-white/5 rounded">?flow=</code>
              </li>
              <li>The DSL parser is the source of truth for syntax</li>
              <li>
                In-app OpenRouter prompts are documented at{' '}
                <button
                  type="button"
                  className="underline opacity-80 hover:opacity-100"
                  onClick={() => onNavigate('/prompts')}
                >
                  /prompts
                </button>{' '}
                and are a different JSON contract
              </li>
            </ul>
          </section>
        </div>
      </main>
    </div>
  );
}
