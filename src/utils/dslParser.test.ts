import { describe, expect, it } from 'vitest';
import { parseDSL } from './dslParser';

describe('parseDSL hold', () => {
  it('sets hold from a bare [hold] token', () => {
    const [block] = parseDSL('25m work [hold]');
    expect(block.hold).toBe(true);
    expect(block.label).toBe('work');
    expect(block.duration).toBe(1500);
  });

  it('sets hold from [hold:true] and [hold:false]', () => {
    expect(parseDSL('5s a [hold:true]')[0].hold).toBe(true);
    expect(parseDSL('5s a [hold:false]')[0].hold).toBe(false);
  });

  it('omits hold when the attribute is absent', () => {
    expect(parseDSL('5s a')[0].hold).toBeUndefined();
  });

  it('copies hold onto each expanded loop instance', () => {
    const blocks = parseDSL('2 * (5s a [hold] + 5s b)');
    expect(blocks).toHaveLength(4);
    expect(blocks[0].hold).toBe(true);
    expect(blocks[1].hold).toBeUndefined();
    expect(blocks[2].hold).toBe(true);
    expect(blocks[3].hold).toBeUndefined();
  });
});
