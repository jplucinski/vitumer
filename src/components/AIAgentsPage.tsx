import { ExternalLink } from 'lucide-react';
import { AppNav } from './AppNav';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { useSectionReveal } from '../hooks/useGsapMotion';

interface AIAgentsPageProps {
  onNavigate: (path: string) => void;
}

const POMO_LINK =
  'https://vitumer.jplucinski.dev/?flow=MyAqICgyNW0gcG9tbyBbY29sb3I6b3JhbmdlXSArIDVtIGJyZWFrIFtjb2xvcjp0ZWFsXSk=';
const KNEE_DSL =
  '4 * (3m stretch {Knee mobility} [emoji:🦵, color:teal] + 2m rest [emoji:💧, color:teal])';
const KNEE_LINK =
  'https://vitumer.jplucinski.dev/?flow=NCAqICgzbSBzdHJldGNoIHtLbmVlIG1vYmlsaXR5fSBbZW1vamk68J+mtSwgY29sb3I6dGVhbF0gKyAybSByZXN0IFtlbW9qaTrwn5KnLCBjb2xvcjp0ZWFsXSk=';

const CASES = [
  {
    title: 'Knee mobility',
    request: 'zrob mi plan cwiczenia na kolano w https://vitumer.jplucinski.dev/',
    dsl: KNEE_DSL,
    link: KNEE_LINK,
    seed: 'stretch',
  },
  {
    title: 'Pomodoro',
    request: '3 Pomodoro sessions with 5-minute breaks',
    dsl: '3 * (25m pomo [color:orange] + 5m break [color:teal])',
    link: POMO_LINK,
    seed: 'desk',
  },
  {
    title: 'HIIT',
    request: '5-minute HIIT',
    dsl: '10 * (20s work [emoji:💪, color:orange] + 10s rest [color:teal])',
    seed: 'sprint',
  },
  {
    title: 'Hold',
    request: 'Hold before the next slot',
    dsl: '25m work [hold] + 5m rest [color:teal]',
    seed: 'pause',
  },
] as const;

