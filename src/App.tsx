import FocusView from './components/FocusView';
import PromptsPage from './components/PromptsPage';
import AIAgentsPage from './components/AIAgentsPage';
import { AppHeader } from './components/AppHeader';
import { HomeView } from './components/HomeView';
import { SettingsModal } from './components/SettingsModal';
import { ConsentModal } from './components/ConsentModal';
import { PasskeyUnlockBanner } from './components/PasskeyUnlockBanner';
import { OAuthStatusModals } from './components/OAuthStatusModals';
import { QrShareModal } from './components/QrShareModal';
import { KeyboardHelpModal } from './components/KeyboardHelpModal';
import { MobileSessionBar } from './components/MobileSessionBar';
import { stringifyBlocks } from './utils/dslSchema';
import { buildShareUrl } from './utils/shareFlow';
import { BREAKPOINTS } from './constants/breakpoints';
import { usePathname, useNavigate } from './hooks/usePathname';
import { useMinWidth } from './hooks/useMinWidth';
import { useSessionState } from './hooks/useSessionState';
import { useOpenRouterAuth } from './hooks/useOpenRouterAuth';
import { useAppUi } from './hooks/useAppUi';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';

function App() {
  const pathname = usePathname();
  const navigate = useNavigate();
  const isDesktop = useMinWidth(BREAKPOINTS.lg);

  const {
    blocks,
    resume,
    isFocusMode,
    setBlocks,
    resetSession,
    toggleFocusMode,
    enterFocusMode,
  } = useSessionState();

  const auth = useOpenRouterAuth(blocks);

  const ui = useAppUi();

  useKeyboardShortcuts({
    isFocusMode,
    blocksCount: blocks.length,
    onToggleKeyboardHelp: ui.toggleKeyboardHelp,
    onEnterFocusMode: enterFocusMode,
  });

  const shareAsQr = () => {
    try {
      const url = buildShareUrl(window.location.origin, stringifyBlocks(blocks));
      ui.openQrModal(url);
    } catch {
      alert('Failed to generate QR code for this session.');
    }
  };

  const handleSaveSettings = () => {
    auth.saveSettings(ui.theme);
    ui.persistTheme(ui.theme);
    ui.closeSettings();
  };

  const handleNavigatePrompts = () => {
    ui.closeSettings();
    navigate('/prompts');
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
      <AppHeader
        connectionStatus={auth.connectionStatus}
        isDark={ui.isDark}
        onNavigatePrompts={() => navigate('/prompts')}
        onOpenSettings={ui.openSettings}
        onToggleDarkMode={ui.toggleDarkMode}
      />

      <main
        className={`app-main max-w-4xl lg:max-w-none mx-auto w-full px-4 sm:px-6 lg:px-8 grow ${
          isDesktop ? 'pb-10' : 'pb-[calc(7.5rem+env(safe-area-inset-bottom,0px))]'
        }`}
      >
        {isFocusMode ? (
          <FocusView blocks={blocks} toggleFocusMode={toggleFocusMode} setBlocks={setBlocks} />
        ) : (
          <HomeView
            isDesktop={isDesktop}
            blocks={blocks}
            setBlocks={setBlocks}
            resume={resume}
            apiKey={auth.apiKey}
            modelId={auth.modelId}
            modelLabel={auth.modelLabel}
            promptMode={auth.promptMode}
            aiAdvice={auth.aiAdvice}
            isLoadingAdvice={auth.isLoadingAdvice}
            onStartFocus={enterFocusMode}
            onResetSession={resetSession}
            onShareQr={shareAsQr}
            onStartConnect={auth.startConnect}
            onRefreshAdvice={auth.generateAdvice}
            onOpenSettings={ui.openSettings}
            onModelChange={auth.persistModelId}
          />
        )}
      </main>

      {ui.showSettings && (
        <SettingsModal
          connectionStatus={auth.connectionStatus}
          unlockError={auth.unlockError}
          unlockBusy={auth.unlockBusy}
          theme={ui.theme}
          modelId={auth.modelId}
          modelLabel={auth.modelLabel}
          promptMode={auth.promptMode}
          apiKey={auth.apiKey}
          onClose={ui.closeSettings}
          onSave={handleSaveSettings}
          onThemeChange={ui.setTheme}
          onPromptModeChange={auth.setPromptMode}
          onModelChange={auth.persistModelId}
          onStartConnect={auth.startConnect}
          onDisconnect={auth.disconnect}
          onUnlockPasskey={auth.unlockPasskeyVault}
          onNavigatePrompts={handleNavigatePrompts}
        />
      )}

      {auth.showConsentModal && (
        <ConsentModal
          consentError={auth.consentError}
          consentBusy={auth.consentBusy}
          prfAvailable={auth.prfAvailable}
          onCancel={auth.cancelConsent}
          onSessionOnly={auth.handleConsentSession}
          onPasskey={auth.handleConsentPasskey}
        />
      )}

      {auth.connectionStatus === 'locked-passkey' &&
        !ui.showSettings &&
        !auth.showConsentModal &&
        !auth.oauthLoading && (
          <PasskeyUnlockBanner
            unlockError={auth.unlockError}
            unlockBusy={auth.unlockBusy}
            onUnlock={auth.unlockPasskeyVault}
          />
        )}

      <OAuthStatusModals
        oauthLoading={auth.oauthLoading}
        oauthError={auth.oauthError}
        onClearError={auth.clearOauthError}
      />

      {ui.showQrModal && <QrShareModal shareUrl={ui.shareUrl} onClose={ui.closeQrModal} />}

      {ui.showKeyboardHelp && <KeyboardHelpModal onClose={ui.closeKeyboardHelp} />}

      {!isFocusMode && !isDesktop && (
        <MobileSessionBar resume={resume} onReset={resetSession} onToggleFocus={toggleFocusMode} />
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
            <button onClick={() => navigate('/ai')} className="font-mono hover:underline" type="button">
              AI Integration Docs
            </button>
          </div>
        </footer>
      )}
    </div>
  );
}

export default App;
