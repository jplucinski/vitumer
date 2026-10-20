import { X, FileText } from 'lucide-react';
import { ModelPicker } from './ModelPicker';
import type { ConnectionStatus } from '../hooks/useOpenRouterAuth';
import type { PromptMode } from '../constants/aiPrompts';

type SettingsModalProps = {
  connectionStatus: ConnectionStatus;
  unlockError: string | null;
  unlockBusy: boolean;
  theme: string;
  modelId: string;
  modelLabel: string;
  promptMode: PromptMode;
  apiKey: string | null;
  onClose: () => void;
  onSave: () => void;
  onThemeChange: (theme: string) => void;
  onPromptModeChange: (mode: PromptMode) => void;
  onModelChange: (id: string, label?: string) => void;
  onStartConnect: () => void;
  onDisconnect: () => void;
  onUnlockPasskey: () => void;
  onNavigatePrompts: () => void;
};

export function SettingsModal({
  connectionStatus,
  unlockError,
  unlockBusy,
  theme,
  modelId,
  modelLabel,
  promptMode,
  apiKey,
  onClose,
  onSave,
  onThemeChange,
  onPromptModeChange,
  onModelChange,
  onStartConnect,
  onDisconnect,
  onUnlockPasskey,
  onNavigatePrompts,
}: SettingsModalProps) {
  return (
    <div className="modal-backdrop modal-backdrop--sheet" onClick={onClose} role="presentation">
      <div
        className="modal-panel"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-title"
      >
        <div className="modal-panel-header">
          <h3 id="settings-title" className="text-base font-semibold">
            Settings
          </h3>
          <button
            onClick={onClose}
            className="opacity-50 hover:opacity-100 p-1 rounded-md hover:bg-(--block-color)"
            type="button"
            aria-label="Close settings"
          >
            <X size={20} />
          </button>
        </div>

        <div className="modal-panel-body space-y-4 text-sm">
          <div className="surface-card p-4 space-y-3">
            <label className="block text-xs text-(--muted-text)">OpenRouter</label>
            <div className="flex justify-between items-center">
              {connectionStatus === 'disconnected' && (
                <span className="badge badge-danger">Not connected</span>
              )}
              {connectionStatus === 'connected-passkey' && (
                <span className="badge badge-success">Unlocked, passkey vault</span>
              )}
              {connectionStatus === 'connected-session' && (
                <span className="badge badge-warning">Session only</span>
              )}
              {connectionStatus === 'locked-passkey' && (
                <span className="badge badge-warning">Passkey vault locked</span>
              )}
            </div>
            {unlockError && <div className="alert alert-danger text-xs">{unlockError}</div>}
            <div className="pt-2 space-y-2">
              {connectionStatus === 'locked-passkey' && (
                <button
                  onClick={onUnlockPasskey}
                  disabled={unlockBusy}
                  className="btn primary w-full py-2 text-sm"
                  type="button"
                >
                  {unlockBusy ? 'Waiting for passkey…' : 'Unlock with passkey'}
                </button>
              )}
              {connectionStatus === 'disconnected' ? (
                <button onClick={onStartConnect} className="btn primary w-full py-2 text-sm" type="button">
                  Connect OpenRouter via OAuth
                </button>
              ) : connectionStatus !== 'locked-passkey' ? (
                <button
                  onClick={onDisconnect}
                  className="btn outline w-full py-2 text-sm text-(--pill-negative-ink)"
                  type="button"
                >
                  Disconnect OpenRouter
                </button>
              ) : (
                <button
                  onClick={onDisconnect}
                  className="btn outline w-full py-2 text-sm text-(--pill-negative-ink)"
                  type="button"
                >
                  Delete vault & disconnect
                </button>
              )}
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs text-(--muted-text)">Theme</label>
            <select
              value={theme}
              onChange={(e) => onThemeChange(e.target.value)}
              className="select"
            >
              <option value="aura">Aura (Default)</option>
              <option value="cyberpunk">Cyberpunk</option>
              <option value="forest">Forest</option>
              <option value="nord">Nord</option>
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-xs text-(--muted-text)">Model</label>
            <ModelPicker
              value={modelId}
              label={modelLabel || undefined}
              onChange={onModelChange}
              apiKey={apiKey}
            />
          </div>

          <div className="pt-2">
            <label className="flex items-start gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={promptMode === 'verbose'}
                onChange={(e) => onPromptModeChange(e.target.checked ? 'verbose' : 'compact')}
                className="mt-0.5"
              />
              <span className="text-xs leading-relaxed">
                <span className="opacity-80">Detailed AI prompts</span>
                <span className="opacity-50 block mt-0.5">
                  Uses more tokens. Includes examples for better output on complex requests.
                </span>
              </span>
            </label>
          </div>

          <button
            onClick={onNavigatePrompts}
            className="flex w-full items-center gap-2 py-2 text-left text-sm text-(--muted-text) hover:text-(--text-color)"
            type="button"
          >
            <FileText size={14} />
            View AI prompts →
          </button>

          <p className="mt-2 text-xs leading-relaxed break-words text-(--muted-text)">
            <strong>Warning:</strong> Frontend-only app. Keys never hit our servers. They go only to OpenRouter.
            Passkey vault encrypts the key at rest in this browser; after unlock it lives in session
            memory and is visible to scripts on this origin (XSS).
          </p>
        </div>

        <div className="modal-panel-footer">
          <button
            onClick={onClose}
            className="btn outline px-4 py-2 text-sm"
            type="button"
          >
            Cancel
          </button>
          <button
            onClick={onSave}
            className="btn btn-primary-solid px-4 py-2 text-sm"
            type="button"
          >
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
}
