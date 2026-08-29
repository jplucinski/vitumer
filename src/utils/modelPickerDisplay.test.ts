import { describe, expect, it } from 'vitest';
import { modelPickerDisplay } from './modelPickerDisplay';

describe('modelPickerDisplay', () => {
  it('shows label when idle', () => {
    expect(
      modelPickerDisplay({
        isSearching: false,
        query: '',
        label: 'GPT-4o mini',
        id: 'openai/gpt-4o-mini',
      })
    ).toBe('GPT-4o mini');
  });

  it('falls back to id when idle without label', () => {
    expect(
      modelPickerDisplay({
        isSearching: false,
        query: '',
        id: 'custom/vendor-model',
      })
    ).toBe('custom/vendor-model');
  });

  it('shows query while searching', () => {
    expect(
      modelPickerDisplay({
        isSearching: true,
        query: 'claude',
        label: 'GPT-4o mini',
        id: 'openai/gpt-4o-mini',
      })
    ).toBe('claude');
  });

  it('shows empty query while searching before typing', () => {
    expect(
      modelPickerDisplay({
        isSearching: true,
        query: '',
        label: 'GPT-4o mini',
        id: 'openai/gpt-4o-mini',
      })
    ).toBe('');
  });
});
