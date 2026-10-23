// src/components/FocusView.tsx
import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Square, SkipForward, ChevronUp, ChevronDown, RotateCcw, RefreshCcw, Volume2, VolumeX, X } from 'lucide-react';
import clsx from 'clsx';
import { FlowBlock } from '../utils/dslParser';
import { getColorBadgeClasses, getColorBorderClass, getColorPulseClass } from '../constants/blockOptions';
import { STORAGE_KEYS } from '../constants/storageKeys';
import { FOCUS_IMMERSIVE_QUERY } from '../constants/breakpoints';
import { resolveTimerZeroAction, restoreTimerProgress, type RestoredTimer, type TimerProgress } from '../utils/timerProgress';
import { gsap, useGSAP } from '../utils/gsap';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { useScreenWakeLock } from '../hooks/useScreenWakeLock';

const REST_LABELS = ['break', 'rest', 'przerwa', 'przerwa-kawa'];

function isRestBlock(block?: FlowBlock): boolean {
  if (!block) return false;
  return REST_LABELS.includes(block.label.toLowerCase());
}

interface FocusViewProps {
  blocks: FlowBlock[];
  toggleFocusMode: () => void;
  setBlocks: React.Dispatch<React.SetStateAction<FlowBlock[]>>;
}

const FocusView: React.FC<FocusViewProps> = ({ blocks, toggleFocusMode, setBlocks }) => {
  const [isTimelineOpen, setIsTimelineOpen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const [restoredInit] = useState<RestoredTimer | null>(() =>
    restoreTimerProgress(
      blocks,
      localStorage.getItem(STORAGE_KEYS.timerProgress),
      Date.now()
    )
  );

  const [currentBlockIndex, setCurrentBlockIndex] = useState(() => {
    if (restoredInit) return restoredInit.blockIndex;
    const activeIdx = blocks.findIndex((b) => b.active);
    const nextIdx = activeIdx !== -1 ? activeIdx : blocks.findIndex((b) => !b.completed);
    return nextIdx !== -1 ? nextIdx : 0;
  });

  const [remainingSeconds, setRemainingSeconds] = useState(() => {
    if (restoredInit) return restoredInit.remainingSeconds;
    const activeIdx = blocks.findIndex((b) => b.active);
    const nextIdx = activeIdx !== -1 ? activeIdx : blocks.findIndex((b) => !b.completed);
    const idx = nextIdx !== -1 ? nextIdx : 0;
    return blocks[idx]?.duration ?? 0;
  });

  const [isPaused, setIsPaused] = useState(() => restoredInit?.isPaused ?? true);
  const [awaitingNext, setAwaitingNext] = useState(() => restoredInit?.awaitingNext ?? false);

  const activeBlock = blocks[currentBlockIndex] || blocks[0];
  const isLastBlock = currentBlockIndex >= blocks.length - 1;
  const nextBlock = blocks[currentBlockIndex + 1];
  const canSkip = !isLastBlock && (Boolean(activeBlock?.skippable) || awaitingNext);
  const canRetry = Boolean(activeBlock?.retryable) || awaitingNext;

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const persistEnabledRef = useRef(true);
  const stageRef = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();
  const holdWakeLock = useScreenWakeLock(!isPaused || awaitingNext);

  useGSAP(() => {
    if (reducedMotion || !stageRef.current) return;
    gsap.from(stageRef.current, {
      opacity: 0,
      scale: 0.96,
      duration: 0.65,
      ease: 'power2.out',
    });
  }, { dependencies: [reducedMotion] });

  const playChime = () => {
    if (!soundEnabled) return;
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();

      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gainNode = ctx.createGain();

      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(523.25, ctx.currentTime);
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(659.25, ctx.currentTime);

      gainNode.gain.setValueAtTime(0.2, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.5);

      osc1.connect(gainNode);
      osc2.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc1.start();
      osc2.start();
      osc1.stop(ctx.currentTime + 1.5);
      osc2.stop(ctx.currentTime + 1.5);
    } catch (err) {
      console.error('Web Audio API chime failed', err);
    }
  };

  // Mount-only: mark the restored index as active once.
  useEffect(() => {
    setBlocks((prev) =>
      prev.map((b, idx) => ({
        ...b,
        active: idx === currentBlockIndex,
      }))
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount-only
  }, []);

  const handleBlockCompleted = () => {
    setAwaitingNext(false);

    setBlocks(prev => prev.map((b, idx) => {
      if (idx === currentBlockIndex) {
        return { ...b, completed: true, active: false };
      }
      if (currentBlockIndex < blocks.length - 1 && idx === currentBlockIndex + 1) {
        return { ...b, active: true };
      }
      return b;
    }));

    if (currentBlockIndex < blocks.length - 1) {
      const nextIndex = currentBlockIndex + 1;
      setCurrentBlockIndex(nextIndex);
      setRemainingSeconds(blocks[nextIndex]?.duration ?? 0);
      setIsPaused(false);
    } else {
      localStorage.removeItem(STORAGE_KEYS.timerProgress);
      setIsPaused(true);
      alert('All blocks completed!');
    }
  };

  useEffect(() => {
    if (isPaused) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    const endTime = Date.now() + remainingSeconds * 1000;

    timerRef.current = setInterval(() => {
      const remaining = Math.max(0, Math.round((endTime - Date.now()) / 1000));
      setRemainingSeconds(remaining);

      if (remaining === 0) {
        if (timerRef.current) clearInterval(timerRef.current);
        playChime();
        const hasNext = currentBlockIndex < blocks.length - 1;
        if (resolveTimerZeroAction(blocks[currentBlockIndex], hasNext) === 'awaitNext') {
          setAwaitingNext(true);
          setIsPaused(true);
          setRemainingSeconds(0);
        } else {
          handleBlockCompleted();
        }
      }
    }, 100);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- interval identity is isPaused/index/remaining
  }, [isPaused, currentBlockIndex, remainingSeconds]);

  useEffect(() => {
    if (!persistEnabledRef.current || !activeBlock) return;
    const atHoldGate =
      awaitingNext ||
      (remainingSeconds === 0 &&
        resolveTimerZeroAction(activeBlock, currentBlockIndex < blocks.length - 1) === 'awaitNext');
    const progress: TimerProgress = {
      activeBlockId: activeBlock.id,
      remainingSeconds: atHoldGate ? 0 : remainingSeconds,
      lastTimestamp: Date.now(),
      isPaused: atHoldGate ? true : isPaused,
      awaitingNext: atHoldGate
    };
    localStorage.setItem(STORAGE_KEYS.timerProgress, JSON.stringify(progress));
  }, [remainingSeconds, isPaused, awaitingNext, activeBlock, currentBlockIndex, blocks.length]);

  const handleNext = () => {
    if (!canSkip) return;
    if (currentBlockIndex < blocks.length - 1) {
      const leaveGate = awaitingNext;
      setAwaitingNext(false);
      const nextIndex = currentBlockIndex + 1;
      setBlocks((prev) =>
        prev.map((b, idx) => {
          if (idx === currentBlockIndex) return { ...b, completed: true, active: false };
          if (idx === nextIndex) return { ...b, active: true };
          return b;
        })
      );
      setCurrentBlockIndex(nextIndex);
      setRemainingSeconds(blocks[nextIndex]?.duration ?? 0);
      if (leaveGate) setIsPaused(false);
    }
  };

  const handlePrevious = () => {
    if (currentBlockIndex > 0) {
      setAwaitingNext(false);
      const prevIndex = currentBlockIndex - 1;
      setBlocks((prev) =>
        prev.map((b, idx) => {
          if (idx === prevIndex) return { ...b, completed: false, active: true };
          if (idx === currentBlockIndex) return { ...b, active: false };
          return b;
        })
      );
      setCurrentBlockIndex(prevIndex);
      setRemainingSeconds(blocks[prevIndex]?.duration ?? 0);
    }
  };

  const retryBlock = () => {
    if (!canRetry) return;
    setAwaitingNext(false);
    if (activeBlock) {
      setRemainingSeconds(activeBlock.duration);
    }
  };

  const handleStop = () => {
    persistEnabledRef.current = false;
    localStorage.removeItem(STORAGE_KEYS.timerProgress);
    setBlocks(prev => prev.map((b, idx) => ({
      ...b,
      active: false,
      completed: idx < currentBlockIndex ? true : b.completed
    })));
    setAwaitingNext(false);
    toggleFocusMode();
  };

  const resetSession = () => {
    persistEnabledRef.current = false;
    localStorage.removeItem(STORAGE_KEYS.timerProgress);
    setBlocks(prev => prev.map(b => ({ ...b, completed: false, active: false })));
    setCurrentBlockIndex(0);
    setRemainingSeconds(blocks[0]?.duration ?? 0);
    setIsPaused(true);
    setAwaitingNext(false);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (awaitingNext && (e.code === 'Space' || e.key === 'Enter')) {
        e.preventDefault();
        void holdWakeLock();
        handleBlockCompleted();
        return;
      }
      if (e.code === 'Space') {
        e.preventDefault();
        if (isPaused) void holdWakeLock();
        setIsPaused(p => !p);
      } else if (e.key === 'ArrowRight' && canSkip) {
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        handlePrevious();
      } else if (e.key === 'Escape') {
        handleStop();
      } else if ((e.key === 'r' || e.key === 'R') && canRetry) {
        retryBlock();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- handlers close over latest index/flags
  }, [currentBlockIndex, activeBlock, blocks.length, awaitingNext, canSkip, canRetry, isPaused, holdWakeLock]);

  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return;
    const media = window.matchMedia(FOCUS_IMMERSIVE_QUERY);
    const closeIfImmersive = () => {
      if (media.matches) setIsTimelineOpen(false);
    };
    closeIfImmersive();
    media.addEventListener('change', closeIfImmersive);
    return () => media.removeEventListener('change', closeIfImmersive);
  }, []);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const upcomingBlocks = blocks.slice(currentBlockIndex + 1, currentBlockIndex + 4);
  const completedBlocks = blocks.slice(Math.max(0, currentBlockIndex - 2), currentBlockIndex);
  const completedCount = blocks.filter(b => b.completed).length;
  const totalDuration = activeBlock ? activeBlock.duration : 1;
  const progressPercent = ((totalDuration - remainingSeconds) / totalDuration) * 100;

  const renderTimeline = (showMobileHeader = false) => (
    <>
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="text-sm font-medium">Timeline</h3>
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs text-(--muted-text)">
            {completedCount}/{blocks.length}
          </span>
          {showMobileHeader && (
            <button
              type="button"
              onClick={() => setIsTimelineOpen(false)}
              className="rounded-md p-1 text-(--text-color) hover:bg-(--block-color)"
              aria-label="Close timeline"
            >
              <X size={18} />
            </button>
          )}
        </div>
      </div>
      <div className="relative max-h-[50vh] space-y-5 overflow-y-auto md:max-h-[60vh] before:absolute before:inset-y-2 before:left-[11px] before:w-px before:bg-(--border-color)">
        {completedBlocks.map((block, i) => (
          <div key={`comp-${i}`} className="relative z-10 flex gap-4 text-(--muted-text)">
            <div className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-full border-2 border-(--border-color) bg-(--bg-color)">
              <div className="h-2 w-2 rounded-full bg-(--muted-text)" />
            </div>
            <div className="font-mono text-sm">
              <div className="line-through">{block.label}</div>
              <div className="text-xs">{formatTime(block.duration)}</div>
            </div>
          </div>
        ))}

        {activeBlock && (
          <div className="relative z-10 flex gap-4">
            <div className={clsx(
              'mt-0.5 flex h-6 w-6 items-center justify-center rounded-full border-2 bg-(--bg-color)',
              getColorBorderClass(activeBlock.color)
            )}>
              <div className={clsx('h-2.5 w-2.5 rounded-full motion-safe:animate-pulse', getColorPulseClass(activeBlock.color))} />
            </div>
            <div className="font-mono text-sm font-semibold">
              <div className="flex items-center gap-1.5">
                {activeBlock.emoji && <span>{activeBlock.emoji}</span>}
                {activeBlock.label}
              </div>
              <div className="flex gap-2 text-xs font-normal text-(--muted-text)">
                <span>{formatTime(activeBlock.duration)}</span>
                {activeBlock.description && (
                  <span className="max-w-[150px] truncate">{activeBlock.description}</span>
                )}
              </div>
            </div>
          </div>
        )}

        {upcomingBlocks.map((block, i) => (
          <div key={`up-${i}`} className="relative z-10 flex gap-4">
            <div className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-full border-2 border-(--border-color) bg-(--bg-color)" />
            <div className="font-mono text-sm">
              <div>{block.label}</div>
              <div className="text-xs text-(--muted-text)">{formatTime(block.duration)}</div>
            </div>
          </div>
        ))}
      </div>
    </>
  );

  return (
    <div className="focus-split mt-4 px-0 sm:mt-8">
      <div className="focus-split-main">
        <div
          ref={stageRef}
          className="focus-split-stage relative flex-1 flex flex-col items-center justify-center text-center gap-6 w-full min-w-0 py-4"
          onClick={() => {
            if (awaitingNext) handleBlockCompleted();
          }}
        >
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 -z-10"
            style={{
              background:
                'radial-gradient(circle at 50% 40%, var(--accent-glow), transparent 55%)',
            }}
          />
          {!(awaitingNext && nextBlock) && (
            <>
          <div className={clsx(
            'focus-split-badge inline-flex items-center gap-2 rounded-full px-4 py-1.5 font-mono text-sm font-medium',
            getColorBadgeClasses(activeBlock?.color)
          )}>
            {activeBlock?.emoji && <span>{activeBlock.emoji}</span>}
            {activeBlock?.label || 'No block'}
          </div>
          {activeBlock?.description && (
            <div className="focus-split-description line-clamp-2 max-w-[90vw] px-4 font-mono text-sm text-(--muted-text) md:max-w-md">
              {activeBlock.description}
            </div>
          )}

          <div className="relative">
            <div
              className={clsx(
                'focus-timer relative',
                isRestBlock(activeBlock) ? 'focus-timer--rest' : 'focus-timer--work'
              )}
            >
              {formatTime(remainingSeconds)}
            </div>
          </div>

          <div className="focus-split-immersive-progress w-full max-w-md h-1 bg-black/5 dark:bg-white/5 rounded-full overflow-hidden">
            <div
              className="meter-fill h-full"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
            </>
          )}

          {awaitingNext && nextBlock && (
            <div className="flex flex-col items-center gap-3 px-4 max-w-md w-full">
              <p className="font-mono text-sm text-(--muted-text)">
                Tap, Space, or Enter
              </p>
              <div
                className={clsx(
                  'w-full rounded-2xl border px-4 py-5 flex flex-col items-center gap-2 text-center',
                  getColorBorderClass(nextBlock.color),
                  getColorBadgeClasses(nextBlock.color)
                )}
              >
                {nextBlock.emoji && <span className="text-3xl">{nextBlock.emoji}</span>}
                <div className="font-mono font-bold">{nextBlock.label}</div>
                <div className="font-mono text-xs text-(--muted-text)">{formatTime(nextBlock.duration)}</div>
              </div>
            </div>
          )}
        </div>

        <div className="focus-controls flex flex-wrap items-center justify-center gap-2 sm:gap-3">
            <button
              onClick={resetSession}
              title="Reset Session"
              type="button"
              className="focus-control-btn w-10 h-10 sm:w-12 sm:h-12"
            >
              <RefreshCcw size={20} />
            </button>
            <button
              onClick={() => {
                if (awaitingNext) {
                  void holdWakeLock();
                  handleBlockCompleted();
                  return;
                }
                if (isPaused) void holdWakeLock();
                setIsPaused(p => !p);
              }}
              type="button"
              aria-label={awaitingNext ? 'Start next slot' : isPaused ? 'Play' : 'Pause'}
              className="focus-control-btn is-emphasis h-12 w-12 shadow-md hover:scale-[1.02] sm:h-14 sm:w-14"
            >
              {awaitingNext || isPaused ? <Play size={24} fill="currentColor" className="ml-1" /> : <Pause size={24} fill="currentColor" />}
            </button>
            {canRetry && (
            <button
              onClick={retryBlock}
              title="Restart Block (R)"
              type="button"
              className="focus-control-btn w-10 h-10 sm:w-12 sm:h-12"
            >
              <RotateCcw size={20} />
            </button>
            )}
            <button
              onClick={handleStop}
              title="Exit Focus Mode (ESC)"
              type="button"
              className="focus-control-btn w-10 h-10 sm:w-12 sm:h-12"
            >
              <Square size={20} />
            </button>
            {canSkip && (
              <button
                onClick={handleNext}
                title="Skip Block (Right Arrow)"
                type="button"
                className="focus-control-btn w-10 h-10 sm:w-12 sm:h-12"
              >
                <SkipForward size={20} />
              </button>
            )}
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              title={soundEnabled ? 'Disable Sound' : 'Enable Sound'}
              type="button"
              className="focus-control-btn w-10 h-10 sm:w-12 sm:h-12"
            >
              {soundEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
            </button>
          </div>

        <div className="focus-split-mobile-timeline w-full shrink-0 mt-2 rounded-2xl border border-(--border-color) overflow-hidden bg-(--block-color)/50">
          <button
            onClick={() => setIsTimelineOpen(!isTimelineOpen)}
            type="button"
            aria-expanded={isTimelineOpen}
            className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-(--bg-color)"
          >
            <span className="text-sm">Timeline</span>
            <span className="flex items-center gap-2 font-mono text-xs text-(--muted-text)">
              {completedCount}/{blocks.length}
              {isTimelineOpen ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
            </span>
          </button>
          <div className="h-1 bg-black/5 dark:bg-white/5">
            <div
              className="meter-fill h-full"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      <div className="focus-split-sidebar">
        {renderTimeline()}
      </div>

      {isTimelineOpen && (
        <button
          type="button"
          aria-label="Close timeline"
          className="focus-split-backdrop fixed inset-0 bg-black/60 z-40"
          onClick={() => setIsTimelineOpen(false)}
        />
      )}

      <div
        className={clsx(
          'focus-split-sheet fixed inset-x-0 bottom-0 z-50 max-h-[70vh] overflow-y-auto rounded-t-2xl border-t border-(--border-color) bg-(--bg-color) p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] shadow-2xl transition-transform duration-300 ease-in-out',
          isTimelineOpen ? 'translate-y-0' : 'pointer-events-none translate-y-full'
        )}
        aria-hidden={!isTimelineOpen}
      >
        <div className="mx-auto mb-4 h-1 w-12 rounded-full bg-(--border-color)" />
        {isTimelineOpen && renderTimeline(true)}
      </div>
    </div>
  );
};

export default FocusView;
