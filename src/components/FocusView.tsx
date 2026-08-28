// src/components/FocusView.tsx
import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Square, SkipForward, ChevronUp, ChevronDown, RotateCcw, RefreshCcw, Volume2, VolumeX, X } from 'lucide-react';
import clsx from 'clsx';
import { FlowBlock } from '../utils/dslParser';
import { getColorBadgeClasses, getColorBorderClass, getColorPulseClass } from '../constants/blockOptions';
import { STORAGE_KEYS } from '../constants/storageKeys';
import { FOCUS_IMMERSIVE_QUERY } from '../constants/breakpoints';
import { restoreTimerProgress, type TimerProgress } from '../utils/timerProgress';

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

  const [currentBlockIndex, setCurrentBlockIndex] = useState(() => {
    const restoredInit = restoreTimerProgress(
      blocks,
      localStorage.getItem(STORAGE_KEYS.timerProgress),
      Date.now()
    );
    if (restoredInit) return restoredInit.blockIndex;
    const activeIdx = blocks.findIndex((b) => b.active);
    const nextIdx = activeIdx !== -1 ? activeIdx : blocks.findIndex((b) => !b.completed);
    return nextIdx !== -1 ? nextIdx : 0;
  });

  const [remainingSeconds, setRemainingSeconds] = useState(() => {
    const restoredInit = restoreTimerProgress(
      blocks,
      localStorage.getItem(STORAGE_KEYS.timerProgress),
      Date.now()
    );
    if (restoredInit) return restoredInit.remainingSeconds;
    const activeIdx = blocks.findIndex((b) => b.active);
    const nextIdx = activeIdx !== -1 ? activeIdx : blocks.findIndex((b) => !b.completed);
    const idx = nextIdx !== -1 ? nextIdx : 0;
    return blocks[idx]?.duration ?? 0;
  });

  const [isPaused, setIsPaused] = useState(() => {
    const restoredInit = restoreTimerProgress(
      blocks,
      localStorage.getItem(STORAGE_KEYS.timerProgress),
      Date.now()
    );
    return restoredInit?.isPaused ?? true;
  });

  const activeBlock = blocks[currentBlockIndex] || blocks[0];
  const isLastBlock = currentBlockIndex >= blocks.length - 1;

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const persistEnabledRef = useRef(true);

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

  useEffect(() => {
    setBlocks((prev) =>
      prev.map((b, idx) => ({
        ...b,
        active: idx === currentBlockIndex,
      }))
    );
  }, []);

  const handleBlockCompleted = () => {
    playChime();

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
        handleBlockCompleted();
      }
    }, 100);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPaused, currentBlockIndex, remainingSeconds]);

  useEffect(() => {
    if (!persistEnabledRef.current || !activeBlock) return;
    const progress: TimerProgress = {
      activeBlockId: activeBlock.id,
      remainingSeconds,
      lastTimestamp: Date.now(),
      isPaused
    };
    localStorage.setItem(STORAGE_KEYS.timerProgress, JSON.stringify(progress));
  }, [remainingSeconds, isPaused, activeBlock]);

  const handleNext = () => {
    if (currentBlockIndex < blocks.length - 1) {
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
    }
  };

  const handlePrevious = () => {
    if (currentBlockIndex > 0) {
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
    toggleFocusMode();
  };

  const resetSession = () => {
    persistEnabledRef.current = false;
    localStorage.removeItem(STORAGE_KEYS.timerProgress);
    setBlocks(prev => prev.map(b => ({ ...b, completed: false, active: false })));
    setCurrentBlockIndex(0);
    setRemainingSeconds(blocks[0]?.duration ?? 0);
    setIsPaused(true);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        setIsPaused(p => !p);
      } else if (e.key === 'ArrowRight' && currentBlockIndex < blocks.length - 1) {
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        handlePrevious();
      } else if (e.key === 'Escape') {
        handleStop();
      } else if (e.key === 'r' || e.key === 'R') {
        retryBlock();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentBlockIndex, activeBlock, blocks.length]);

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
      {showMobileHeader && (
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xs font-mono uppercase tracking-widest opacity-40">Timeline Flow</h3>
          <button
            type="button"
            onClick={() => setIsTimelineOpen(false)}
            className="p-1 rounded-md opacity-50 hover:opacity-100 hover:bg-white/5"
            aria-label="Close timeline"
          >
            <X size={18} />
          </button>
        </div>
      )}
      {!showMobileHeader && (
        <>
          <h3 className="text-xs font-mono uppercase tracking-widest opacity-40 mb-4">Timeline Flow</h3>
          <div className="mb-4 flex items-center justify-between gap-3 text-xs opacity-70">
            <span className="font-semibold">Upcoming blocks: {upcomingBlocks.length}</span>
            <span>Focus mode</span>
          </div>
        </>
      )}
      <div className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-xl md:shadow-none max-h-[50vh] md:max-h-[60vh] overflow-y-auto space-y-6 relative before:absolute before:inset-y-2 before:left-[11px] before:w-px before:bg-[var(--border-color)]">
        {completedBlocks.map((block, i) => (
          <div key={`comp-${i}`} className="flex gap-4 opacity-40 relative z-10">
            <div className="w-6 h-6 rounded-full bg-[var(--bg-color)] border-2 border-gray-400 flex items-center justify-center mt-0.5">
              <div className="w-2 h-2 rounded-full bg-gray-400" />
            </div>
            <div className="font-mono text-sm">
              <div className="line-through">{block.label}</div>
              <div className="text-xs opacity-70">{Math.floor(block.duration / 60)}m</div>
            </div>
          </div>
        ))}

        {activeBlock && (
          <div className="flex gap-4 relative z-10">
            <div className={clsx(
              'w-6 h-6 rounded-full bg-[var(--bg-color)] border-2 flex items-center justify-center mt-0.5 shadow-[0_0_10px_rgba(0,0,0,0.1)] dark:shadow-[0_0_10px_rgba(255,255,255,0.1)]',
              getColorBorderClass(activeBlock.color)
            )}>
              <div className={clsx('w-2.5 h-2.5 rounded-full animate-pulse', getColorPulseClass(activeBlock.color))} />
            </div>
            <div className="font-mono text-sm font-bold">
              <div className="flex items-center gap-1.5">
                {activeBlock.emoji && <span>{activeBlock.emoji}</span>}
                {activeBlock.label}
              </div>
              <div className="text-xs opacity-70 flex gap-2">
                <span>{Math.floor(activeBlock.duration / 60)}m</span>
                {activeBlock.description && (
                  <span className="opacity-50 truncate max-w-[150px]">{activeBlock.description}</span>
                )}
              </div>
            </div>
          </div>
        )}

        {upcomingBlocks.map((block, i) => (
          <div key={`up-${i}`} className="flex gap-4 opacity-60 relative z-10">
            <div className="w-6 h-6 rounded-full bg-[var(--bg-color)] border-2 border-(--border-color) flex items-center justify-center mt-0.5" />
            <div className="font-mono text-sm">
              <div>{block.label}</div>
              <div className="text-xs opacity-70">{Math.floor(block.duration / 60)}m</div>
            </div>
          </div>
        ))}
      </div>
    </>
  );

  return (
    <div className="focus-split mt-4 sm:mt-8 px-0 animate-in fade-in zoom-in-95 duration-300">
      <div className="focus-split-main">
        <div className="focus-split-stage flex-1 flex flex-col items-center justify-center text-center space-y-6 w-full min-w-0 py-4">
          <div className="focus-split-mobile-chips flex-wrap items-center justify-center gap-2 text-[10px] uppercase tracking-[0.2em] opacity-60 max-w-full px-2">
            <span className="px-3 py-1 rounded-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10">
              {completedCount}/{blocks.length} done
            </span>
            <span className="hidden min-[360px]:inline px-3 py-1 rounded-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10">
              Tap ▶ to start
            </span>
          </div>
          <div className="focus-split-desktop-chips flex-wrap items-center justify-center gap-3 text-[11px] uppercase tracking-[0.24em] opacity-60">
            <span className="px-3 py-1 rounded-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10">
              {completedCount}/{blocks.length} completed
            </span>
          </div>
          <div className={clsx(
            'inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-mono tracking-widest uppercase mb-4',
            getColorBadgeClasses(activeBlock?.color)
          )}>
            {activeBlock?.emoji && <span>{activeBlock.emoji}</span>}
            {activeBlock?.label || 'No block'}
          </div>
          {activeBlock?.description && (
            <div className="text-sm opacity-60 font-mono -mt-4 mb-2 max-w-[90vw] md:max-w-md line-clamp-2 px-4">
              {activeBlock.description}
            </div>
          )}

          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-white/5 blur-2xl opacity-40" aria-hidden />
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
              className="h-full bg-blue-500 dark:bg-blue-400 transition-all duration-300 ease-linear shadow-[0_0_10px_rgba(59,130,246,0.5)]"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
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
              onClick={() => setIsPaused(p => !p)}
              type="button"
              aria-label={isPaused ? 'Play' : 'Pause'}
              className="focus-control-btn w-12 h-12 sm:w-14 sm:h-14 bg-black text-white dark:bg-white dark:text-black hover:scale-[1.02] shadow-xl border-transparent opacity-100"
            >
              {isPaused ? <Play size={24} fill="currentColor" className="ml-1" /> : <Pause size={24} fill="currentColor" />}
            </button>
            <button
              onClick={retryBlock}
              title="Restart Block (R)"
              type="button"
              className="focus-control-btn w-10 h-10 sm:w-12 sm:h-12"
            >
              <RotateCcw size={20} />
            </button>
            <button
              onClick={handleStop}
              title="Exit Focus Mode (ESC)"
              type="button"
              className="focus-control-btn w-10 h-10 sm:w-12 sm:h-12"
            >
              <Square size={20} />
            </button>
            {!isLastBlock && (
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
            className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left hover:bg-white/[0.03] transition-colors"
          >
            <span className="text-[11px] font-mono uppercase tracking-[0.2em] opacity-50">Timeline</span>
            <span className="flex items-center gap-2 text-xs font-mono opacity-70">
              {completedCount}/{blocks.length}
              {upcomingBlocks.length > 0 && (
                <span className="opacity-50">· {upcomingBlocks.length} left</span>
              )}
              {isTimelineOpen ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
            </span>
          </button>
          <div className="h-1 bg-black/5 dark:bg-white/5">
            <div
              className="h-full bg-blue-500 dark:bg-blue-400 transition-all duration-300 ease-linear"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        <div className="focus-split-desktop-progress absolute bottom-0 left-0 w-full h-1 bg-black/5 dark:bg-white/5 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-500 dark:bg-blue-400 transition-all duration-300 ease-linear shadow-[0_0_10px_rgba(59,130,246,0.5)]"
            style={{ width: `${progressPercent}%` }}
          />
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
          'focus-split-sheet fixed inset-x-0 bottom-0 z-50 bg-[var(--bg-color)] border-t border-(--border-color) rounded-t-3xl shadow-2xl p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] transition-transform duration-300 ease-in-out max-h-[70vh] overflow-y-auto',
          isTimelineOpen ? 'translate-y-0' : 'translate-y-full pointer-events-none'
        )}
      >
        <div className="w-12 h-1 bg-[var(--border-color)] rounded-full mx-auto mb-4" />
        {renderTimeline(true)}
      </div>
    </div>
  );
};

export default FocusView;
