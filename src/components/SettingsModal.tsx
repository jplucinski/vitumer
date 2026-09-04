import { Settings, X, FileText } from 'lucide-react';
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
          <h3 id="settings-title" className="font-mono text-lg font-semibold flex items-center gap-2">
            <Settings size={18} className="opacity-50" />
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

        <div className="modal-panel-body space-y-4 font-mono text-sm">
          <div className="surface-card p-4 space-y-3">
            <label className="block text-xs opacity-50">OpenRouter connection status</label>
            <div className="flex justify-between items-center">
              {connectionStatus === 'disconnected' && (
                <span className="badge badge-danger">Not connected</span>
              )}
              {connectionStatus === 'connected-passkey' && (
                <span className="badge badge-success">Unlocked — passkey vault</span>
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
                  className="btn primary w-full text-xs py-2"
                  type="button"
                >
                  {unlockBusy ? 'Waiting for passkey…' : 'Unlock with passkey'}
                </button>
              )}
              {connectionStatus === 'disconnected' ? (
                <button onClick={onStartConnect} className="btn primary w-full text-xs py-2" type="button">
                  Connect OpenRouter via OAuth
                </button>
              ) : connectionStatus !== 'locked-passkey' ? (
                <button
                  onClick={onDisconnect}
                  className="btn outline w-full text-xs py-2 border-red-500/30 text-red-400 hover:bg-red-500/10 hover:border-red-500/50"
                  type="button"
                >
                  Disconnect OpenRouter
                </button>
              ) : (
                <button
                  onClick={onDisconnect}
                  className="btn outline w-full text-xs py-2 border-red-500/30 text-red-400 hover:bg-red-500/10 hover:border-red-500/50"
                  type="button"
                >
                  Delete vault & disconnect
                </button>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs opacity-50 mb-1">Timer visual theme</label>
            <select
              value={theme}
              onChange={(e) => onThemeChange(e.target.value)}
              className="select w-full rounded-lg p-2.5"
            >
              <option value="aura">Aura (Default)</option>
              <option value="cyberpunk">Cyberpunk</option>
              <option value="forest">Forest</option>
              <option value="nord">Nord</option>
            </select>
          </div>

          <div>
            <label className="block text-xs opacity-50 mb-1">Default Model ID (OpenRouter)</label>
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
            className="w-full text-left text-xs font-mono opacity-60 hover:opacity-100 transition-opacity flex items-center gap-2 py-2"
            type="button"
          >
            <FileText size={14} />
            View AI prompts →
          </button>

          <p className="text-[10px] sm:text-[11px] opacity-60 leading-relaxed break-words mt-2">
            <strong>Warning:</strong> Frontend-only app. Keys never hit our servers — only OpenRouter.
            Passkey vault encrypts the key at rest in this browser; after unlock it lives in session
            memory and is visible to scripts on this origin (XSS).
          </p>
        </div>

        <div className="modal-panel-footer">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg opacity-70 hover:opacity-100 hover:bg-(--block-color) transition-all text-xs"
            type="button"
          >
            Cancel
          </button>
          <button
            onClick={onSave}
            className="px-4 py-2 rounded-lg bg-white text-black font-semibold hover:scale-[1.02] transition-transform text-xs"
            type="button"
          >
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
}
