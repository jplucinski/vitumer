// src/components/AIFeedback.tsx
import { Sparkles, RotateCw } from 'lucide-react';

type Props = {
  message: string;
  type?: string;
  onRefresh?: () => void;
  isLoading?: boolean;
};

const AIFeedback = ({ message, onRefresh, isLoading = false }: Props) => {
  return (
    <div className="flex flex-col items-start gap-3 bg-(--block-color) p-4 sm:flex-row">
      <div className={`mt-0.5 text-blue-400 ${isLoading ? 'animate-spin' : ''}`}>
        <Sparkles size={16} />
      </div>
      <div className="flex-1 text-sm opacity-90 leading-relaxed">
        {isLoading ? 'Analyzing your work schedule...' : message}
      </div>
      {onRefresh && !isLoading && (
        <button 
          onClick={onRefresh}
          className="text-xs font-medium text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1.5 focus:outline-none shrink-0 self-end sm:self-auto"
          title="Refresh AI advice"
          type="button"
        >
          <RotateCw size={12} />
          <span>Refresh</span>
        </button>
      )}
    </div>
  );
};

export default AIFeedback;
