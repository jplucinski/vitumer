import { useState, useEffect, type ChangeEvent, type Dispatch, type SetStateAction } from 'react';
import { GripVertical, Clock, X, Edit3, Trash2 } from 'lucide-react';
import clsx from 'clsx';
import { BLOCK_COLORS, BLOCK_EMOJIS, COLOR_SWATCH, swatch } from '../constants/blockOptions';
import type { FlowBlock } from '../utils/dslParser';

const DURATION_PRESETS = [
  { label: '30s', seconds: 30 },
  { label: '1m', seconds: 60 },
  { label: '5m', seconds: 300 },
  { label: '10m', seconds: 600 },
  { label: '25m', seconds: 1500 },
] as const;

type BlockDraft = {
  id: string;
  label: string;
  duration: number;
  description: string;
  emoji: string;
  color: string;
  skippable: boolean;
  retryable: boolean;
  hold: boolean;
};

type BlockListProps = {
  blocks: FlowBlock[];
  setBlocks: Dispatch<SetStateAction<FlowBlock[]>>;
};

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m === 0) return `${s}s`;
  if (s === 0) return `${m}m`;
  return `${m}m ${s}s`;
}

type FlagToggleProps = {
  checked: boolean;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  label: string;
  hint?: string;
};

function FlagToggle({ checked, onChange, label, hint }: FlagToggleProps) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-3 bg-(--bg-color) px-3 py-3">
      <span className="text-xs min-w-0">
        {label}
        {hint ? <span className="block opacity-45 font-normal mt-0.5">{hint}</span> : null}
      </span>
      <span className="relative h-[22px] w-10 shrink-0 rounded-full">
        <input
          type="checkbox"
          role="switch"
          checked={checked}
          onChange={onChange}
          className="sr-only"
        />
        <span
          className={clsx(
            'absolute inset-0 rounded-full transition-colors pointer-events-none',
            checked ? 'bg-white' : 'bg-black/15 dark:bg-white/15'
          )}
        />
        <span
          className={clsx(
            'absolute top-[2px] left-[2px] w-[18px] h-[18px] rounded-full transition-transform pointer-events-none',
            checked ? 'translate-x-[18px] bg-black' : 'bg-white dark:bg-(--bg-color)'
          )}
        />
      </span>
    </label>
  );
}

const emptyDraft = (): BlockDraft => ({
  id: '',
  label: '',
  duration: 1500,
  description: '',
  emoji: '',
  color: 'orange',
  skippable: false,
  retryable: false,
  hold: false,
});

