type PasskeyUnlockBannerProps = {
  unlockError: string | null;
  unlockBusy: boolean;
  onUnlock: () => void;
};

export function PasskeyUnlockBanner({ unlockError, unlockBusy, onUnlock }: PasskeyUnlockBannerProps) {
  return (
    <div className="fixed bottom-4 inset-x-4 z-40 sm:inset-x-auto sm:right-4 sm:left-auto sm:w-96">
      <div className="glass rounded-xl border border-(--border-color) p-4 shadow-lg space-y-3">
        <p className="text-sm font-mono">
          OpenRouter key is sealed with your passkey. Unlock to use AI features.
        </p>
        {unlockError && <div className="alert alert-danger text-xs">{unlockError}</div>}
        <button
          onClick={onUnlock}
          disabled={unlockBusy}
          className="btn primary w-full text-xs py-2"
          type="button"
        >
          {unlockBusy ? 'Waiting for passkey…' : 'Unlock with passkey'}
        </button>
      </div>
    </div>
  );
}