export default function AIAgentsPage({ onNavigate }: AIAgentsPageProps) {
  const reduced = useReducedMotion();
  const revealRef = useSectionReveal(reduced);

  return (
    <div className="app-container min-h-screen overflow-x-hidden">
      <AppNav variant="subpage" onBack={() => onNavigate('/')} />

      <main ref={revealRef} className="mx-auto w-full max-w-6xl overflow-x-hidden px-4 pb-24 sm:px-6 lg:px-8">
        <section className="py-8" data-reveal>
          <h2 className="text-lg font-semibold">What an agent should return</h2>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed opacity-80">
            Vitumer is a frontend-only timer. There is no API. When someone asks you to create a session on{' '}
            <span className="font-mono text-base">https://vitumer.jplucinski.dev/</span>, return English DSL plus one ready share link.
          </p>
          <ol className="mt-8 max-w-2xl list-decimal space-y-2 pl-5 leading-relaxed opacity-80">
            <li>Short English explanation of the schedule</li>
            <li>Valid Vitumer DSL (loops OK; attributes on each block, not after the loop)</li>
            <li>
              One link:{' '}
              <code className="rounded bg-black/20 px-1.5 py-0.5 dark:bg-white/5">
                https://vitumer.jplucinski.dev/?flow=
              </code>
              + UTF-8 base64 of that DSL
            </li>
            <li>
              English labels even if the user wrote another language. Focus/work maps to orange, rest/break maps to teal. Emoji on every block.
            </li>
          </ol>
        </section>

        <section className="py-8" data-reveal>
          <h2 className="mb-4 text-lg font-semibold">Example returns</h2>
          <div className="hidden h-[26rem] gap-3 md:flex">
            {CASES.map((item) => (
              <article
                key={item.title}
                className="group relative flex flex-1 flex-col justify-end overflow-hidden rounded-[1.6rem] border border-(--border-color) p-5 transition-all duration-700 ease-out hover:flex-[2.4]"
              >
                <img
                  src={`https://picsum.photos/seed/${item.seed}/900/1200`}
                  alt=""
                  className="absolute inset-0 h-full w-full object-cover opacity-45 contrast-125 grayscale mix-blend-luminosity transition-transform duration-700 ease-out group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-linear-to-t from-black via-black/40 to-black/10" />
                <div className="relative text-white">
                  <h3 className="text-2xl font-medium">{item.title}</h3>
                  <p className="mt-2 line-clamp-2 text-sm text-white/80">{item.request}</p>
                  <pre className="mt-4 hidden max-h-28 overflow-auto whitespace-pre-wrap break-all rounded-xl bg-black/40 p-3 font-mono text-xs group-hover:block">
                    {item.dsl}
                  </pre>
                  {'link' in item && item.link ? (
                    <p className="mt-3 hidden break-all font-mono text-[11px] text-white/70 group-hover:block">{item.link}</p>
                  ) : null}
                </div>
              </article>
            ))}
          </div>

          <div className="grid auto-rows-fr grid-flow-dense grid-cols-1 gap-4 md:hidden">
            {CASES.map((item) => (
              <article key={item.title} className="overflow-hidden rounded-3xl border border-(--border-color) bg-(--block-color) p-5">
                <p className="text-sm opacity-60">{item.request}</p>
                <h3 className="mt-2 text-xl font-medium">{item.title}</h3>
                <pre className="mt-3 overflow-x-auto rounded-xl bg-black/20 p-3 font-mono text-xs dark:bg-white/5">
                  {item.dsl}
                </pre>
                {'link' in item && item.link ? (
                  <p className="mt-3 break-all font-mono text-xs opacity-60">{item.link}</p>
                ) : null}
              </article>
            ))}
          </div>
        </section>

        <section className="py-8" data-reveal>
          <h2 className="mb-4 text-lg font-semibold">DSL quick reference</h2>
          <div className="grid auto-rows-[9rem] grid-flow-dense grid-cols-1 gap-4 md:grid-cols-4">
            <div className="rounded-3xl border border-(--border-color) bg-(--block-color) p-5 md:col-span-2 md:row-span-2">
              <p className="text-sm opacity-60">Single block</p>
              <code className="mt-3 block font-mono text-sm">25m work [emoji:💻, color:orange]</code>
            </div>
            <div className="rounded-3xl border border-(--border-color) bg-(--block-color) p-5 md:col-span-2">
              <p className="text-sm opacity-60">Sequence</p>
              <code className="mt-3 block font-mono text-sm">25m work + 5m rest</code>
            </div>
            <div className="rounded-3xl border border-(--border-color) bg-(--block-color) p-5 md:col-span-1">
              <p className="text-sm opacity-60">Loop</p>
              <code className="mt-3 block break-all font-mono text-sm">4 * (25m work + 5m rest)</code>
            </div>
            <div className="rounded-3xl border border-(--border-color) bg-(--block-color) p-5 md:col-span-1">
              <p className="text-sm opacity-60">Units</p>
              <code className="mt-3 block font-mono text-sm">h, m, s</code>
            </div>
            <div className="rounded-3xl border border-(--border-color) bg-(--block-color) p-5 md:col-span-2">
              <p className="text-sm opacity-60">Attributes</p>
              <code className="mt-3 block font-mono text-sm">color, emoji, skippable, retry, hold</code>
            </div>
            <div className="rounded-3xl border border-(--border-color) bg-(--block-color) p-5 md:col-span-2">
              <p className="text-sm opacity-60">Colors</p>
              <code className="mt-3 block font-mono text-sm">orange, teal, blue, purple, rose, amber</code>
            </div>
          </div>
        </section>

        <section className="flex flex-col gap-6 pb-16 md:flex-row md:items-end md:justify-between" data-reveal>
          <div className="max-w-xl space-y-3">
            <h2 className="text-lg font-semibold">Machine-readable playbook</h2>
            <p className="leading-relaxed opacity-80">Full syntax, encoding, and examples, with no JavaScript required.</p>
            <ul className="space-y-2 text-sm leading-relaxed opacity-75">
              <li>Frontend-only. No accounts, no backend API.</li>
              <li>
                Session lives in <code className="rounded bg-black/20 px-1.5 py-0.5 dark:bg-white/5">?flow=</code>
              </li>
              <li>The DSL parser is the source of truth for syntax.</li>
              <li>
                In-app OpenRouter prompts live at{' '}
                <button type="button" className="underline" onClick={() => onNavigate('/prompts')}>
                  /prompts
                </button>{' '}
                and use a different JSON contract.
              </li>
            </ul>
          </div>
          <a
            href="/llms.txt"
            className="btn-primary-solid inline-flex min-h-14 items-center gap-2 rounded-full px-8 text-base font-semibold"
          >
            <ExternalLink size={18} />
            Open /llms.txt
          </a>
        </section>
      </main>
    </div>
  );
}
