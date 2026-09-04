import { QrCode, X, Copy } from 'lucide-react';

type QrShareModalProps = {
  shareUrl: string;
  onClose: () => void;
};

export function QrShareModal({ shareUrl, onClose }: QrShareModalProps) {
  return (
    <div className="modal-backdrop">
      <div className="modal glass max-w-sm text-center space-y-6">
        <div className="flex justify-between items-center pb-2 border-b border-(--border-color)">
          <h3 className="text-md font-mono font-semibold flex items-center gap-2">
            <QrCode size={18} />
            Share Session
          </h3>
          <button
            onClick={onClose}
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
  );
}
