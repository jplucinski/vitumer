// src/components/OpenRouterAuth.tsx
import { useEffect, useState } from 'react';
import {
  buildAuthUrl,
  exchangeCodeForKey,
  getStoredApiKey,
  getCodeVerifier,
  storeApiKeySession,
  clearAllOpenRouterData,
  setAuthMode,
  getAuthMode,
  migrateLegacyPlaintextApiKey,
} from '../utils/openrouterAuth';
import {
  hasPasskeyVault,
  isPrfExtensionSupported,
  sealSecretWithPasskey,
  unlockSecretWithPasskey,
} from '../utils/passkeyVault';

type Props = {
  onConnected: () => void;
};

type Status = 'disconnected' | 'connected-session' | 'connected-passkey' | 'locked-passkey';

export const OpenRouterAuth = ({ onConnected }: Props) => {
  const [status, setStatus] = useState<Status>('disconnected');
  const [error, setError] = useState<string | null>(null);
  const [showConsent, setShowConsent] = useState(false);
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [prfAvailable, setPrfAvailable] = useState(false);

  useEffect(() => {
    migrateLegacyPlaintextApiKey();
    void isPrfExtensionSupported().then(setPrfAvailable);

    const key = getStoredApiKey();
    if (key) {
      setApiKey(key);
      setStatus(getAuthMode() === 'passkey' ? 'connected-passkey' : 'connected-session');
    } else if (hasPasskeyVault()) {
      setStatus('locked-passkey');
    }
  }, []);

  const startConnect = async () => {
    try {
      const url = await buildAuthUrl();
      window.location.assign(url);
    } catch (e: any) {
      setError(e.message);
    }
  };

  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get('code');
    if (!code || !getCodeVerifier()) return;

    (async () => {
      try {
        const key = await exchangeCodeForKey(code);
        setApiKey(key);
        setShowConsent(true);
        window.history.replaceState({}, document.title, window.location.pathname);
      } catch (e: any) {
        setError(e.message);
      }
    })();
  }, []);

  const handleSession = () => {
    if (!apiKey) return;
    storeApiKeySession(apiKey);
    setAuthMode('session');
    setStatus('connected-session');
    setShowConsent(false);
    onConnected();
  };

  const handlePasskey = async () => {
    if (!apiKey) return;
    setBusy(true);
    setError(null);
    try {
      await sealSecretWithPasskey(apiKey);
      storeApiKeySession(apiKey);
      setAuthMode('passkey');
      setStatus('connected-passkey');
      setShowConsent(false);
      onConnected();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const unlock = async () => {
    setBusy(true);
    setError(null);
    try {
      const key = await unlockSecretWithPasskey();
      storeApiKeySession(key);
      setAuthMode('passkey');
      setApiKey(key);
      setStatus('connected-passkey');
      onConnected();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const disconnect = () => {
    clearAllOpenRouterData();
    setApiKey(null);
    setStatus('disconnected');
    setError(null);
  };

  const renderStatusBadge = () => {
    switch (status) {
      case 'disconnected':
        return <span className="badge badge-danger">Not connected</span>;
      case 'connected-passkey':
        return <span className="badge badge-success">Connected — passkey vault</span>;
      case 'connected-session':
        return <span className="badge badge-warning">Connected — session only</span>;
      case 'locked-passkey':
        return <span className="badge badge-warning">Passkey vault locked</span>;
    }
  };

  return (
    <div className="auth-card glass">
      <h2 className="title">OpenRouter Integration</h2>
      <div className="mb-4">{renderStatusBadge()}</div>
      {error && <div className="alert alert-danger">{error}</div>}

      {status === 'disconnected' && (
        <button className="btn primary" onClick={startConnect} type="button">
          Connect OpenRouter
        </button>
      )}

      {status === 'locked-passkey' && (
        <button className="btn primary" onClick={unlock} type="button" disabled={busy}>
          {busy ? 'Waiting for passkey…' : 'Unlock with passkey'}
        </button>
      )}

      {status !== 'disconnected' && (
        <button className="btn outline" onClick={disconnect} type="button">
          Disconnect OpenRouter
        </button>
      )}

      {showConsent && (
        <div className="modal-backdrop">
          <div className="modal glass">
            <p>
              OpenRouter is connected. Store the key in a passkey-sealed vault, or keep it for this session
              only. The key never leaves this device except to OpenRouter.
            </p>
            <div className="modal-actions">
              <button className="btn primary" onClick={handlePasskey} type="button" disabled={busy || !prfAvailable}>
                {busy ? 'Waiting…' : 'Lock with passkey'}
              </button>
              <button className="btn outline" onClick={handleSession} type="button" disabled={busy}>
                Use session only
              </button>
            </div>
          </div>
        </div>
      )}

      {apiKey && status !== 'locked-passkey' && status !== 'disconnected' && (
        <div className="mt-4 text-xs opacity-60">
          API Key: <code>{apiKey.slice(0, 8)}…</code>
        </div>
      )}
    </div>
  );
};
