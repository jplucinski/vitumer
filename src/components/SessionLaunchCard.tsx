import { Play, RefreshCcw } from 'lucide-react';
import clsx from 'clsx';
import { FlowBlock } from '../utils/dslParser';
import { getColorBadgeClasses } from '../constants/blockOptions';
import { formatClock, type RestoredTimer } from '../utils/timerProgress';

type Props = {
  blocks: FlowBlock[];
  onStart: () => void;
  onReset: () => void;
  resume: RestoredTimer | null;
};

function formatDuration(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  const parts: string[] = [];
  if (h > 0) parts.push(`${h}h`);
  if (m > 0) parts.push(`${m}m`);
  if (s > 0 || parts.length === 0) parts.push(`${s}s`);
  return parts.join(' ');
}

function formatBlockDuration(seconds: number): string {
  if (seconds >= 3600 && seconds % 3600 === 0) return `${seconds / 3600}h`;
  if (seconds >= 60 && seconds % 60 === 0) return `${seconds / 60}m`;
  return `${seconds}s`;
}

const SessionLaunchCard = ({ blocks, onStart, onReset, resume }: Props) => {
  const totalSeconds = blocks.reduce((sum, block) => sum + block.duration, 0);
  const completedCount = blocks.filter((block) => block.completed).length;
  const nextBlock = blocks.find((block) => !block.completed) ?? blocks[0];
  const canStart = blocks.length > 0;
  const allCompleted = canStart && completedCount === blocks.length;
  const progressPercent = canStart ? Math.round((completedCount / blocks.length) * 100) : 0;
  const showResume = Boolean(resume) && !allCompleted;
  const displayBlock = (showResume && resume ? blocks[resume.blockIndex] : null) ?? nextBlock;
  const displayDuration = showResume && resume
    ? formatClock(resume.remainingSeconds)
    : formatBlockDuration(displayBlock?.duration ?? 0);

  return (
    <section
      aria-label="Session launch"
      className="surface-card rounded-3xl border border-blue-500/25 bg-linear-to-br from-blue-500/8 via-transparent to-transparent p-5 sm:p-6 sticky top-4 z-20"
    >
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-3 min-w-0">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-2 w-2 rounded-full bg-blue-400 shadow-[0_0_10px_rgba(96,165,250,0.8)]" />
            <div className="text-xs font-mono uppercase tracking-[0.24em] text-blue-300/80">
              {showResume ? 'Resume focus' : 'Ready to focus'}
            </div>
          </div>

          {canStart ? (
            <>
              <p className="font-mono text-base sm:text-lg">
                <span className="font-semibold">{blocks.length}</span>
                <span className="opacity-60">
                  {' '}
                  {blocks.length === 1 ? 'block' : 'blocks'} · {formatDuration(totalSeconds)} total
                </span>
              </p>

              {allCompleted ? (
                <p className="text-sm opacity-60 font-mono">All blocks completed — reset to run again.</p>
              ) : (
                <div className="space-y-1.5 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-mono uppercase tracking-wider opacity-40">Next</span>
                    <span
                      className={clsx(
                        'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono tracking-wide uppercase',
                        getColorBadgeClasses(displayBlock?.color)
                      )}
                    >
                      {displayBlock?.emoji && <span>{displayBlock.emoji}</span>}
                      {displayBlock?.label}
                      <span className="opacity-70 normal-case">· {displayDuration}</span>
                    </span>
                  </div>
                  {displayBlock?.description && (
                    <p className="text-xs font-mono opacity-50 leading-relaxed">{displayBlock.description}</p>
                  )}
                </div>
              )}

              {completedCount > 0 && !allCompleted && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-mono opacity-50">
                    <span>
                      {completedCount}/{blocks.length} completed
                    </span>
                    <span>{progressPercent}%</span>
                  </div>
                  <div
                    className="h-1.5 w-full rounded-full bg-black/10 dark:bg-white/10 overflow-hidden"
                    role="progressbar"
                    aria-valuenow={completedCount}
                    aria-valuemin={0}
                    aria-valuemax={blocks.length}
                    aria-label="Session progress"
                  >
                    <div
                      className="h-full rounded-full bg-blue-500 transition-all duration-500 ease-out"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>
              )}
            </>
          ) : (
            <p className="text-sm opacity-60 font-mono leading-relaxed">
              Add blocks with AI or the DSL editor to start a session.
            </p>
          )}
        </div>

        <div className="flex flex-col items-stretch lg:items-end gap-2 shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={onReset}
              disabled={!canStart}
              className="px-4 py-2.5 rounded-2xl border border-(--border-color) text-sm font-medium hover:bg-white/5 transition-colors opacity-70 hover:opacity-100 disabled:opacity-30 disabled:pointer-events-none"
              type="button"
            >
              <span className="inline-flex items-center gap-2">
                <RefreshCcw size={15} />
                Reset
              </span>
            </button>
            <button
              onClick={onStart}
              disabled={!canStart}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white text-black dark:bg-white dark:text-black rounded-2xl text-sm font-semibold hover:scale-[1.02] transition-transform shadow-xl disabled:opacity-30 disabled:pointer-events-none disabled:hover:scale-100"
              type="button"
            >
              <Play size={16} fill="currentColor" />
              {showResume ? 'Resume Session' : 'Start Session'}
            </button>
          </div>
          {canStart && (
            <span className="text-[11px] font-mono opacity-40 text-right">
              {showResume ? 'Press F to resume' : 'Press F to start'}
            </span>
          )}
        </div>
      </div>
    </section>
  );
};

export default SessionLaunchCard;
