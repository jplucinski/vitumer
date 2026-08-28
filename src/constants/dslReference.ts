export interface DslReferenceExample {
  title: string;
  dsl: string;
}

/** Syntax rules aligned with parseDSL() in dslParser.ts */
export const DSL_SYNTAX_LINES = [
  'Block: {duration}{h|m|s} {label} {optional description} [optional attributes]',
  'Sequence: block + block + ...',
  'Loop: N * (block + block + ...)',
  'Attributes go on each block inside [...]: color, emoji, skippable, retry, hold',
  'Units: h (hours), m (minutes), s (seconds)',
] as const;

/** Examples verified against parseDSL() — attributes must be on individual blocks, not after a loop. */
export const DSL_REFERENCE_EXAMPLES: DslReferenceExample[] = [
  {
    title: 'Single block',
    dsl: '25m work {Deep work} [emoji:💻, color:orange]',
  },
  {
    title: 'Loop',
    dsl: '4 * (25m work + 5m rest)',
  },
  {
    title: 'Custom rest',
    dsl: '10m break [emoji:☕, color:teal]',
  },
  {
    title: 'HIIT',
    dsl: '5 * (30s work + 15s rest)',
  },
  {
    title: 'Aeropress',
    dsl: '3 * (1m prep [emoji:☕] + 4m brew + 2m rest [color:teal])',
  },
  {
    title: 'Pomodoro',
    dsl: '3 * (25m pomo [color:orange] + 5m break [color:teal])',
  },
  {
    title: 'Hold before next',
    dsl: '25m work [hold] + 5m rest [color:teal]',
  },
];

export const DSL_EDITOR_PLACEHOLDER =
  'Write DSL directly, e.g. 3 * (25m work [emoji:💻] + 5m rest [emoji:☕])';
