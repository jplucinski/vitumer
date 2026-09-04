type ConsentModalProps = {
  consentError: string | null;
  consentBusy: boolean;
  prfAvailable: boolean;
  onCancel: () => void;
  onSessionOnly: () => void;
  onPasskey: () => void;
};

export function ConsentModal({
  consentError,
  consentBusy,
  prfAvailable,
  onCancel,
  onSessionOnly,
  onPasskey,
}: ConsentModalProps) {
  return (
    <div className="modal-backdrop">
      <div className="modal glass text-left max-w-md">
        <h3 className="text-lg font-bold mb-4">Connected to OpenRouter</h3>
        <p className="text-sm opacity-80 leading-relaxed mb-4">
          Choose how to keep the key on this device. Nothing is sent to Vitumer servers.
        </p>
        <ul className="text-xs opacity-70 space-y-2 mb-6 list-disc pl-4">
          <li>
            <strong>Session only</strong> — plaintext in this tab until you close it.
          </li>
          <li>
            <strong>Lock with passkey</strong> — AES-GCM ciphertext in localStorage, unlocked via
            WebAuthn PRF (Face ID / Windows Hello / security key).
          </li>
        </ul>
        {consentError && <div className="alert alert-danger text-xs mb-4">{consentError}</div>}
        <div className="modal-actions flex-wrap">
          <button className="btn outline text-xs" onClick={onCancel} type="button" disabled={consentBusy}>
            Cancel
          </button>
          <button
            className="btn outline text-xs"
            onClick={onSessionOnly}
            type="button"
            disabled={consentBusy}
          >
            Use session only
          </button>
          <button
            className="btn primary text-xs"
            onClick={onPasskey}
            type="button"
            disabled={consentBusy || !prfAvailable}
            title={!prfAvailable ? 'WebAuthn PRF not available in this browser' : undefined}
          >
            {consentBusy ? 'Waiting for passkey…' : 'Lock with passkey'}
          </button>
        </div>
        {!prfAvailable && (
          <p className="text-[10px] opacity-50 mt-3">
            Passkey PRF unavailable here — use session only, or try Chrome/Edge/Safari on a device with
            a platform authenticator.
          </p>
        )}
      </div>
    </div>
  );
}
