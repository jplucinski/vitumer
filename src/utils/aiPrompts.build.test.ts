import { describe, expect, it } from 'vitest';
import {
  buildBlockGenerationPrompt,
  buildBlockGenerationSystemPrompt,
} from '../constants/aiPrompts';

const REFINEMENT =
  'The user is refining a previous schedule. Apply their latest request as a delta';

describe('buildBlockGenerationPrompt', () => {
  it('compact has output-first rules and no few-shots or DSL map', () => {
    const prompt = buildBlockGenerationPrompt('compact');

    expect(prompt).toContain('Do not emit Vitumer DSL');
    expect(prompt).toContain('single JSON object');
    expect(prompt).not.toContain('JSON-to-DSL');
    expect(prompt).not.toContain('25m pomo');
    expect(prompt).not.toContain('Example for "3 study sessions');
    expect(prompt).not.toContain('Example for "HIIT 4 rounds');
    expect(prompt).not.toContain('Do not wrap JSON in markdown');
    expect(prompt).not.toContain(REFINEMENT);
  });

  it('verbose adds three positives and three negatives, still no DSL map', () => {
    const prompt = buildBlockGenerationPrompt('verbose');

    expect(prompt).toContain('Do not emit Vitumer DSL');
    expect(prompt).toContain('Example for "3 study sessions');
    expect(prompt).toContain('Example for "HIIT 4 rounds');
    expect(prompt).toContain('"hold": true');
    expect(prompt).toContain('Do not wrap JSON in markdown');
    expect(prompt).toContain('3 * (...)');
    expect(prompt).toContain('Do not return a DSL string instead of a blocks array');
    expect(prompt).not.toContain('JSON-to-DSL');
    expect(prompt).not.toContain(REFINEMENT);
  });
});

describe('buildBlockGenerationSystemPrompt', () => {
  it('appends refinement addendum only when isRefinement is true', () => {
    const base = buildBlockGenerationSystemPrompt('compact', false);
    const refined = buildBlockGenerationSystemPrompt('compact', true);

    expect(base).not.toContain(REFINEMENT);
    expect(refined.startsWith(base)).toBe(true);
    expect(refined).toContain(REFINEMENT);
  });
});
