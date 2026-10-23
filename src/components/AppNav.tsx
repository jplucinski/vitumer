import { ArrowLeft, FileText, Settings, Sun, Moon, Timer } from 'lucide-react';

type AppNavProps = {
  variant: 'app' | 'subpage';
  current?: 'session' | 'prompts';
  onBack?: () => void;
  onNavigateHome?: () => void;
  onNavigatePrompts?: () => void;
  onOpenSettings?: () => void;
  onToggleDarkMode?: () => void;
  isDark?: boolean;
};

export function AppNav({
  variant,
  current = 'session',
  onBack,
  onNavigateHome,
  onNavigatePrompts,
  onOpenSettings,
  onToggleDarkMode,
  isDark = true,
}: AppNavProps) {
  return (
    <nav className="app-rail" aria-label="Vitumer">
      <div className="app-rail-mark">
        {variant === 'subpage' && onBack ? (
          <button onClick={onBack} className="rail-btn" type="button" aria-label="Back">
            <ArrowLeft size={18} />
          </button>
        ) : (
          <span className="rail-mark" title="Vitumer">
            <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
              <rect x="1" y="2" width="6" height="14" fill="var(--color-work)" />
              <rect x="11" y="7" width="6" height="9" fill="var(--color-rest)" />
            </svg>
          </span>
        )}
        <span className="rail-name">Vitumer</span>
        {onNavigateHome || current === 'session' ? (
          <button
            onClick={onNavigateHome}
            className="rail-btn"
            type="button"
            aria-label="Session"
            title="Session"
            aria-current={current === 'session' ? 'page' : undefined}
          >
            <Timer size={18} />
          </button>
        ) : null}
        {onNavigatePrompts ? (
          <button
            onClick={onNavigatePrompts}
            className="rail-btn"
            type="button"
            aria-label="Prompts"
            title="Prompts"
            aria-current={current === 'prompts' ? 'page' : undefined}
          >
            <FileText size={18} />
          </button>
        ) : null}
      </div>

      <div className="app-rail-actions">
        {onOpenSettings ? (
          <button onClick={onOpenSettings} className="rail-btn" type="button" aria-label="Settings" title="Settings">
            <Settings size={18} />
          </button>
        ) : null}

        {onToggleDarkMode ? (
          <button
            onClick={onToggleDarkMode}
            className="rail-btn"
            type="button"
            aria-label={isDark ? 'Light mode' : 'Dark mode'}
            title={isDark ? 'Light mode' : 'Dark mode'}
          >
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        ) : null}
      </div>
    </nav>
  );
}
