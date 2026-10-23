import { Play, RefreshCcw } from 'lucide-react';
import type { RestoredTimer } from '../utils/timerProgress';

type MobileSessionBarProps = {
  resume: RestoredTimer | null;
  onReset: () => void;
  onToggleFocus: () => void;
};

export function MobileSessionBar({ resume, onReset, onToggleFocus }: MobileSessionBarProps) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-30 flex items-center justify-center gap-3 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] border-t border-(--border-color) bg-[var(--bg-color)]/95 backdrop-blur-md">
      <button
        onClick={onReset}
        className="flex h-12 w-12 items-center justify-center rounded-full border border-(--border-color) text-(--text-color) transition-colors hover:bg-(--block-color)"
        title="Reset Session"
        aria-label="Reset Session"
        type="button"
      >
        <RefreshCcw size={18} />
      </button>
      <button
        onClick={onToggleFocus}
        className="btn btn-primary-solid gap-2 rounded-full px-6 py-3 text-sm font-medium"
        type="button"
        aria-label={resume ? 'Resume Session' : 'Start Session'}
      >
        <Play size={16} />
        <span>{resume ? 'Resume Session' : 'Start Session'}</span>
      </button>
    </div>
  );
}
