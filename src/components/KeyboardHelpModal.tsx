import { X } from 'lucide-react';

type KeyboardHelpModalProps = {
  onClose: () => void;
};

export function KeyboardHelpModal({ onClose }: KeyboardHelpModalProps) {
  return (
    <div className="modal-backdrop">
      <div className="modal max-w-md space-y-4 text-left">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold">Focus keys</h3>
          <button
            onClick={onClose}
            className="opacity-50 hover:opacity-100 p-1 rounded-md hover:bg-white/5"
            type="button"
          >
            <X size={20} />
          </button>
        </div>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between gap-4 py-1">
            <span className="text-(--muted-text)">Space</span>
            <span>Pause, resume, or confirm next</span>
          </div>
          <div className="flex justify-between gap-4 py-1">
            <span className="text-(--muted-text)">Enter</span>
            <span>Confirm next slot</span>
          </div>
          <div className="flex justify-between gap-4 py-1">
            <span className="text-(--muted-text)">Right arrow</span>
            <span>Skip, or pass a hold</span>
          </div>
          <div className="flex justify-between gap-4 py-1">
            <span className="text-(--muted-text)">Left arrow</span>
            <span>Previous block</span>
          </div>
          <div className="flex justify-between gap-4 py-1">
            <span className="text-(--muted-text)">R</span>
            <span>Retry, or pass a hold</span>
          </div>
          <div className="flex justify-between gap-4 py-1">
            <span className="text-(--muted-text)">Esc</span>
            <span>Leave focus</span>
          </div>
          <p className="pt-2 text-xs text-(--muted-text)">Press ? to open this list.</p>
        </div>
      </div>
    </div>
  );
}
