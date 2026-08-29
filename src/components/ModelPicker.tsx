import { useCallback, useEffect, useRef, useState } from 'react';
import { Loader2, RefreshCcw } from 'lucide-react';
import { fetchOpenRouterModels, type ModelSort, type OpenRouterModel } from '../utils/openrouterAuth';
import { modelPickerDisplay } from '../utils/modelPickerDisplay';

type Props = {
  value: string;
  label?: string;
  onChange: (modelId: string, label?: string) => void;
  apiKey?: string | null;
  variant?: 'default' | 'compact';
};

function formatContextLength(tokens?: number): string | null {
  if (!tokens) return null;
  if (tokens >= 1_000_000) return `${(tokens / 1_000_000).toFixed(1)}M ctx`;
  if (tokens >= 1_000) return `${Math.round(tokens / 1_000)}K ctx`;
  return `${tokens} ctx`;
}

function formatPrice(pricing?: OpenRouterModel['pricing']): string | null {
  if (!pricing?.prompt) return null;
  const prompt = Number.parseFloat(pricing.prompt);
  const completion = Number.parseFloat(pricing.completion ?? pricing.prompt);
  if (!Number.isFinite(prompt)) return null;
  const avgPerToken = (prompt + (Number.isFinite(completion) ? completion : prompt)) / 2;
  const perM = avgPerToken * 1_000_000;
  if (perM < 0.01) return `$${perM.toFixed(3)}/M`;
  if (perM < 1) return `$${perM.toFixed(2)}/M`;
  return `$${perM.toFixed(1)}/M`;
}

export function ModelPicker({ value, label, onChange, apiKey, variant = 'default' }: Props) {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [sort, setSort] = useState<ModelSort>('most-popular');
  const [models, setModels] = useState<OpenRouterModel[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fetchIdRef = useRef(0);

  const fetchQuery = isSearching ? query : '';

  const loadModels = useCallback(
    async (q: string) => {
      const fetchId = ++fetchIdRef.current;
      setLoading(true);
      setError(null);
      try {
        const result = await fetchOpenRouterModels({ q: q || undefined, apiKey, sort });
        if (fetchId !== fetchIdRef.current) return;
        setModels(result);
        setHighlightIndex(result.length > 0 ? 0 : -1);
      } catch (err: unknown) {
        if (fetchId !== fetchIdRef.current) return;
        setError(err instanceof Error ? err.message : 'Failed to load models');
        setModels([]);
        setHighlightIndex(-1);
      } finally {
        if (fetchId === fetchIdRef.current) {
          setLoading(false);
        }
      }
    },
    [apiKey, sort]
  );

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      void loadModels(fetchQuery);
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [fetchQuery, sort, loadModels]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setIsSearching(false);
        setQuery('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const matchedModel = models.find((model) => model.id === value);
  const resolvedLabel = label ?? matchedModel?.name;
  const selectedInList = models.some((model) => model.id === value);
  const showCustomBadge = value && !selectedInList && !isSearching;

  const inputValue = modelPickerDisplay({
    isSearching,
    query,
    label: resolvedLabel,
    id: value,
  });

  const exitSearch = () => {
    setIsSearching(false);
    setQuery('');
  };

  const selectModel = (model: OpenRouterModel) => {
    onChange(model.id, model.name);
    exitSearch();
    setIsOpen(false);
    setHighlightIndex(-1);
  };

  const commitCustomValue = () => {
    const trimmed = query.trim();
    if (trimmed) {
      onChange(trimmed, trimmed);
      exitSearch();
      setIsOpen(false);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setIsOpen(true);
      setHighlightIndex((prev) => (models.length === 0 ? -1 : Math.min(prev + 1, models.length - 1)));
      return;
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setHighlightIndex((prev) => (models.length === 0 ? -1 : Math.max(prev - 1, 0)));
      return;
    }
    if (event.key === 'Enter') {
      event.preventDefault();
      if (isOpen && highlightIndex >= 0 && models[highlightIndex]) {
        selectModel(models[highlightIndex]);
      } else {
        commitCustomValue();
      }
      return;
    }
    if (event.key === 'Escape') {
      setIsOpen(false);
      exitSearch();
      inputRef.current?.blur();
    }
  };

  return (
    <div className="model-picker" ref={containerRef}>
      {variant !== 'compact' && (
        <div className="flex gap-2 mb-2">
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as ModelSort)}
            className="select flex-1 rounded-lg p-2 text-xs"
            aria-label="Sort models"
          >
            <option value="most-popular">Popular</option>
            <option value="pricing-low-to-high">Cheapest</option>
            <option value="pricing-high-to-low">Most expensive</option>
          </select>
        </div>
      )}

      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          className="input w-full rounded-lg p-2.5 pr-9"
          placeholder="Search OpenRouter models..."
          value={inputValue}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => {
            setIsSearching(true);
            setQuery('');
            setIsOpen(true);
          }}
          onBlur={() => {
            if (isSearching && query.trim()) {
              commitCustomValue();
            } else {
              exitSearch();
            }
          }}
          onKeyDown={handleKeyDown}
          aria-expanded={isOpen}
          aria-autocomplete="list"
          role="combobox"
        />
        {loading && (
          <Loader2
            size={16}
            className="absolute right-3 top-1/2 -translate-y-1/2 opacity-40 animate-spin"
          />
        )}
      </div>

      {showCustomBadge && (
        <span className="inline-block mt-1.5 text-[10px] uppercase tracking-wide opacity-50">
          Custom model
        </span>
      )}

      {error && (
        <div className="mt-2 flex items-center gap-2 text-xs text-red-400">
          <span className="flex-1 truncate">{error}</span>
          <button
            type="button"
            className="flex items-center gap-1 opacity-70 hover:opacity-100"
            onClick={() => void loadModels(fetchQuery)}
          >
            <RefreshCcw size={12} />
            Retry
          </button>
        </div>
      )}

      {isOpen && !error && (
        <ul className="model-picker-list" role="listbox">
          {loading && models.length === 0 && (
            <li className="model-picker-item model-picker-item--empty">Loading models...</li>
          )}
          {!loading && models.length === 0 && (
            <li className="model-picker-item model-picker-item--empty">
              No models found. Press Enter to use &quot;{query.trim() || value}&quot; as custom ID.
            </li>
          )}
          {models.map((model, index) => {
            const ctx = formatContextLength(model.context_length);
            const price = formatPrice(model.pricing);
            const meta = [price, ctx].filter(Boolean).join(' · ');
            const isSelected = model.id === value;
            const isHighlighted = index === highlightIndex;
            return (
              <li key={model.id}>
                <button
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  className={`model-picker-item${isSelected ? ' model-picker-item--selected' : ''}${isHighlighted ? ' model-picker-item--highlighted' : ''}`}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => selectModel(model)}
                  onMouseEnter={() => setHighlightIndex(index)}
                >
                  <span className="model-picker-item-name">{model.name}</span>
                  <span className="model-picker-item-id">{model.id}</span>
                  {meta && <span className="model-picker-item-meta">{meta}</span>}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
