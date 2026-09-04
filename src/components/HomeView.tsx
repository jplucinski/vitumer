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
    <div className="grid grid-cols-1 lg:grid-cols-2 lg:gap-x-8 lg:items-start space-y-5 sm:space-y-8 mt-4 sm:mt-6 lg:space-y-0 max-w-2xl mx-auto lg:max-w-none">
      <div className="order-2 lg:order-none lg:col-start-1 flex flex-col space-y-5 sm:space-y-8 min-w-0">
        {isDesktop && (
          <SessionLaunchCard
            blocks={blocks}
            onStart={onStartFocus}
            onReset={onResetSession}
            resume={resume}
          />
        )}

        <div className="relative group">
          {apiKey ? (
            <AIFeedback
              message={aiAdvice}
              type="suggestion"
              onRefresh={onRefreshAdvice}
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
              <button onClick={onStartConnect} className="btn primary py-1.5 px-4 text-xs shrink-0" type="button">
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
                onClick={onShareQr}
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

      <div className="order-1 lg:order-none lg:col-start-2 min-w-0">
        <CommandBar
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
