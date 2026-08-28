import { describe, expect, it } from 'vitest';
import { normalizeBlock, stringifyBlocks, validateBlocks } from './dslSchema';
import { parseDSL } from './dslParser';

describe('stringifyBlocks hold', () => {
  it('emits hold only when true', () => {
    const [held] = parseDSL('5s a [hold]');
    const [plain] = parseDSL('5s a');
    expect(stringifyBlocks([held])).toContain('hold');
    expect(stringifyBlocks([plain])).not.toContain('hold');
  });

  it('round-trips hold through parseDSL', () => {
    const dsl = stringifyBlocks(parseDSL('25m work [hold] + 5m rest'));
    const again = parseDSL(dsl);
    expect(again[0].hold).toBe(true);
    expect(again[1].hold).toBeUndefined();
  });
});

describe('normalizeBlock / validateBlocks hold', () => {
  it('passes through boolean hold', () => {
    const block = normalizeBlock({
      id: 'x',
      duration: 5,
      label: 'a',
      color: 'orange',
      completed: false,
      hold: true,
    });
    expect(block.hold).toBe(true);
    expect(validateBlocks([{ ...block, hold: true }])).toBe(true);
    expect(validateBlocks([{ ...block, hold: 'yes' }])).toBe(false);
  });
});
