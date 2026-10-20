import { Sparkles, QrCode } from 'lucide-react';
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
};

export function HomeView({
  isDesktop,
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
}: HomeViewProps) {
  return (
    <div className="mt-2 grid grid-cols-1 items-start gap-8 lg:grid-cols-12 lg:gap-10">
      <div className="flex min-w-0 flex-col gap-6 lg:col-span-5">
        {isDesktop && (
          <SessionLaunchCard
            blocks={blocks}
            onStart={onStartFocus}
            onReset={onResetSession}
            resume={resume}
          />
        )}

        {apiKey ? (
          <AIFeedback
            message={aiAdvice}
            type="suggestion"
            onRefresh={onRefreshAdvice}
            isLoading={isLoadingAdvice}
          />
        ) : (
          <div className="flex flex-col items-center justify-between gap-4 rounded-3xl border border-(--border-color) bg-(--block-color) p-5 sm:flex-row">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 text-zinc-500">
                <Sparkles size={16} />
              </div>
              <div className="text-sm leading-relaxed opacity-70">
                Connect <strong>OpenRouter</strong> to get personalized AI advice and unlock the full assistant.
              </div>
            </div>
            <button onClick={onStartConnect} className="btn primary shrink-0 px-4 py-1.5 text-xs" type="button">
              Connect OpenRouter
            </button>
          </div>
        )}

        <div>
          <div className="mb-4 flex items-end justify-between px-1">
            <h2 className="text-sm font-medium">This session</h2>
            <button
              onClick={onShareQr}
              className="flex min-h-11 items-center gap-1.5 px-2 text-xs font-medium opacity-60 transition-opacity hover:opacity-100"
              type="button"
            >
              <QrCode size={14} />
              Share as QR
            </button>
          </div>
          <BlockList blocks={blocks} setBlocks={setBlocks} />
        </div>
      </div>

      <div className="min-w-0 lg:col-span-7">
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
      </div>
    </div>
  );
}
