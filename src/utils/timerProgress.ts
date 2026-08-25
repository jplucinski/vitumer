export const TIMER_PROGRESS_TTL_MS = 30 * 60 * 1000;

export type TimerProgress = {
  activeBlockId: string | number;
  remainingSeconds: number;
  lastTimestamp: number;
  isPaused: boolean;
};

export type RestoredTimer = {
  blockIndex: number;
  remainingSeconds: number;
  isPaused: boolean;
};

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
    return { activeBlockId, remainingSeconds, lastTimestamp, isPaused };
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

  let remainingSeconds = progress.remainingSeconds;
  if (!progress.isPaused) {
    const elapsed = Math.floor((now - progress.lastTimestamp) / 1000);
    remainingSeconds = Math.max(0, progress.remainingSeconds - elapsed);
  }

  return {
    blockIndex,
    remainingSeconds,
    isPaused: progress.isPaused,
  };
}

export function formatClock(totalSeconds: number): string {
  const clamped = Math.max(0, Math.floor(totalSeconds));
  const m = Math.floor(clamped / 60);
  const s = clamped % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}
