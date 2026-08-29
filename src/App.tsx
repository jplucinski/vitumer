import { useState, useEffect } from 'react';
import {
  Play,
  Settings,
  Sun,
  Moon,
  X,
  QrCode,
  Copy,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Keyboard,
  RefreshCcw,
  FileText,
} from 'lucide-react';
import CommandBar from './components/CommandBar';
import FocusView from './components/FocusView';
import BlockList from './components/BlockList';
import SessionLaunchCard from './components/SessionLaunchCard';
import AIFeedback from './components/AIFeedback';
import PromptsPage from './components/PromptsPage';
import AIAgentsPage from './components/AIAgentsPage';
import { ModelPicker } from './components/ModelPicker';
import { FlowBlock, parseDSL } from './utils/dslParser';
import { stringifyBlocks, normalizeBlocks } from './utils/dslSchema';
import { buildShareUrl, decodeFlowParam } from './utils/shareFlow';
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
} from './utils/openrouterAuth';
import {
  hasPasskeyVault,
  isPrfExtensionSupported,
  sealSecretWithPasskey,
  unlockSecretWithPasskey,
} from './utils/passkeyVault';
import { STORAGE_KEYS } from './constants/storageKeys';
import { BREAKPOINTS } from './constants/breakpoints';
import { restoreTimerProgress, type RestoredTimer } from './utils/timerProgress';
import {
  SESSION_ADVICE_PROMPT,
  loadPromptMode,
  savePromptMode,
  type PromptMode,
} from './constants/aiPrompts';
import { usePathname, useNavigate } from './hooks/usePathname';
import { useMinWidth } from './hooks/useMinWidth';

const THEME_CLASSES = ['theme-aura', 'theme-cyberpunk', 'theme-forest', 'theme-nord'];

const MOCK_BLOCKS: FlowBlock[] = [
  {
    id: '1',
    duration: 1500,
    label: 'pomo',
    completed: false,
    description: 'Warmup, emails',
    emoji: '☕',
    color: 'orange',
  },
  {
    id: '2',
    duration: 300,
    label: 'break',
    completed: false,
    description: 'Step away, water',
    emoji: '💧',
    color: 'teal',
  },
  {
    id: '3',
    duration: 1500,
    label: 'pomo',
    completed: false,
    description: 'Main work — UI/UX project',
    emoji: '🎨',
    color: 'orange',
  },
  {
    id: '4',
    duration: 300,
    label: 'break',
    completed: false,
    description: 'Stretching',
    emoji: '🧘',
    color: 'teal',
  },
  {
    id: '5',
    duration: 1500,
    label: 'pomo',
    completed: false,
    description: 'Implement views',
    emoji: '💻',
    color: 'orange',
  },
];

type ConnectionStatus =
  | 'disconnected'
  | 'connected-session'
  | 'connected-passkey'
  | 'locked-passkey';

