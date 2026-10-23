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
      className="surface-card sticky top-4 z-20 rounded-2xl border border-(--border-color) p-5 sm:p-6"
    >
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-3 min-w-0">
          <div className="text-sm font-medium">
            {showResume ? 'Pick up where you left off' : 'Ready when you are'}
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
                <p className="text-sm font-mono text-(--muted-text)">All blocks completed. Reset to run again.</p>
              ) : (
                <div className="space-y-1.5 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-mono text-(--muted-text)">Next</span>
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
                      className="meter-fill h-full rounded-full"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>
              )}
            </>
          ) : (
            <p className="text-sm font-mono leading-relaxed text-(--muted-text)">
              Add blocks with AI or the DSL editor to start a session.
            </p>
          )}
        </div>

        <div className="flex flex-col items-stretch lg:items-end gap-2 shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={onReset}
              disabled={!canStart}
              className="rounded-xl border border-(--border-color) px-4 py-2.5 text-sm font-medium text-(--text-color) transition-colors hover:bg-(--block-color) disabled:pointer-events-none disabled:opacity-30"
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
              className="btn btn-primary-solid gap-2 px-6 py-3 text-sm font-semibold disabled:pointer-events-none"
              type="button"
            >
              <Play size={16} fill="currentColor" />
              {showResume ? 'Resume Session' : 'Start Session'}
            </button>
          </div>
          {canStart && (
            <span className="text-right font-mono text-[11px] text-(--muted-text)">
              {showResume ? 'Press F to resume' : 'Press F to start'}
            </span>
          )}
        </div>
      </div>
    </section>
  );
};

export default SessionLaunchCard;
