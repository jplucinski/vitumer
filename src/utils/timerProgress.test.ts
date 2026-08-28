import { describe, expect, it } from 'vitest';
import {
  TIMER_PROGRESS_TTL_MS,
  formatClock,
  parseTimerProgress,
  resolveTimerZeroAction,
  restoreTimerProgress,
} from './timerProgress';

const blocks = [
  { id: '1', duration: 1500 },
  { id: '2', duration: 300 },
];

const paused = {
  activeBlockId: '2',
  remainingSeconds: 215,
  lastTimestamp: 1_000_000,
  isPaused: true,
};

describe('restoreTimerProgress', () => {
  it('returns paused remaining unchanged inside the TTL', () => {
    expect(restoreTimerProgress(blocks, JSON.stringify(paused), 1_000_000)).toEqual({
      blockIndex: 1,
      remainingSeconds: 215,
      isPaused: true,
      awaitingNext: false,
    });
  });

  it('subtracts elapsed seconds when the timer was running', () => {
    const running = { ...paused, isPaused: false };
    expect(restoreTimerProgress(blocks, JSON.stringify(running), 1_000_000 + 10_000)).toEqual({
      blockIndex: 1,
      remainingSeconds: 205,
      isPaused: false,
      awaitingNext: false,
    });
  });

  it('clamps running remainder at 0', () => {
    const running = { ...paused, isPaused: false, remainingSeconds: 3 };
    expect(restoreTimerProgress(blocks, JSON.stringify(running), 1_000_000 + 10_000)).toEqual({
      blockIndex: 1,
      remainingSeconds: 0,
      isPaused: false,
      awaitingNext: false,
    });
  });

  it('returns null when TTL has expired', () => {
    expect(
      restoreTimerProgress(
        blocks,
        JSON.stringify(paused),
        paused.lastTimestamp + TIMER_PROGRESS_TTL_MS
      )
    ).toBeNull();
  });

  it('returns null for an unknown block id', () => {
    expect(
      restoreTimerProgress(
        blocks,
        JSON.stringify({ ...paused, activeBlockId: 'missing' }),
        1_000_000
      )
    ).toBeNull();
  });

  it('returns null for invalid JSON, null raw, and missing fields', () => {
    expect(restoreTimerProgress(blocks, null, 1_000_000)).toBeNull();
    expect(restoreTimerProgress(blocks, '{', 1_000_000)).toBeNull();
    expect(restoreTimerProgress(blocks, JSON.stringify({ activeBlockId: '2' }), 1_000_000)).toBeNull();
  });

  it('restores a hold gate without subtracting elapsed', () => {
    const gated = {
      activeBlockId: '1',
      remainingSeconds: 0,
      lastTimestamp: 1_000_000,
      isPaused: false,
      awaitingNext: true,
    };
    expect(restoreTimerProgress(blocks, JSON.stringify(gated), 1_000_000 + 30_000)).toEqual({
      blockIndex: 0,
      remainingSeconds: 0,
      isPaused: true,
      awaitingNext: true,
    });
  });
});

describe('parseTimerProgress awaitingNext', () => {
  it('coerces non-boolean awaitingNext to false', () => {
    const parsed = parseTimerProgress(
      JSON.stringify({
        activeBlockId: '1',
        remainingSeconds: 10,
        lastTimestamp: 1,
        isPaused: true,
        awaitingNext: 'yes',
      })
    );
    expect(parsed?.awaitingNext).toBe(false);
  });
});

describe('resolveTimerZeroAction', () => {
  it('awaits next when hold and a successor exist', () => {
    expect(resolveTimerZeroAction({ hold: true }, true)).toBe('awaitNext');
  });

  it('completes the last block even with hold', () => {
    expect(resolveTimerZeroAction({ hold: true }, false)).toBe('complete');
  });

  it('completes when hold is absent or false', () => {
    expect(resolveTimerZeroAction({}, true)).toBe('complete');
    expect(resolveTimerZeroAction({ hold: false }, true)).toBe('complete');
    expect(resolveTimerZeroAction(undefined, true)).toBe('complete');
  });
});

describe('formatClock', () => {
  it('pads mm:ss', () => {
    expect(formatClock(215)).toBe('03:35');
    expect(formatClock(0)).toBe('00:00');
  });
});