const BlockList = ({ blocks, setBlocks }: BlockListProps) => {
  const [selectedBlock, setSelectedBlock] = useState<FlowBlock | null>(null);
  const [draft, setDraft] = useState<BlockDraft>(emptyDraft);

  useEffect(() => {
    if (selectedBlock) {
      setDraft({
        id: selectedBlock.id,
        label: selectedBlock.label || '',
        duration: selectedBlock.duration,
        description: selectedBlock.description || '',
        emoji: selectedBlock.emoji || '',
        color: selectedBlock.color || 'orange',
        skippable: selectedBlock.skippable || false,
        retryable: selectedBlock.retryable || false,
        hold: selectedBlock.hold || false,
      });
    }
  }, [selectedBlock]);

  const addBlock = () => {
    const newBlock: FlowBlock = {
      id: Math.random().toString(36).substring(2, 11),
      duration: 25 * 60,
      label: 'new task',
      completed: false,
      active: false,
      description: '',
      emoji: '',
      color: 'orange',
      skippable: false,
      retryable: false,
      hold: false,
    };
    setBlocks((prev) => [...prev, newBlock]);
    setSelectedBlock(newBlock);
  };

  const saveBlock = () => {
    setBlocks((prev) =>
      prev.map((block) =>
        block.id === draft.id
          ? {
              ...block,
              label: draft.label,
              duration: Number(draft.duration),
              description: draft.description,
              emoji: draft.emoji,
              color: draft.color,
              skippable: draft.skippable,
              retryable: draft.retryable,
              hold: draft.hold,
            }
          : block
      )
    );
    setSelectedBlock(null);
  };

  const deleteBlock = () => {
    if (!draft.id) return;
    setBlocks((prev) => prev.filter((block) => block.id !== draft.id));
    setSelectedBlock(null);
  };

  return (
    <div className="space-y-2.5">
      {blocks.map((block) => (
        <div
          key={block.id}
          role="button"
          tabIndex={0}
          onClick={() => setSelectedBlock(block)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              setSelectedBlock(block);
            }
          }}
          className={clsx(
            'block-card group w-full text-left flex items-stretch gap-0 overflow-hidden cursor-pointer bg-(--block-color)',
            selectedBlock?.id === block.id && 'bg-(--surface-elevated)',
            block.completed && 'is-completed'
          )}
          style={{ '--block-accent': swatch(block.color) }}
        >
          <div
            className="w-1 shrink-0"
            style={{ backgroundColor: swatch(block.color) }}
            aria-hidden
          />

          <div className="flex flex-1 items-start gap-2.5 p-3 min-w-0">
            <div className="hidden sm:flex cursor-grab opacity-25 group-hover:opacity-55 mt-1 shrink-0">
              <GripVertical size={16} />
            </div>

            <div className="flex-1 min-w-0 text-sm flex flex-col gap-1">
              <div className="flex items-center justify-between gap-2 min-w-0">
                <span
                  className={clsx(
                    'font-medium truncate',
                    block.completed && 'line-through opacity-70'
                  )}
                >
                  {block.label}
                </span>
                <span className="num inline-flex items-center gap-1 text-xs text-(--muted-text) shrink-0">
                  <Clock size={12} />
                  {formatDuration(block.duration)}
                </span>
              </div>
              {block.description && (
                <p className="text-xs text-(--muted-text) line-clamp-2 leading-relaxed">{block.description}</p>
              )}
              {block.completed && (
                <span className="text-xs text-(--muted-text)">Done</span>
              )}
            </div>

            <div className="hidden sm:flex items-center gap-0.5 shrink-0 self-center">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedBlock(block);
                }}
                className="inline-flex items-center justify-center p-2 rounded-xl opacity-70 hover:opacity-100 hover:bg-black/5 dark:hover:bg-white/10 transition-all"
                aria-label="Edit block"
              >
                <Edit3 size={15} />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setBlocks((prev) => prev.filter((item) => item.id !== block.id));
                }}
                className="inline-flex items-center justify-center rounded-xl p-2 text-(--text-color) transition-colors hover:bg-red-500/10 hover:text-red-700 dark:hover:text-red-300"
                aria-label="Delete block"
              >
                <Trash2 size={15} />
              </button>
            </div>
          </div>
        </div>
      ))}

      <button
        onClick={addBlock}
        className="w-full mt-1 p-3.5 border border-dashed border-(--border-color) rounded-2xl text-sm opacity-60 hover:opacity-100 hover:bg-(--block-color) hover:border-solid transition-all flex items-center justify-center gap-2 font-mono"
        type="button"
      >
        + Add Block
      </button>

      {selectedBlock && (
        <div
          className="modal-backdrop modal-backdrop--sheet"
          onClick={() => setSelectedBlock(null)}
          role="presentation"
        >
          <div
            className="modal-panel max-w-lg"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-block-title"
          >
            <div
              className="h-1 w-full shrink-0"
              style={{ backgroundColor: swatch(draft.color) }}
            />

            <div className="flex items-start justify-between gap-3 p-5 pb-3 shrink-0">
              <div className="min-w-0">
                  <p className="text-xs text-(--muted-text)">Edit block</p>
                  <h3 id="edit-block-title" className="text-lg font-semibold truncate">
                    {draft.label || 'Untitled'}
                  </h3>
                  <p className="text-xs opacity-50 mt-0.5">{formatDuration(draft.duration)}</p>
              </div>
              <button
                onClick={() => setSelectedBlock(null)}
                className="opacity-50 hover:opacity-100 p-2 rounded-full hover:bg-(--block-color) transition-all shrink-0"
                type="button"
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>

            <div className="overflow-y-auto px-5 flex-1 min-h-0">
              <div className="grid grid-cols-1 gap-4 pb-4">
                <div>
                  <label className="mb-1.5 block text-xs text-(--muted-text)">
                    Label
                  </label>
                  <input
                    type="text"
                    value={draft.label}
                    onChange={(e) => setDraft((prev) => ({ ...prev, label: e.target.value }))}
                    className="input"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs text-(--muted-text)">
                    Duration
                  </label>
                  <div className="flex flex-wrap gap-1.5 mb-2.5">
                    {DURATION_PRESETS.map((preset) => (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => setDraft((prev) => ({ ...prev, duration: preset.seconds }))}
                        className={clsx(
                          'border px-2.5 py-1 text-xs',
                          draft.duration === preset.seconds
                            ? 'tab-active'
                            : 'border-transparent text-(--muted-text) hover:text-(--text-color)'
                        )}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="mb-1 block text-xs text-(--muted-text)">Minutes</label>
                      <input
                        type="number"
                        min={0}
                        value={Math.floor(draft.duration / 60)}
                        onChange={(e) => {
                          const minutes = Math.max(0, Number(e.target.value) || 0);
                          const seconds = draft.duration % 60;
                          setDraft((prev) => ({
                            ...prev,
                            duration: Math.max(1, minutes * 60 + seconds),
                          }));
                        }}
                        className="input num"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs text-(--muted-text)">Seconds</label>
                      <input
                        type="number"
                        min={0}
                        max={59}
                        value={draft.duration % 60}
                        onChange={(e) => {
                          const seconds = Math.min(59, Math.max(0, Number(e.target.value) || 0));
                          const minutes = Math.floor(draft.duration / 60);
                          setDraft((prev) => ({
                            ...prev,
                            duration: Math.max(1, minutes * 60 + seconds),
                          }));
                        }}
                        className="input num"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-xs text-(--muted-text)">
                    Color
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {BLOCK_COLORS.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setDraft((prev) => ({ ...prev, color }))}
                        className={clsx(
                          'h-8 w-8 border',
                          draft.color === color
                            ? 'border-(--text-color)'
                            : 'border-transparent'
                        )}
                        style={{ backgroundColor: COLOR_SWATCH[color] }}
                        title={color}
                        aria-label={color}
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-xs text-(--muted-text)">
                    Emoji
                  </label>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setDraft((prev) => ({ ...prev, emoji: '' }))}
                      className={clsx(
                        'h-8 w-8 border text-xs text-(--muted-text)',
                        !draft.emoji
                          ? 'border-white/40 bg-white/10'
                          : 'border-(--border-color) bg-(--block-color)'
                      )}
                      title="None"
                    >
                      ∅
                    </button>
                    {BLOCK_EMOJIS.map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => setDraft((prev) => ({ ...prev, emoji }))}
                        className={clsx(
                          'h-8 w-8 border text-base',
                          draft.emoji === emoji
                            ? 'border-white/40 bg-white/10'
                            : 'border-(--border-color) bg-(--block-color)'
                        )}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs text-(--muted-text)">
                    Description
                  </label>
                  <textarea
                    rows={3}
                    value={draft.description}
                    onChange={(e) => setDraft((prev) => ({ ...prev, description: e.target.value }))}
                    className="input resize-none"
                    placeholder="Optional notes for this block…"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <FlagToggle
                    checked={draft.skippable}
                    onChange={(e) => setDraft((prev) => ({ ...prev, skippable: e.target.checked }))}
                    label="Skippable"
                  />
                  <FlagToggle
                    checked={draft.retryable}
                    onChange={(e) => setDraft((prev) => ({ ...prev, retryable: e.target.checked }))}
                    label="Retryable"
                  />
                  <div className="col-span-2">
                    <FlagToggle
                      checked={draft.hold}
                      onChange={(e) => setDraft((prev) => ({ ...prev, hold: e.target.checked }))}
                      label="Hold"
                      hint="Wait for tap before next slot"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 sm:p-5 flex flex-col gap-2.5 shrink-0 border-t border-(--border-color) bg-(--bg-color)">
              <button
                onClick={saveBlock}
                className="btn btn-primary-solid w-full py-3.5 text-sm font-semibold"
                type="button"
              >
                Save changes
              </button>
              <div className="flex gap-2">
                <button
                  onClick={() => setSelectedBlock(null)}
                  className="btn outline flex-1 px-4 py-2.5 text-sm"
                  type="button"
                >
                  Cancel
                </button>
                <button
                  onClick={deleteBlock}
                  className="btn outline flex-1 px-4 py-2.5 text-sm text-(--pill-negative-ink)"
                  type="button"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BlockList;
