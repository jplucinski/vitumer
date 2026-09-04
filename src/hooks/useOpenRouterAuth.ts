import { useReducer, useEffect, useCallback, useRef } from 'react';
import type { FlowBlock } from '../utils/dslParser';
import {
  getStoredApiKey,
  storeApiKeySession,
  clearAllOpenRouterData,
  buildAuthUrl,
  exchangeCodeForKey,
  getCodeVerifier,
  sendMessage,
  migrateLegacyPlaintextApiKey,
  setAuthMode,
  getAuthMode,
} from '../utils/openrouterAuth';
import {
  hasPasskeyVault,
  isPrfExtensionSupported,
  sealSecretWithPasskey,
  unlockSecretWithPasskey,
} from '../utils/passkeyVault';
import { STORAGE_KEYS } from '../constants/storageKeys';
import {
  SESSION_ADVICE_PROMPT,
  loadPromptMode,
  savePromptMode,
  type PromptMode,
} from '../constants/aiPrompts';

export type ConnectionStatus =
  | 'disconnected'
  | 'connected-session'
  | 'connected-passkey'
  | 'locked-passkey';

const DEFAULT_ADVICE = 'Connect OpenRouter to get personalized productivity advice.';

type OpenRouterState = {
  apiKey: string | null;
  connectionStatus: ConnectionStatus;
  pendingApiKey: string | null;
  oauthLoading: boolean;
  oauthError: string | null;
  showConsentModal: boolean;
  consentBusy: boolean;
  consentError: string | null;
  unlockBusy: boolean;
  unlockError: string | null;
  prfAvailable: boolean;
  modelId: string;
  modelLabel: string;
  promptMode: PromptMode;
  aiAdvice: string;
  isLoadingAdvice: boolean;
};

type OpenRouterAction =
  | { type: 'INIT_FROM_STORAGE'; apiKey: string | null; connectionStatus: ConnectionStatus }
  | { type: 'SET_PRF_AVAILABLE'; available: boolean }
  | { type: 'OAUTH_START' }
  | { type: 'OAUTH_SUCCESS'; pendingApiKey: string }
  | { type: 'OAUTH_ERROR'; error: string }
  | { type: 'CLEAR_OAUTH_ERROR' }
  | { type: 'SHOW_CONSENT' }
  | { type: 'HIDE_CONSENT' }
  | { type: 'CONSENT_BUSY'; busy: boolean }
  | { type: 'CONSENT_ERROR'; error: string | null }
  | { type: 'CONNECTED'; apiKey: string; status: ConnectionStatus }
  | { type: 'UNLOCK_BUSY'; busy: boolean }
  | { type: 'UNLOCK_ERROR'; error: string | null }
  | { type: 'DISCONNECT' }
  | { type: 'SET_MODEL'; modelId: string; modelLabel?: string }
  | { type: 'SET_PROMPT_MODE'; promptMode: PromptMode }
  | { type: 'ADVICE_LOADING' }
  | { type: 'ADVICE_SUCCESS'; advice: string }
  | { type: 'ADVICE_ERROR'; error: string };

function openRouterReducer(state: OpenRouterState, action: OpenRouterAction): OpenRouterState {
  switch (action.type) {
    case 'INIT_FROM_STORAGE':
      return { ...state, apiKey: action.apiKey, connectionStatus: action.connectionStatus };
    case 'SET_PRF_AVAILABLE':
      return { ...state, prfAvailable: action.available };
    case 'OAUTH_START':
      return { ...state, oauthLoading: true, oauthError: null };
    case 'OAUTH_SUCCESS':
      return {
        ...state,
        oauthLoading: false,
        pendingApiKey: action.pendingApiKey,
        showConsentModal: true,
      };
    case 'OAUTH_ERROR':
      return { ...state, oauthLoading: false, oauthError: action.error };
    case 'CLEAR_OAUTH_ERROR':
      return { ...state, oauthError: null };
    case 'SHOW_CONSENT':
      return { ...state, showConsentModal: true };
    case 'HIDE_CONSENT':
      return {
        ...state,
        showConsentModal: false,
        pendingApiKey: null,
        consentError: null,
        consentBusy: false,
      };
    case 'CONSENT_BUSY':
      return { ...state, consentBusy: action.busy };
    case 'CONSENT_ERROR':
      return { ...state, consentError: action.error };
    case 'CONNECTED':
      return {
        ...state,
        apiKey: action.apiKey,
        connectionStatus: action.status,
        pendingApiKey: null,
        showConsentModal: false,
        consentError: null,
        consentBusy: false,
        unlockError: null,
      };
    case 'UNLOCK_BUSY':
      return { ...state, unlockBusy: action.busy };
    case 'UNLOCK_ERROR':
      return { ...state, unlockError: action.error };
    case 'DISCONNECT':
      return {
        ...state,
        apiKey: null,
        connectionStatus: 'disconnected',
        aiAdvice: DEFAULT_ADVICE,
        unlockError: null,
      };
    case 'SET_MODEL':
      return {
        ...state,
        modelId: action.modelId,
        modelLabel: action.modelLabel ?? state.modelLabel,
      };
    case 'SET_PROMPT_MODE':
      return { ...state, promptMode: action.promptMode };
    case 'ADVICE_LOADING':
      return { ...state, isLoadingAdvice: true };
    case 'ADVICE_SUCCESS':
      return { ...state, aiAdvice: action.advice, isLoadingAdvice: false };
    case 'ADVICE_ERROR':
      return { ...state, aiAdvice: action.error, isLoadingAdvice: false };
    default:
      return state;
  }
}

