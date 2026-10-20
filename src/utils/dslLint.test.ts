import { describe, expect, it } from 'vitest';
import { analyzeDSL, getLineColumn } from './dslLint';
import { DSL_REFERENCE_EXAMPLES } from '../constants/dslReference';

const messages = (dsl: string) => analyzeDSL(dsl).diagnostics.map((d) => d.message);

describe('analyzeDSL validation', () => {
  it.each(DSL_REFERENCE_EXAMPLES.map((e) => [e.title, e.dsl]))('accepts reference example %s', (_, dsl) => {
    expect(messages(dsl)).toEqual([]);
  });

  it('accepts nested and simple loops', () => {
    expect(messages('2 * (3 * (30s a + 10s b) + 1m rest)')).toEqual([]);
    expect(messages('3 * 25m pomo + 5m break')).toEqual([]);
    expect(messages('25m work\n+ 5m rest [skippable, retry:false]')).toEqual([]);
  });

  it('returns nothing for empty input', () => {
    expect(analyzeDSL('   ').diagnostics).toEqual([]);
  });

  it.each([
    ['25x work', 'Invalid duration unit'],
    ['25m[hold]', 'followed by a space'],
    ['25min review', 'Invalid duration "25min"'],
    ['work 25m', 'must start with a duration'],
    ['(25m a + 5m b)', 'need a multiplier'],
    ['3 * (25m a + 5m b', 'Missing closing ")"'],
    ['25m a)', 'Unmatched ")"'],
    ['25m a +', 'Expected a block'],
    ['25m a + + 5m b', 'Expected a block'],
    ['3 * (25m a) [color:teal]', 'after loop'],
    ['25m a [colour:teal]', 'Unknown attribute "colour"'],
    ['25m a [color:green]', 'Unknown color "green"'],
    ['25m a [hold:yes]', 'expects true or false'],
    ['25m a [emoji]', 'needs a value'],
    ['25m a [hold', 'Missing closing "]"'],
    ['25m a {deep work', 'Missing closing "}"'],
    ['25m a {a + b}', 'not allowed inside'],
    ['25m a {}', 'Empty description'],
    ['25m a [hold] [skippable]', 'Only one [attributes]'],
    ['0m a', 'greater than 0'],
    ['0 * (5m a)', 'at least 1'],
  ])('flags %s', (dsl, expected) => {
    expect(messages(dsl).join(' | ')).toContain(expected);
  });

  it('keeps diagnostic ranges inside the text', () => {
    const text = '25m a +';
    for (const d of analyzeDSL(text).diagnostics) {
      expect(d.start).toBeGreaterThanOrEqual(0);
      expect(d.end).toBeLessThanOrEqual(text.length);
      expect(d.end).toBeGreaterThan(d.start);
    }
  });
});

describe('analyzeDSL tokens', () => {
  it('classifies block parts', () => {
    const text = '2 * (25m work {Deep} [color:orange])';
    const kinds = analyzeDSL(text).tokens.map((t) => [t.kind, text.slice(t.start, t.end)]);
    expect(kinds).toEqual([
      ['multiplier', '2'],
      ['operator', '*'],
      ['paren', '('],
      ['duration', '25m'],
      ['label', 'work'],
      ['punct', '{'],
      ['description', 'Deep'],
      ['punct', '}'],
      ['punct', '['],
      ['attrKey', 'color'],
      ['punct', ':'],
      ['attrValue', 'orange'],
      ['punct', ']'],
      ['paren', ')'],
    ]);
  });
});

describe('getLineColumn', () => {
  it('maps offsets to 1-based line and column', () => {
    expect(getLineColumn('ab\ncd', 4)).toEqual({ line: 2, column: 2 });
  });
});
