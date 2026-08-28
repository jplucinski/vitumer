export const TIMER_PROGRESS_TTL_MS = 30 * 60 * 1000;

export type TimerProgress = {
  activeBlockId: string | number;
  remainingSeconds: number;
  lastTimestamp: number;
  isPaused: boolean;
  awaitingNext?: boolean;
};

export type RestoredTimer = {
  blockIndex: number;
  remainingSeconds: number;
  isPaused: boolean;
  awaitingNext: boolean;
};

export type TimerZeroAction = 'complete' | 'awaitNext';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export function parseTimerProgress(raw: string | null): TimerProgress | null {
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!isRecord(parsed)) return null;
    const { activeBlockId, remainingSeconds, lastTimestamp, isPaused } = parsed;
    if (
      (typeof activeBlockId !== 'string' && typeof activeBlockId !== 'number') ||
      typeof remainingSeconds !== 'number' ||
      typeof lastTimestamp !== 'number' ||
      typeof isPaused !== 'boolean' ||
      !Number.isFinite(remainingSeconds) ||
      !Number.isFinite(lastTimestamp)
    ) {
      return null;
    }
    const awaitingNext = parsed.awaitingNext === true;
    return { activeBlockId, remainingSeconds, lastTimestamp, isPaused, awaitingNext };
  } catch {
    return null;
  }
}

export function restoreTimerProgress(
  blocks: Array<{ id: string | number }>,
  raw: string | null,
  now: number,
  ttlMs: number = TIMER_PROGRESS_TTL_MS
): RestoredTimer | null {
  const progress = parseTimerProgress(raw);
  if (!progress) return null;

  const blockIndex = blocks.findIndex((block) => block.id === progress.activeBlockId);
  if (blockIndex === -1) return null;
  if (now - progress.lastTimestamp >= ttlMs) return null;

  if (progress.awaitingNext) {
    return {
      blockIndex,
      remainingSeconds: 0,
      isPaused: true,
      awaitingNext: true,
    };
  }

  let remainingSeconds = progress.remainingSeconds;
  if (!progress.isPaused) {
    const elapsed = Math.floor((now - progress.lastTimestamp) / 1000);
    remainingSeconds = Math.max(0, progress.remainingSeconds - elapsed);
  }

  return {
    blockIndex,
    remainingSeconds,
    isPaused: progress.isPaused,
    awaitingNext: false,
  };
}

export function resolveTimerZeroAction(
  block: { hold?: boolean } | undefined,
  hasNextBlock: boolean
): TimerZeroAction {
  if (block?.hold === true && hasNextBlock) return 'awaitNext';
  return 'complete';
}

export function formatClock(totalSeconds: number): string {
  const clamped = Math.max(0, Math.floor(totalSeconds));
  const m = Math.floor(clamped / 60);
  const s = clamped % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}
