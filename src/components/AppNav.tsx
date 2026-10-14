import { ArrowLeft, Settings, Sun, Moon, FileText, CheckCircle2, AlertCircle } from 'lucide-react';
import type { ConnectionStatus } from '../hooks/useOpenRouterAuth';

type AppNavProps = {
  variant: 'app' | 'subpage';
  onBack?: () => void;
  connectionStatus?: ConnectionStatus;
  isDark?: boolean;
  onNavigatePrompts?: () => void;
  onOpenSettings?: () => void;
  onToggleDarkMode?: () => void;
};

function ConnectionChip({ status }: { status: ConnectionStatus }) {
  if (status === 'connected-passkey') {
    return (
      <span className="text-emerald-400 flex items-center gap-1.5">
        <CheckCircle2 size={12} /> OpenRouter vault
      </span>
    );
  }
  if (status === 'connected-session') {
    return (
      <span className="text-amber-400 flex items-center gap-1.5">
        <CheckCircle2 size={12} /> OpenRouter session
      </span>
    );
  }
  if (status === 'locked-passkey') {
    return (
      <span className="text-sky-400 flex items-center gap-1.5">
        <AlertCircle size={12} /> Vault locked
      </span>
    );
  }
  return (
    <span className="opacity-40 flex items-center gap-1.5">
      <AlertCircle size={12} /> Offline
    </span>
  );
}

export function AppNav({
  variant,
  onBack,
  connectionStatus,
  isDark = true,
  onNavigatePrompts,
  onOpenSettings,
  onToggleDarkMode,
}: AppNavProps) {
  return (
    <div className="app-header sticky top-0 z-40 px-3 sm:px-6 pt-[max(0.75rem,env(safe-area-inset-top))] pb-3">
      <nav className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 rounded-full border border-(--border-color) bg-(--glass-bg) px-2 py-1.5 shadow-[0_12px_40px_-24px_rgba(0,0,0,0.45)] backdrop-blur-xl sm:px-3">
        <div className="flex min-w-0 items-center gap-1">
          {variant === 'subpage' && onBack ? (
            <button
              onClick={onBack}
              className="inline-flex h-11 w-11 items-center justify-center rounded-full opacity-70 transition-opacity hover:bg-black/5 hover:opacity-100 dark:hover:bg-white/5"
              title="Back"
              type="button"
            >
              <ArrowLeft size={18} />
            </button>
          ) : null}
          <h1 className="app-title truncate px-2 text-lg sm:text-xl">Vitumer</h1>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          {connectionStatus ? (
            <div className="hidden text-xs font-mono md:block px-2">
              <ConnectionChip status={connectionStatus} />
            </div>
          ) : null}

          {onNavigatePrompts ? (
            <button
              onClick={onNavigatePrompts}
              className="inline-flex h-11 w-11 items-center justify-center rounded-full opacity-60 transition-opacity hover:bg-black/5 hover:opacity-100 dark:hover:bg-white/5"
              title="AI Prompts"
              type="button"
            >
              <FileText size={18} />
            </button>
          ) : null}

          {onOpenSettings ? (
            <button
              onClick={onOpenSettings}
              className="inline-flex h-11 w-11 items-center justify-center rounded-full opacity-60 transition-opacity hover:bg-black/5 hover:opacity-100 dark:hover:bg-white/5"
              title="Settings"
              type="button"
            >
              <Settings size={18} />
            </button>
          ) : null}

          {onToggleDarkMode ? (
            <button
              onClick={onToggleDarkMode}
              className="inline-flex h-11 w-11 items-center justify-center rounded-full opacity-60 transition-opacity hover:bg-black/5 hover:opacity-100 dark:hover:bg-white/5"
              title={isDark ? 'Light mode' : 'Dark mode'}
              type="button"
            >
              {isDark ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          ) : null}
        </div>
      </nav>
    </div>
  );
}