export function useOpenRouterAuth(blocks: FlowBlock[]) {
  const [state, dispatch] = useReducer(openRouterReducer, {
    apiKey: null,
    connectionStatus: 'disconnected',
    pendingApiKey: null,
    oauthLoading: false,
    oauthError: null,
    showConsentModal: false,
    consentBusy: false,
    consentError: null,
    unlockBusy: false,
    unlockError: null,
    prfAvailable: false,
    modelId: localStorage.getItem(STORAGE_KEYS.openrouterModelId) || 'openai/gpt-4o-mini',
    modelLabel: localStorage.getItem(STORAGE_KEYS.openrouterModelLabel) || '',
    promptMode: loadPromptMode(),
    aiAdvice: DEFAULT_ADVICE,
    isLoadingAdvice: false,
  });

  const hadApiKeyRef = useRef(false);

  useEffect(() => {
    localStorage.removeItem('openrouter_custom_url');
    localStorage.removeItem('openrouter_custom_model');
  }, []);

  useEffect(() => {
    void isPrfExtensionSupported().then((available) => {
      dispatch({ type: 'SET_PRF_AVAILABLE', available });
    });

    migrateLegacyPlaintextApiKey();

    const storedKey = getStoredApiKey();
    if (storedKey) {
      dispatch({
        type: 'INIT_FROM_STORAGE',
        apiKey: storedKey,
        connectionStatus: getAuthMode() === 'passkey' ? 'connected-passkey' : 'connected-session',
      });
    } else if (hasPasskeyVault()) {
      dispatch({
        type: 'INIT_FROM_STORAGE',
        apiKey: null,
        connectionStatus: 'locked-passkey',
      });
    }
  }, []);

  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get('code');
    if (!code || !getCodeVerifier()) return;

    dispatch({ type: 'OAUTH_START' });

    (async () => {
      try {
        const key = await exchangeCodeForKey(code);
        dispatch({ type: 'OAUTH_SUCCESS', pendingApiKey: key });
        window.history.replaceState({}, document.title, '/');
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to exchange code for API key.';
        dispatch({ type: 'OAUTH_ERROR', error: message });
      }
    })();
  }, []);

  const generateAdvice = useCallback(async () => {
    if (!state.apiKey) {
      alert('Connect your OpenRouter account in Settings first!');
      return;
    }

    dispatch({ type: 'ADVICE_LOADING' });
    try {
      const sessionSummary = blocks
        .map(
          (b, i) =>
            `${i + 1}. ${b.label} (${Math.floor(b.duration / 60)} min, ${b.color})${b.description ? `: ${b.description}` : ''}`
        )
        .join('\n');

      const advice = await sendMessage(state.apiKey, state.modelId, [
        { role: 'system', content: SESSION_ADVICE_PROMPT },
        { role: 'user', content: `Here is my session today:\n${sessionSummary}` },
      ]);
      dispatch({ type: 'ADVICE_SUCCESS', advice });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      dispatch({ type: 'ADVICE_ERROR', error: `Failed to generate advice: ${message}` });
    }
  }, [state.apiKey, state.modelId, blocks]);

  useEffect(() => {
    if (state.apiKey && !hadApiKeyRef.current && state.aiAdvice.startsWith('Connect')) {
      void generateAdvice();
    }
    hadApiKeyRef.current = !!state.apiKey;
  }, [state.apiKey, state.aiAdvice, generateAdvice]);

  const handleConsentSession = useCallback(() => {
    if (!state.pendingApiKey) return;
    storeApiKeySession(state.pendingApiKey);
    setAuthMode('session');
    dispatch({
      type: 'CONNECTED',
      apiKey: state.pendingApiKey,
      status: 'connected-session',
    });
    window.history.replaceState({}, document.title, '/');
  }, [state.pendingApiKey]);

  const handleConsentPasskey = useCallback(async () => {
    if (!state.pendingApiKey) return;
    dispatch({ type: 'CONSENT_BUSY', busy: true });
    dispatch({ type: 'CONSENT_ERROR', error: null });
    try {
      await sealSecretWithPasskey(state.pendingApiKey);
      storeApiKeySession(state.pendingApiKey);
      setAuthMode('passkey');
      dispatch({
        type: 'CONNECTED',
        apiKey: state.pendingApiKey,
        status: 'connected-passkey',
      });
      window.history.replaceState({}, document.title, '/');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to lock key with passkey.';
      dispatch({ type: 'CONSENT_ERROR', error: message });
    } finally {
      dispatch({ type: 'CONSENT_BUSY', busy: false });
    }
  }, [state.pendingApiKey]);

  const unlockPasskeyVault = useCallback(async () => {
    dispatch({ type: 'UNLOCK_BUSY', busy: true });
    dispatch({ type: 'UNLOCK_ERROR', error: null });
    try {
      const key = await unlockSecretWithPasskey();
      storeApiKeySession(key);
      setAuthMode('passkey');
      dispatch({ type: 'CONNECTED', apiKey: key, status: 'connected-passkey' });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to unlock passkey vault.';
      dispatch({ type: 'UNLOCK_ERROR', error: message });
    } finally {
      dispatch({ type: 'UNLOCK_BUSY', busy: false });
    }
  }, []);

  const cancelConsent = useCallback(() => {
    dispatch({ type: 'HIDE_CONSENT' });
    window.history.replaceState({}, document.title, '/');
  }, []);

  const startConnect = useCallback(async () => {
    try {
      const url = await buildAuthUrl();
      window.location.assign(url);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      alert(`Connection initialization failed: ${message}`);
    }
  }, []);

  const disconnect = useCallback(() => {
    clearAllOpenRouterData();
    dispatch({ type: 'DISCONNECT' });
  }, []);

  const persistModelId = useCallback((id: string, label?: string) => {
    dispatch({ type: 'SET_MODEL', modelId: id, modelLabel: label });
    localStorage.setItem(STORAGE_KEYS.openrouterModelId, id);
    if (label !== undefined) {
      localStorage.setItem(STORAGE_KEYS.openrouterModelLabel, label);
    }
  }, []);

  const setPromptMode = useCallback((promptMode: PromptMode) => {
    dispatch({ type: 'SET_PROMPT_MODE', promptMode });
  }, []);

  const saveSettings = useCallback(
    (theme: string) => {
      localStorage.setItem(STORAGE_KEYS.openrouterModelId, state.modelId);
      localStorage.setItem(STORAGE_KEYS.openrouterModelLabel, state.modelLabel);
      localStorage.setItem(STORAGE_KEYS.theme, theme);
      savePromptMode(state.promptMode);
    },
    [state.modelId, state.modelLabel, state.promptMode]
  );

  const clearOauthError = useCallback(() => {
    dispatch({ type: 'CLEAR_OAUTH_ERROR' });
    window.history.replaceState({}, document.title, '/');
  }, []);

  return {
    apiKey: state.apiKey,
    connectionStatus: state.connectionStatus,
    pendingApiKey: state.pendingApiKey,
    oauthLoading: state.oauthLoading,
    oauthError: state.oauthError,
    showConsentModal: state.showConsentModal,
    consentBusy: state.consentBusy,
    consentError: state.consentError,
    unlockBusy: state.unlockBusy,
    unlockError: state.unlockError,
    prfAvailable: state.prfAvailable,
    modelId: state.modelId,
    modelLabel: state.modelLabel,
    promptMode: state.promptMode,
    aiAdvice: state.aiAdvice,
    isLoadingAdvice: state.isLoadingAdvice,
    handleConsentSession,
    handleConsentPasskey,
    unlockPasskeyVault,
    cancelConsent,
    startConnect,
    disconnect,
    persistModelId,
    setPromptMode,
    saveSettings,
    generateAdvice,
    clearOauthError,
  };
}
