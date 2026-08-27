import { ArrowLeft, Sparkles, ExternalLink } from 'lucide-react';

interface AIAgentsPageProps {
  onNavigate: (path: string) => void;
}

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
              <h2 className="text-2xl font-bold">AI Assistant Integration</h2>
            </div>
            <p className="text-lg opacity-90 leading-relaxed">
              Vitumer lets AI assistants create runnable timer sessions from natural language requests.
            </p>
            <p className="opacity-80 leading-relaxed">
              AI assistants can generate Vitumer DSL code and return shareable Vitumer URLs that open the session directly in the browser, ready to use.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">What is Vitumer?</h2>
            <p className="opacity-80 leading-relaxed">
              Vitumer is a <strong>frontend-only web app</strong> — a hybrid AI timer for structured time sessions including Pomodoro, HIIT, rituals, focus blocks, and any other time-based workflow.
            </p>
            <p className="opacity-80 leading-relaxed">
              Unlike traditional Pomodoro timers, Vitumer is a <strong>generic structured timer engine</strong> that can represent any sequence of timed blocks with custom durations, labels, colors, and attributes.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">How AI Assistants Can Use Vitumer</h2>
            <div className="space-y-3">
              <p className="opacity-80 leading-relaxed">
                When a user requests a timer session in natural language, AI assistants can:
              </p>
              <ol className="list-decimal list-inside space-y-2 opacity-80 pl-4">
                <li>Parse the user's request</li>
                <li>Generate valid Vitumer DSL code</li>
                <li>Encode the DSL as a base64 URL parameter</li>
                <li>Return a shareable Vitumer URL that opens directly to the session</li>
              </ol>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">Example Use Cases</h2>
            <div className="space-y-4">
              <div className="surface-card p-4 rounded-lg border border-(--border-color)">
                <p className="font-mono text-sm opacity-70 mb-2">User request:</p>
                <p className="font-semibold mb-3">"Create a 20-minute knee mobility session"</p>
                <p className="font-mono text-sm opacity-70 mb-2">AI assistant generates:</p>
                <pre className="bg-black/20 dark:bg-white/5 p-3 rounded text-sm overflow-x-auto">
                  <code>4 * (3m stretch [emoji:🦵, color:teal] + 2m rest [emoji:💧])</code>
                </pre>
                <p className="font-mono text-sm opacity-70 mt-3 mb-2">Returns shareable URL:</p>
                <p className="text-xs opacity-60 break-all font-mono">
                  https://vitumer.jplucinski.dev/?flow=NCAqICgzbSBzdHJldGNoIFtlbW9qaTrwn6a1LCBjb2xvcjp0ZWFsXSArIDJtIHJlc3QgW2Vtb2ppOvCfkqddKQ==
                </p>
              </div>

              <div className="surface-card p-4 rounded-lg border border-(--border-color)">
                <p className="font-mono text-sm opacity-70 mb-2">User request:</p>
                <p className="font-semibold mb-3">"Set up 3 Pomodoro sessions with 5-minute breaks"</p>
                <p className="font-mono text-sm opacity-70 mb-2">AI assistant generates:</p>
                <pre className="bg-black/20 dark:bg-white/5 p-3 rounded text-sm overflow-x-auto">
                  <code>3 * (25m pomo [color:orange, emoji:💻] + 5m break [color:teal, emoji:☕])</code>
                </pre>
              </div>

              <div className="surface-card p-4 rounded-lg border border-(--border-color)">
                <p className="font-mono text-sm opacity-70 mb-2">User request:</p>
                <p className="font-semibold mb-3">"Create a 5-minute HIIT workout"</p>
                <p className="font-mono text-sm opacity-70 mb-2">AI assistant generates:</p>
                <pre className="bg-black/20 dark:bg-white/5 p-3 rounded text-sm overflow-x-auto">
                  <code>10 * (20s work [emoji:💪, color:orange] + 10s rest [color:teal])</code>
                </pre>
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">DSL Quick Reference</h2>
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
                <span className="opacity-70">Colors:</span>
                <code className="block mt-1 ml-4">orange, teal, blue, purple, rose, amber</code>
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">Machine-Readable Documentation</h2>
            <p className="opacity-80 leading-relaxed">
              For complete technical specifications, including DSL syntax, encoding details, and integration guidelines, see:
            </p>
            <a
              href="/llms.txt"
              className="inline-flex items-center gap-2 px-4 py-3 rounded-lg border border-(--border-color) hover:bg-(--block-color) transition-colors"
            >
              <ExternalLink size={18} />
              <span className="font-mono font-semibold">/llms.txt</span>
            </a>
            <p className="text-sm opacity-60 leading-relaxed">
              The <code className="px-1.5 py-0.5 bg-black/20 dark:bg-white/5 rounded">/llms.txt</code> file contains the complete machine-readable specification for AI agents and LLMs, including syntax rules, encoding algorithms, and examples.
            </p>
          </section>

          <section className="space-y-4 pt-4 border-t border-(--border-color)/30">
            <h2 className="text-xl font-semibold">Important Notes</h2>
            <ul className="space-y-2 opacity-80 list-disc list-inside pl-4">
              <li>Vitumer is a <strong>frontend-only application</strong> with no backend API</li>
              <li>All session data is encoded in the URL as a <code className="px-1.5 py-0.5 bg-black/20 dark:bg-white/5 rounded">?flow=</code> parameter</li>
              <li>Sessions are shareable via URL — no authentication or accounts required</li>
              <li>The DSL parser is the source of truth for syntax validation</li>
            </ul>
          </section>
        </div>
      </main>
    </div>
  );
}
