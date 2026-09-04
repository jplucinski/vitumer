import { Settings, Sun, Moon, FileText, CheckCircle2, AlertCircle } from 'lucide-react';
import type { ConnectionStatus } from '../hooks/useOpenRouterAuth';

type AppHeaderProps = {
  connectionStatus: ConnectionStatus;
  isDark: boolean;
  onNavigatePrompts: () => void;
  onOpenSettings: () => void;
  onToggleDarkMode: () => void;
};

export function AppHeader({
  connectionStatus,
  isDark,
  onNavigatePrompts,
  onOpenSettings,
  onToggleDarkMode,
}: AppHeaderProps) {
  return (
    <header className="app-header max-w-4xl lg:max-w-none mx-auto w-full px-4 sm:px-6 lg:px-8 pt-[max(0.75rem,env(safe-area-inset-top))] pb-3 flex justify-between items-center gap-4 border-b border-(--border-color)/50">
      <h1 className="app-title">Vitumer</h1>
      <div className="flex flex-wrap items-center justify-end gap-2 shrink-0">
        <div className="hidden sm:block text-xs font-mono">
          {connectionStatus === 'connected-passkey' && (
            <span className="text-emerald-400 flex items-center gap-1.5">
              <CheckCircle2 size={12} /> OpenRouter (passkey vault)
            </span>
          )}
          {connectionStatus === 'connected-session' && (
            <span className="text-amber-400 flex items-center gap-1.5">
              <CheckCircle2 size={12} /> OpenRouter (session only)
            </span>
          )}
          {connectionStatus === 'locked-passkey' && (
            <span className="text-sky-400 flex items-center gap-1.5">
              <AlertCircle size={12} /> OpenRouter vault locked
            </span>
          )}
          {connectionStatus === 'disconnected' && (
            <span className="opacity-40 flex items-center gap-1.5">
              <AlertCircle size={12} /> OpenRouter disconnected
            </span>
          )}
        </div>

        <button
          onClick={onNavigatePrompts}
          className="inline-flex items-center justify-center min-h-11 min-w-11 rounded-md hover:bg-black/5 dark:hover:bg-white/5 transition-colors opacity-60 hover:opacity-100"
          title="AI Prompts"
          type="button"
        >
          <FileText size={18} />
        </button>

        <button
          onClick={onOpenSettings}
          className="inline-flex items-center justify-center min-h-11 min-w-11 rounded-md hover:bg-black/5 dark:hover:bg-white/5 transition-colors opacity-60 hover:opacity-100"
          title="Settings"
          type="button"
        >
          <Settings size={18} />
        </button>

        <button
          onClick={onToggleDarkMode}
          className="inline-flex items-center justify-center min-h-11 min-w-11 rounded-md hover:bg-black/5 dark:hover:bg-white/5 transition-colors opacity-60 hover:opacity-100"
          title={isDark ? 'Light mode' : 'Dark mode'}
          type="button"
        >
          {isDark ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </div>
    </header>
  );
}