function App() {
  const pathname = usePathname();
  const navigate = useNavigate();
  const isDesktop = useMinWidth(BREAKPOINTS.lg);
  const [isDark, setIsDark] = useState(() => localStorage.getItem(STORAGE_KEYS.colorMode) !== 'light');
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [blocks, setBlocks] = useState<FlowBlock[]>(MOCK_BLOCKS);
  const [blocksHydrated, setBlocksHydrated] = useState(false);
  const [resume, setResume] = useState<RestoredTimer | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false);
  const [theme, setTheme] = useState(localStorage.getItem(STORAGE_KEYS.theme) || 'aura');
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [modelId, setModelId] = useState(localStorage.getItem('openrouter_model_id') || 'openai/gpt-4o-mini');
  const [modelLabel, setModelLabel] = useState(localStorage.getItem('openrouter_model_label') || '');
  const [promptMode, setPromptMode] = useState<PromptMode>(() => loadPromptMode());
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
  const [oauthLoading, setOauthLoading] = useState(false);
  const [oauthError, setOauthError] = useState<string | null>(null);
  const [pendingApiKey, setPendingApiKey] = useState<string | null>(null);
  const [showConsentModal, setShowConsentModal] = useState(false);
  const [consentBusy, setConsentBusy] = useState(false);
  const [consentError, setConsentError] = useState<string | null>(null);
  const [unlockBusy, setUnlockBusy] = useState(false);
  const [unlockError, setUnlockError] = useState<string | null>(null);
  const [prfAvailable, setPrfAvailable] = useState(false);
  const [aiAdvice, setAiAdvice] = useState(
    'Connect OpenRouter to get personalized productivity advice.'
  );
  const [isLoadingAdvice, setIsLoadingAdvice] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [shareUrl, setShareUrl] = useState('');

  useEffect(() => {
    localStorage.removeItem('openrouter_custom_url');
    localStorage.removeItem('openrouter_custom_model');
  }, []);

  useEffect(() => {
    void isPrfExtensionSupported().then(setPrfAvailable);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    THEME_CLASSES.forEach((cls) => root.classList.remove(cls));
    root.classList.add(`theme-${theme}`);
    if (isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [isDark, theme]);

  useEffect(() => {
    migrateLegacyPlaintextApiKey();

    const storedKey = getStoredApiKey();
    if (storedKey) {
      setApiKey(storedKey);
      setConnectionStatus(getAuthMode() === 'passkey' ? 'connected-passkey' : 'connected-session');
    } else if (hasPasskeyVault()) {
      setConnectionStatus('locked-passkey');
    }

    const flowParam = new URLSearchParams(window.location.search).get('flow');
    if (flowParam) {
      try {
        const parsed = parseDSL(decodeFlowParam(flowParam));
        if (parsed.length > 0) {
          const normalized = normalizeBlocks(parsed);
          setBlocks(normalized);
          localStorage.setItem(STORAGE_KEYS.activeBlocks, JSON.stringify(normalized));
          setBlocksHydrated(true);
          return;
        }
      } catch (err) {
        console.error('Failed to decode flow parameter from URL', err);
      }
    }

    const saved = localStorage.getItem(STORAGE_KEYS.activeBlocks);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const normalized = normalizeBlocks(parsed);
          setBlocks(normalized);
        } else {
          localStorage.removeItem(STORAGE_KEYS.activeBlocks);
          console.warn('Removed invalid data from localStorage');
        }
      } catch (err) {
        console.error('Failed to load saved blocks from localStorage', err);
      }
    }
    setBlocksHydrated(true);
  }, []);

  useEffect(() => {
    if (!blocksHydrated) return;
    if (blocks && blocks.length > 0) {
      localStorage.setItem(STORAGE_KEYS.activeBlocks, JSON.stringify(blocks));
    }
  }, [blocks, blocksHydrated]);

  useEffect(() => {
    setResume(
      restoreTimerProgress(
        blocks,
        localStorage.getItem(STORAGE_KEYS.timerProgress),
        Date.now()
      )
    );
  }, [blocks, isFocusMode]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const active = document.activeElement;
      const isTyping =
        active &&
        (active.tagName === 'INPUT' ||
          active.tagName === 'TEXTAREA' ||
          active.getAttribute('contenteditable') === 'true');

      if (e.key === '?' || (e.shiftKey && e.code === 'Slash')) {
        if (isTyping) return;
        e.preventDefault();
        setShowKeyboardHelp((prev) => !prev);
        return;
      }

      if (
        e.key.toLowerCase() === 'f' &&
        !isFocusMode &&
        blocks.length > 0 &&
        !isTyping &&
        !e.metaKey &&
        !e.ctrlKey &&
        !e.altKey
      ) {
        e.preventDefault();
        setIsFocusMode(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFocusMode, blocks.length]);

  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get('code');
    if (!code || !getCodeVerifier()) return;

    setOauthLoading(true);

    (async () => {
      try {
        const key = await exchangeCodeForKey(code);
        setPendingApiKey(key);
        setShowConsentModal(true);
        window.history.replaceState({}, document.title, '/');
      } catch (err: any) {
        setOauthError(err.message || 'Failed to exchange code for API key.');
      } finally {
        setOauthLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (apiKey && aiAdvice.startsWith('Connect')) {
      generateAdvice();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only re-run when a key appears
  }, [apiKey]);

  const handleConsentSession = () => {
    if (!pendingApiKey) return;
    storeApiKeySession(pendingApiKey);
    setAuthMode('session');
    setApiKey(pendingApiKey);
    setConnectionStatus('connected-session');
    setPendingApiKey(null);
    setShowConsentModal(false);
    setConsentError(null);
    window.history.replaceState({}, document.title, '/');
  };

  const handleConsentPasskey = async () => {
    if (!pendingApiKey) return;
    setConsentBusy(true);
    setConsentError(null);
    try {
      await sealSecretWithPasskey(pendingApiKey);
      storeApiKeySession(pendingApiKey);
      setAuthMode('passkey');
      setApiKey(pendingApiKey);
      setConnectionStatus('connected-passkey');
      setPendingApiKey(null);
      setShowConsentModal(false);
      window.history.replaceState({}, document.title, '/');
    } catch (err: any) {
      setConsentError(err?.message || 'Failed to lock key with passkey.');
    } finally {
      setConsentBusy(false);
    }
  };

  const unlockPasskeyVault = async () => {
    setUnlockBusy(true);
    setUnlockError(null);
    try {
      const key = await unlockSecretWithPasskey();
      storeApiKeySession(key);
      setAuthMode('passkey');
      setApiKey(key);
      setConnectionStatus('connected-passkey');
    } catch (err: any) {
      setUnlockError(err?.message || 'Failed to unlock passkey vault.');
    } finally {
      setUnlockBusy(false);
    }
  };

  const cancelConsent = () => {
    setPendingApiKey(null);
    setShowConsentModal(false);
    setConsentError(null);
    window.history.replaceState({}, document.title, '/');
  };

  const startConnect = async () => {
    try {
      const url = await buildAuthUrl();
      window.location.assign(url);
    } catch (err: any) {
      alert(`Connection initialization failed: ${err.message}`);
    }
  };

  const disconnect = () => {
    clearAllOpenRouterData();
    setApiKey(null);
    setConnectionStatus('disconnected');
    setAiAdvice('Connect OpenRouter to get personalized productivity advice.');
  };

  const toggleDarkMode = () => {
    setIsDark((prev) => {
      const next = !prev;
      localStorage.setItem(STORAGE_KEYS.colorMode, next ? 'dark' : 'light');
      return next;
    });
  };
  const toggleFocusMode = () => setIsFocusMode((prev) => !prev);

  const resetSession = () => {
    setBlocks((prev) => prev.map((b) => ({ ...b, completed: false, active: false })));
    localStorage.removeItem(STORAGE_KEYS.timerProgress);
  };

  const generateAdvice = async () => {
    if (!apiKey) {
      alert('Connect your OpenRouter account in Settings first!');
      return;
    }

    setIsLoadingAdvice(true);
    try {
      const sessionSummary = blocks
        .map(
          (b, i) =>
            `${i + 1}. ${b.label} (${Math.floor(b.duration / 60)} min, ${b.color})${b.description ? `: ${b.description}` : ''}`
        )
        .join('\n');

      const advice = await sendMessage(apiKey, modelId, [
        { role: 'system', content: SESSION_ADVICE_PROMPT },
        { role: 'user', content: `Here is my session today:\n${sessionSummary}` },
      ]);
      setAiAdvice(advice);
    } catch (err: any) {
      setAiAdvice(`Failed to generate advice: ${err.message}`);
    } finally {
      setIsLoadingAdvice(false);
    }
  };

  const shareAsQr = () => {
    try {
      const url = buildShareUrl(window.location.origin, stringifyBlocks(blocks));
      setShareUrl(url);
      setShowQrModal(true);
    } catch {
      alert('Failed to generate QR code for this session.');
    }
  };

  const persistModelId = (id: string, label?: string) => {
    setModelId(id);
    localStorage.setItem('openrouter_model_id', id);
    if (label !== undefined) {
      setModelLabel(label);
      localStorage.setItem('openrouter_model_label', label);
    }
  };

  const saveSettings = () => {
    localStorage.setItem('openrouter_model_id', modelId);
    localStorage.setItem('openrouter_model_label', modelLabel);
    localStorage.setItem(STORAGE_KEYS.theme, theme);
    savePromptMode(promptMode);
    setShowSettings(false);
  };

  if (pathname === '/prompts') {
    return <PromptsPage onNavigate={navigate} />;
  }

  if (pathname === '/ai') {
    return <AIAgentsPage onNavigate={navigate} />;
  }

  return (
    <div
      className={`min-h-screen app-container transition-colors duration-300${
        isFocusMode ? ' is-focus-mode' : ''
      }`}
    >
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
            onClick={() => navigate('/prompts')}
            className="inline-flex items-center justify-center min-h-11 min-w-11 rounded-md hover:bg-black/5 dark:hover:bg-white/5 transition-colors opacity-60 hover:opacity-100"
            title="AI Prompts"
            type="button"
          >
            <FileText size={18} />
          </button>

          <button
            onClick={() => setShowSettings(true)}
            className="inline-flex items-center justify-center min-h-11 min-w-11 rounded-md hover:bg-black/5 dark:hover:bg-white/5 transition-colors opacity-60 hover:opacity-100"
            title="Settings"
            type="button"
          >
            <Settings size={18} />
          </button>

          <button
            onClick={toggleDarkMode}
            className="inline-flex items-center justify-center min-h-11 min-w-11 rounded-md hover:bg-black/5 dark:hover:bg-white/5 transition-colors opacity-60 hover:opacity-100"
            title={isDark ? 'Light mode' : 'Dark mode'}
            type="button"
          >
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
          </button>

        </div>
      </header>

      <main
        className={`app-main max-w-4xl lg:max-w-none mx-auto w-full px-4 sm:px-6 lg:px-8 grow ${
          isDesktop ? 'pb-10' : 'pb-[calc(7.5rem+env(safe-area-inset-bottom,0px))]'
        }`}
      >
        {isFocusMode ? (
          <FocusView blocks={blocks} toggleFocusMode={toggleFocusMode} setBlocks={setBlocks} />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 lg:gap-x-8 lg:items-start space-y-5 sm:space-y-8 mt-4 sm:mt-6 lg:space-y-0 max-w-2xl mx-auto lg:max-w-none">
            {/* Blocks column — left at lg, second on mobile */}
            <div className="order-2 lg:order-none lg:col-start-1 flex flex-col space-y-5 sm:space-y-8 min-w-0">
              {isDesktop && (
                <SessionLaunchCard
                  blocks={blocks}
                  onStart={() => setIsFocusMode(true)}
                  onReset={resetSession}
                  resume={resume}
                />
              )}

              <div className="relative group">
                {apiKey ? (
                  <AIFeedback
                    message={aiAdvice}
                    type="suggestion"
                    onRefresh={generateAdvice}
                    isLoading={isLoadingAdvice}
                  />
                ) : (
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-lg border border-(--border-color) bg-(--block-color)">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 text-zinc-500">
                        <Sparkles size={16} />
                      </div>
                      <div className="text-sm opacity-70 leading-relaxed">
                        Connect <strong>OpenRouter</strong> to get personalized AI advice and unlock the full assistant.
                      </div>
                    </div>
                    <button onClick={startConnect} className="btn primary py-1.5 px-4 text-xs shrink-0" type="button">
                      Connect OpenRouter
                    </button>
                  </div>
                )}
              </div>

              <div className="mt-4 sm:mt-6">
                <div className="flex justify-between items-end mb-4 px-2">
                  <h2 className="text-xs font-mono uppercase tracking-widest opacity-50">Session Structure</h2>
                  <div className="flex items-center gap-4">
                    <button
                      onClick={shareAsQr}
                      className="flex items-center gap-1.5 min-h-11 px-2 text-xs font-mono uppercase tracking-wider opacity-40 hover:opacity-100 transition-opacity"
                      type="button"
                    >
                      <QrCode size={12} />
                      Share as QR
                    </button>
                  </div>
                </div>
                <BlockList blocks={blocks} setBlocks={setBlocks} />
              </div>
            </div>

            {/* AI column — right at lg, first on mobile */}
            <div className="order-1 lg:order-none lg:col-start-2 min-w-0">
              <CommandBar
                setBlocks={setBlocks}
                apiKey={apiKey}
                modelId={modelId}
                modelLabel={modelLabel}
                promptMode={promptMode}
                onOpenSettings={() => setShowSettings(true)}
                onModelChange={persistModelId}
              />
            </div>
          </div>
        )}
      </main>

      {showSettings && (
        <div className="modal-backdrop modal-backdrop--sheet" onClick={() => setShowSettings(false)} role="presentation">
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
                onClick={() => setShowSettings(false)}
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
                      onClick={unlockPasskeyVault}
                      disabled={unlockBusy}
                      className="btn primary w-full text-xs py-2"
                      type="button"
                    >
                      {unlockBusy ? 'Waiting for passkey…' : 'Unlock with passkey'}
                    </button>
                  )}
                  {connectionStatus === 'disconnected' ? (
                    <button onClick={startConnect} className="btn primary w-full text-xs py-2" type="button">
                      Connect OpenRouter via OAuth
                    </button>
                  ) : connectionStatus !== 'locked-passkey' ? (
                    <button
                      onClick={disconnect}
                      className="btn outline w-full text-xs py-2 border-red-500/30 text-red-400 hover:bg-red-500/10 hover:border-red-500/50"
                      type="button"
                    >
                      Disconnect OpenRouter
                    </button>
                  ) : (
                    <button
                      onClick={disconnect}
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
                  onChange={(e) => setTheme(e.target.value)}
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
                  onChange={persistModelId}
                  apiKey={apiKey}
                />
              </div>

              <div className="pt-2">
                <label className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={promptMode === 'verbose'}
                    onChange={(e) => setPromptMode(e.target.checked ? 'verbose' : 'compact')}
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
                onClick={() => {
                  setShowSettings(false);
                  navigate('/prompts');
                }}
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
                onClick={() => setShowSettings(false)}
                className="px-4 py-2 rounded-lg opacity-70 hover:opacity-100 hover:bg-(--block-color) transition-all text-xs"
                type="button"
              >
                Cancel
              </button>
              <button
                onClick={saveSettings}
                className="px-4 py-2 rounded-lg bg-white text-black font-semibold hover:scale-[1.02] transition-transform text-xs"
                type="button"
              >
                Save Settings
              </button>
            </div>
          </div>
        </div>
      )}

      {showConsentModal && (
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
              <button className="btn outline text-xs" onClick={cancelConsent} type="button" disabled={consentBusy}>
                Cancel
              </button>
              <button
                className="btn outline text-xs"
                onClick={handleConsentSession}
                type="button"
                disabled={consentBusy}
              >
                Use session only
              </button>
              <button
                className="btn primary text-xs"
                onClick={handleConsentPasskey}
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
      )}

      {connectionStatus === 'locked-passkey' && !showSettings && !showConsentModal && !oauthLoading && (
        <div className="fixed bottom-4 inset-x-4 z-40 sm:inset-x-auto sm:right-4 sm:left-auto sm:w-96">
          <div className="glass rounded-xl border border-(--border-color) p-4 shadow-lg space-y-3">
            <p className="text-sm font-mono">
              OpenRouter key is sealed with your passkey. Unlock to use AI features.
            </p>
            {unlockError && <div className="alert alert-danger text-xs">{unlockError}</div>}
            <button
              onClick={unlockPasskeyVault}
              disabled={unlockBusy}
              className="btn primary w-full text-xs py-2"
              type="button"
            >
              {unlockBusy ? 'Waiting for passkey…' : 'Unlock with passkey'}
            </button>
          </div>
        </div>
      )}

      {oauthLoading && (
        <div className="modal-backdrop">
          <div className="modal glass max-w-xs text-center space-y-4">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm font-semibold">Exchanging code for OpenRouter API key...</p>
          </div>
        </div>
      )}

      {oauthError && (
        <div className="modal-backdrop">
          <div className="modal glass max-w-md space-y-4">
            <h3 className="text-lg font-bold text-red-400">Login error</h3>
            <div className="alert alert-danger text-xs font-mono">{oauthError}</div>
            <div className="flex justify-end">
              <button
                className="btn primary text-xs"
                onClick={() => {
                  setOauthError(null);
                  window.history.replaceState({}, document.title, '/');
                }}
                type="button"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {showQrModal && (
        <div className="modal-backdrop">
          <div className="modal glass max-w-sm text-center space-y-6">
            <div className="flex justify-between items-center pb-2 border-b border-(--border-color)">
              <h3 className="text-md font-mono font-semibold flex items-center gap-2">
                <QrCode size={18} />
                Share Session
              </h3>
              <button
                onClick={() => setShowQrModal(false)}
                className="opacity-50 hover:opacity-100 p-1 rounded-md hover:bg-white/5"
                type="button"
              >
                <X size={20} />
              </button>
            </div>
            <div className="flex justify-center bg-white p-4 rounded-xl">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(shareUrl)}`}
                alt="QR Code"
                className="w-48 h-48"
              />
            </div>
            <p className="text-xs opacity-75 font-mono">
              Scan with your phone or copy the link below to import this session.
            </p>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                readOnly
                value={shareUrl}
                className="w-full min-w-0 text-xs p-2.5 border border-(--border-color) bg-(--block-color) rounded-lg select-all outline-none font-mono"
              />
              <button
                onClick={() => {
                  navigator.clipboard.writeText(shareUrl);
                  alert('Link copied to clipboard!');
                }}
                className="btn primary py-2 px-3 text-xs flex items-center gap-1.5"
                title="Copy link"
                type="button"
              >
                <Copy size={14} />
              </button>
            </div>
          </div>
        </div>
      )}

      {showKeyboardHelp && (
        <div className="modal-backdrop">
          <div className="modal glass max-w-md text-left space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-(--border-color)">
              <h3 className="text-md font-mono font-semibold flex items-center gap-2">
                <Keyboard size={18} />
                Keyboard Shortcuts (Focus Mode)
              </h3>
              <button
                onClick={() => setShowKeyboardHelp(false)}
                className="opacity-50 hover:opacity-100 p-1 rounded-md hover:bg-white/5"
                type="button"
              >
                <X size={20} />
              </button>
            </div>
            <div className="space-y-3 font-mono text-sm">
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="opacity-75">Space</span>
                <span className="font-semibold text-(--color-primary)">Pause / resume · confirm next</span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="opacity-75">Enter</span>
                <span className="font-semibold text-(--color-primary)">Confirm next slot</span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="opacity-75">Right arrow</span>
                <span className="font-semibold text-(--color-primary)">Skip if skippable, or at hold gate</span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="opacity-75">Left arrow</span>
                <span className="font-semibold text-(--color-primary)">Previous block</span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="opacity-75">R</span>
                <span className="font-semibold text-(--color-primary)">Retry if retryable, or at hold gate</span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="opacity-75">ESC</span>
                <span className="font-semibold text-(--color-primary)">Exit Focus Mode</span>
              </div>
              <div className="flex justify-between py-1 pt-3 text-xs opacity-50">
                <span>Press ? anytime to open this help.</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {!isFocusMode && !isDesktop && (
        <div className="fixed inset-x-0 bottom-0 z-30 flex items-center justify-center gap-3 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] border-t border-(--border-color) bg-[var(--bg-color)]/95 backdrop-blur-md">
          <button
            onClick={resetSession}
            className="w-12 h-12 flex items-center justify-center rounded-full border border-(--border-color) hover:bg-(--block-color) transition-colors opacity-70 hover:opacity-100"
            title="Reset Session"
            aria-label="Reset Session"
            type="button"
          >
            <RefreshCcw size={18} />
          </button>
          <button
            onClick={toggleFocusMode}
            className="flex items-center gap-2 px-6 py-3 bg-white text-black dark:bg-white dark:text-black rounded-full text-sm font-medium hover:opacity-90 transition-opacity shadow-lg"
            type="button"
            aria-label={resume ? 'Resume Session' : 'Start Session'}
          >
            <Play size={16} />
            <span>{resume ? 'Resume Session' : 'Start Session'}</span>
          </button>
        </div>
      )}

      {!isFocusMode && (
        <footer className="max-w-4xl lg:max-w-none mx-auto w-full px-4 sm:px-6 lg:px-8 py-4 mt-8 border-t border-(--border-color)/30">
          <div className="flex flex-wrap items-center justify-center gap-4 text-xs opacity-50 hover:opacity-70 transition-opacity">
            <a
              href="/llms.txt"
              className="font-mono hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              For AI agents / LLMs
            </a>
            <span className="opacity-30">•</span>
            <button
              onClick={() => navigate('/ai')}
              className="font-mono hover:underline"
              type="button"
            >
              AI Integration Docs
            </button>
          </div>
        </footer>
      )}
    </div>
  );
}

export default App;
