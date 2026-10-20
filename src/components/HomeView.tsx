import type { Dispatch, SetStateAction } from 'react';
import type { FlowBlock } from '../utils/dslParser';
import type { RestoredTimer } from '../utils/timerProgress';
import type { PromptMode } from '../constants/aiPrompts';
import CommandBar from './CommandBar';
import BlockList from './BlockList';
import SessionLaunchCard from './SessionLaunchCard';
import AIFeedback from './AIFeedback';

type HomeViewProps = {
  isDesktop: boolean;
  blocks: FlowBlock[];
  setBlocks: Dispatch<SetStateAction<FlowBlock[]>>;
  resume: RestoredTimer | null;
  apiKey: string | null;
  modelId: string;
  modelLabel: string;
  promptMode: PromptMode;
  aiAdvice: string;
  isLoadingAdvice: boolean;
  onStartFocus: () => void;
  onResetSession: () => void;
  onShareQr: () => void;
  onStartConnect: () => void;
  onRefreshAdvice: () => void;
  onOpenSettings: () => void;
  onModelChange: (id: string, label?: string) => void;
  connectionLabel: string;
};

export function HomeView({
  blocks,
  setBlocks,
  resume,
  apiKey,
  modelId,
  modelLabel,
  promptMode,
  aiAdvice,
  isLoadingAdvice,
  onStartFocus,
  onResetSession,
  onShareQr,
  onStartConnect,
  onRefreshAdvice,
  onOpenSettings,
  onModelChange,
  connectionLabel,
}: HomeViewProps) {
  return (
    <div>
      <SessionLaunchCard
        blocks={blocks}
        onStart={onStartFocus}
        onReset={onResetSession}
        resume={resume}
        connectionLabel={connectionLabel}
      />

      {apiKey ? (
        <div className="mt-6">
          <AIFeedback
            message={aiAdvice}
            type="suggestion"
            onRefresh={onRefreshAdvice}
            isLoading={isLoadingAdvice}
          />
        </div>
      ) : (
        <div className="mt-6 flex flex-col items-start justify-between gap-3 bg-(--block-color) px-4 py-3 sm:flex-row sm:items-center">
          <p className="text-sm leading-relaxed text-(--muted-text)">
            Connect OpenRouter to draft blocks from a sentence.
          </p>
          <button onClick={onStartConnect} className="btn outline shrink-0 px-4 py-2 text-sm" type="button">
            Connect OpenRouter
          </button>
        </div>
      )}

      <div className="session-grid">
        <section className="min-w-0">
          <div className="mb-3 flex items-end justify-between gap-3">
            <h2 className="screen-section">Blocks</h2>
            <button
              onClick={onShareQr}
              className="mb-3 min-h-11 px-1 text-sm text-(--muted-text) hover:text-(--text-color)"
              type="button"
            >
              Share as QR
            </button>
          </div>
          <BlockList blocks={blocks} setBlocks={setBlocks} />
        </section>

        <section className="min-w-0">
          <h2 className="screen-section">Build</h2>
          <CommandBar
            blocks={blocks}
            setBlocks={setBlocks}
            apiKey={apiKey}
            modelId={modelId}
            modelLabel={modelLabel}
            promptMode={promptMode}
            onOpenSettings={onOpenSettings}
            onModelChange={onModelChange}
          />
        </section>
      </div>
    </div>
  );
}
