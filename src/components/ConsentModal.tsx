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
      <div className="modal text-left">
        <h3 className="mb-3 text-base font-semibold">Connected to OpenRouter</h3>
        <p className="mb-4 text-sm leading-relaxed text-(--muted-text)">
          Choose how to keep the key on this device. Nothing is sent to Vitumer servers.
        </p>
        <ul className="mb-6 list-disc space-y-2 pl-4 text-sm text-(--muted-text)">
          <li>
            <strong>Session only:</strong> plaintext in this tab until you close it.
          </li>
          <li>
            <strong>Lock with passkey:</strong> AES-GCM ciphertext in localStorage, unlocked via
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
          <p className="mt-3 text-xs text-(--muted-text)">
            Passkey PRF unavailable here. Use session only, or try Chrome, Edge, or Safari on a device with
            a platform authenticator.
          </p>
        )}
      </div>
    </div>
  );
}
