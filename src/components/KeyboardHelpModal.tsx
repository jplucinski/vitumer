import { Keyboard, X } from 'lucide-react';

type KeyboardHelpModalProps = {
  onClose: () => void;
};

export function KeyboardHelpModal({ onClose }: KeyboardHelpModalProps) {
  return (
    <div className="modal-backdrop">
      <div className="modal glass max-w-md text-left space-y-4">
        <div className="flex justify-between items-center pb-2 border-b border-(--border-color)">
          <h3 className="text-md font-mono font-semibold flex items-center gap-2">
            <Keyboard size={18} />
            Keyboard Shortcuts (Focus Mode)
          </h3>
          <button
            onClick={onClose}
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
  );
}
