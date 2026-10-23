import { Play, RefreshCcw } from 'lucide-react';
import { FlowBlock } from '../utils/dslParser';
import { swatch } from '../constants/blockOptions';
import { formatClock, type RestoredTimer } from '../utils/timerProgress';

type Props = {
  blocks: FlowBlock[];
  onStart: () => void;
  onReset: () => void;
  resume: RestoredTimer | null;
  connectionLabel: string;
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

const SessionLaunchCard = ({ blocks, onStart, onReset, resume, connectionLabel }: Props) => {
  const totalSeconds = blocks.reduce((sum, block) => sum + block.duration, 0);
  const completedCount = blocks.filter((block) => block.completed).length;
  const nextBlock = blocks.find((block) => !block.completed) ?? blocks[0];
  const canStart = blocks.length > 0;
  const allCompleted = canStart && completedCount === blocks.length;
  const showResume = Boolean(resume) && !allCompleted;
  const displayBlock = (showResume && resume ? blocks[resume.blockIndex] : null) ?? nextBlock;
  const displayDuration = showResume && resume
    ? formatClock(resume.remainingSeconds)
    : formatBlockDuration(displayBlock?.duration ?? 0);

  const finding = !canStart
    ? 'Add a block, then start.'
    : allCompleted
      ? 'Every block is done. Reset to run it again.'
      : `Next is ${displayBlock?.label || 'untitled'}, ${displayDuration}${
          displayBlock?.description ? `. ${displayBlock.description}` : ''
        }`;

  return (
    <section aria-label="Session launch">
      <div className="session-lead">
        <div className="min-w-0">
          <div className="flex items-baseline justify-between gap-3">
            <h1 className="screen-title">Session</h1>
            <p className="text-xs text-(--muted-text)">{connectionLabel}</p>
          </div>
          {canStart ? (
            <p className="session-total num">
              {formatDuration(totalSeconds)}
              <span>
                {' '}
                · {blocks.length} {blocks.length === 1 ? 'block' : 'blocks'}
              </span>
            </p>
          ) : (
            <p className="session-total">0m</p>
          )}
          <p className="session-finding">{finding}</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onReset}
            disabled={!canStart}
            className="inline-flex min-h-11 items-center gap-2 rounded-full border border-(--outline-btn-border) px-4 text-sm text-(--text-color) hover:bg-(--surface-elevated) disabled:pointer-events-none disabled:opacity-40"
            type="button"
          >
            <RefreshCcw size={15} />
            Reset
          </button>
          <button
            onClick={onStart}
            disabled={!canStart}
            className="btn btn-primary-solid gap-2 px-5 py-2.5 text-sm disabled:pointer-events-none"
            type="button"
          >
            <Play size={16} fill="currentColor" />
            {showResume ? 'Resume' : 'Start'}
          </button>
        </div>
      </div>

      {canStart ? (
        <div className="session-strip" role="img" aria-label="Session divided by block length">
          {blocks.map((block) => (
            <span
              key={block.id}
              className={block.completed ? 'is-done' : undefined}
              style={{ flexGrow: block.duration, flexBasis: 0, background: swatch(block.color) }}
              title={`${block.label}, ${formatBlockDuration(block.duration)}`}
            />
          ))}
        </div>
      ) : null}
    </section>
  );
};

export default SessionLaunchCard;
