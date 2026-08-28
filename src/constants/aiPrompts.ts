import { STORAGE_KEYS } from './storageKeys';

export type PromptMode = 'compact' | 'verbose';

export function loadPromptMode(): PromptMode {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.aiPromptMode);
    return raw === 'verbose' ? 'verbose' : 'compact';
  } catch {
    return 'compact';
  }
}

export function savePromptMode(mode: PromptMode): void {
  try {
    localStorage.setItem(STORAGE_KEYS.aiPromptMode, mode);
  } catch {
    // ignore storage errors
  }
}

const BLOCK_ROLE =
  "You are a productivity and time-planning expert. Transform the user's request into a structured schedule of time blocks.";

const BLOCK_OUTPUT_SCHEMA = `Always return a single JSON object with exactly these fields:
- "reasoning": 1-2 sentences in English explaining why you chose this schedule.
- "blocks": array of time block objects in execution order.
- "suggestions": array of 3-4 follow-up refinement chips tailored to THIS schedule.

Each block in "blocks" must include:
- "duration": duration in seconds (positive integer)
- "label": short lowercase block name (e.g. pomo, break, work, warmup)
- "color": one of orange, teal, blue, purple, rose, amber
- "emoji": single emoji matching the task (required on every block)

Optional fields per block:
- "description": block description (only when the user request implies activity detail)
- "skippable": boolean (only when skip makes sense)
- "retryable": boolean (only when retry makes sense)
- "hold": boolean (only when the next slot must wait for tap/Space/Enter after this block)

Each item in "suggestions" must include:
- "label": short chip label (2-4 words, max ~22 chars)
- "text": full natural-language refinement request for the next message

Forbidden in output: "id", "completed", loop multipliers, shorthand. Expand loops fully. Integer seconds only (25 min = 1500).`;

const BLOCK_FIELD_RULES = `Field rules:
- emoji: required on every block. Context-appropriate (📚 study, ⚡ HIIT, ☕ break/coffee).
- color: required. Rest/break labels → teal. Focus/work → orange. Override when task implies (meditation → purple).
- label: short, lowercase, DSL-friendly: pomo, break, work, rest, warmup, cooldown.
- description: include only when user request implies activity detail; omit for generic HIIT/pomodoro.
- skippable/retryable: only when user mentions skip/retry or block type warrants it.
- hold: only when the user asks to wait / confirm before the next slot.`;

const BLOCK_SUGGESTION_RULES = `Suggestion rules:
- Exactly 3-4 chips, English only, no duplicates.
- Each chip must reference this schedule's concrete values (durations, labels, block count) — not generic.
- Cover at least 2 delta types: timing, structure, intensity/volume, add/remove blocks.
- Prefer concrete wording in "text" (e.g. "Make breaks 10 minutes" not "Make breaks longer").
- Always include: {"label": "Regenerate", "text": "Regenerate with a fresh take on the same request"}
- Never use vague chips like "Add more blocks", "Make it better", "Change colors" without specifics.`;

const BLOCK_DSL_MAP = `JSON-to-DSL mapping (for your reference when choosing fields):
- duration+label → 25m pomo
- color → [color:orange]
- emoji → [emoji:📚]
- description → {Deep reading}
- skippable → [skippable]
- retryable → [retry]
- hold → [hold]
Return fully expanded blocks, never loop shorthand like 3 * (...).`;

const BLOCK_EXAMPLES = `Example for "3 study sessions of 25 min with 5 min breaks":
{
  "reasoning": "Three Pomodoro cycles with short breaks between focus blocks.",
  "blocks": [
    {"duration": 1500, "label": "pomo", "color": "orange", "emoji": "📚"},
    {"duration": 300, "label": "break", "color": "teal", "emoji": "☕"},
    {"duration": 1500, "label": "pomo", "color": "orange", "emoji": "📚"},
    {"duration": 300, "label": "break", "color": "teal", "emoji": "☕"},
    {"duration": 1500, "label": "pomo", "color": "orange", "emoji": "📚"},
    {"duration": 300, "label": "break", "color": "teal", "emoji": "☕"}
  ],
  "suggestions": [
    {"label": "10 min breaks", "text": "Make every break 10 minutes instead of 5"},
    {"label": "Add warmup", "text": "Add a 5 minute warmup block at the start"},
    {"label": "Drop last pomo", "text": "Remove the third pomodoro and its break"},
    {"label": "Regenerate", "text": "Regenerate with a fresh take on the same request"}
  ]
}

Example for "HIIT 4 rounds: 40s work and 20s rest":
{
  "reasoning": "Four HIIT rounds alternating short work and rest intervals.",
  "blocks": [
    {"duration": 40, "label": "work", "color": "orange", "emoji": "⚡"},
    {"duration": 20, "label": "rest", "color": "teal", "emoji": "💧"},
    {"duration": 40, "label": "work", "color": "orange", "emoji": "⚡"},
    {"duration": 20, "label": "rest", "color": "teal", "emoji": "💧"},
    {"duration": 40, "label": "work", "color": "orange", "emoji": "⚡"},
    {"duration": 20, "label": "rest", "color": "teal", "emoji": "💧"},
    {"duration": 40, "label": "work", "color": "orange", "emoji": "⚡"},
    {"duration": 20, "label": "rest", "color": "teal", "emoji": "💧"}
  ],
  "suggestions": [
    {"label": "30s work", "text": "Change work intervals to 30 seconds"},
    {"label": "Add cooldown", "text": "Add a 2 minute cooldown stretch at the end"},
    {"label": "6 rounds", "text": "Expand to 6 rounds of 40s work and 20s rest"},
    {"label": "Regenerate", "text": "Regenerate with a fresh take on the same request"}
  ]
}`;

const BLOCK_REFINEMENT_ADDENDUM =
  'The user is refining a previous schedule. Apply their latest request as a delta to the prior blocks unless they ask for a full rewrite. Always return the complete updated blocks array and a fresh "suggestions" array tailored to the new schedule. Preserve emoji and color on unchanged blocks unless the user asks to change them.';

export function buildBlockGenerationPrompt(mode: PromptMode): string {
  const layers = [
    BLOCK_ROLE,
    BLOCK_OUTPUT_SCHEMA,
    BLOCK_FIELD_RULES,
    BLOCK_SUGGESTION_RULES,
    BLOCK_DSL_MAP,
  ];
  if (mode === 'verbose') {
    layers.push(BLOCK_EXAMPLES);
  }
  return layers.join('\n\n');
}

export function buildBlockGenerationSystemPrompt(
  mode: PromptMode,
  isRefinement: boolean
): string {
  const base = buildBlockGenerationPrompt(mode);
  return isRefinement ? `${base}\n\n${BLOCK_REFINEMENT_ADDENDUM}` : base;
}

export const SESSION_ADVICE_PROMPT = `You are a productivity coach analyzing a timed block session.

Given the block list (label, duration, color, optional description), write ONE tip in max 2 sentences, English, starting with a relevant emoji.

Focus on:
- Break-to-work ratio (flag if breaks are too short/long vs focus blocks)
- Pacing (longest uninterrupted stretch, fatigue risk)
- Structure praise when well-balanced (Pomodoro, HIIT alternation, ritual flow)
- One concrete tweak if something looks off

Do not restate the schedule. Do not suggest apps or tools. Plain text only.`;

export const SESSION_ADVICE_USER_TEMPLATE = 'Here is my session today:\n{block summary}';

export interface AIPromptDoc {
  id: string;
  title: string;
  purpose: string;
  modelSetting: string;
  responseFormat: string;
  userTemplate: string;
  exampleUser: string;
  exampleResponse?: string;
  promptModes?: PromptMode[];
  getSystemPrompt: (mode: PromptMode) => string;
}

export const AI_PROMPT_DOCS: AIPromptDoc[] = [
  {
    id: 'block-generation',
    title: 'Block Generation',
    purpose:
      'Converts a natural-language session request into a structured list of timed blocks (Pomodoro, HIIT, Aeropress rituals, etc.).',
    modelSetting: 'Settings → Default Model ID (OpenRouter)',
    responseFormat:
      'JSON object with "reasoning" (string), "blocks" (array of block objects with duration in seconds), and "suggestions" (3-4 contextual refinement chips with label + text). Sent via response_format: json_object.',
    userTemplate: '{natural language session request}',
    exampleUser: '3 study sessions of 25 min with 5 min breaks',
    exampleResponse: `{
  "reasoning": "Three Pomodoro cycles with short breaks between focus blocks.",
  "blocks": [
    {"duration": 1500, "label": "pomo", "color": "orange", "emoji": "📚"},
    {"duration": 300, "label": "break", "color": "teal", "emoji": "☕"},
    {"duration": 1500, "label": "pomo", "color": "orange", "emoji": "📚"},
    {"duration": 300, "label": "break", "color": "teal", "emoji": "☕"},
    {"duration": 1500, "label": "pomo", "color": "orange", "emoji": "📚"},
    {"duration": 300, "label": "break", "color": "teal", "emoji": "☕"}
  ],
  "suggestions": [
    {"label": "10 min breaks", "text": "Make every break 10 minutes instead of 5"},
    {"label": "Add warmup", "text": "Add a 5 minute warmup block at the start"},
    {"label": "Drop last pomo", "text": "Remove the third pomodoro and its break"},
    {"label": "Regenerate", "text": "Regenerate with a fresh take on the same request"}
  ]
}`,
    promptModes: ['compact', 'verbose'],
    getSystemPrompt: (mode) => buildBlockGenerationPrompt(mode),
  },
  {
    id: 'block-generation-refinement',
    title: 'Block Generation (Refinement)',
    purpose:
      'Multi-turn refinement of a session schedule. Each follow-up message includes full conversation history; the model applies deltas to the prior blocks unless the user asks for a full rewrite.',
    modelSetting: 'Settings → Default Model ID (OpenRouter)',
    responseFormat:
      'Same JSON as Block Generation (including fresh suggestions). Assistant turns in history are serialized as JSON { reasoning, blocks, suggestions }. Refinement addendum appended to system prompt when prior blocks exist.',
    userTemplate: 'Turn 1: {initial request}\nTurn 2+: {refinement request, e.g. longer breaks, add warmup}',
    exampleUser: 'Turn 1: 3 study sessions of 25 min with 5 min breaks\nTurn 2: Make breaks 10 minutes instead',
    exampleResponse:
      'Turn 2 response — same shape, updated blocks with 600s breaks, plus new contextual suggestions.',
    promptModes: ['compact', 'verbose'],
    getSystemPrompt: (mode) => buildBlockGenerationSystemPrompt(mode, true),
  },
  {
    id: 'session-advice',
    title: 'Session Advice',
    purpose:
      'Analyzes the current session structure and returns a short motivational productivity tip based on block order, durations, and labels.',
    modelSetting: 'Settings → Default Model ID (OpenRouter)',
    responseFormat: 'Plain text (max 2 sentences). No structured output.',
    userTemplate: SESSION_ADVICE_USER_TEMPLATE,
    exampleUser:
      '1. pomo (25 min, orange): Warmup, emails\n2. break (5 min, teal): Step away, water\n3. pomo (25 min, orange): Main work',
    exampleResponse:
      '☕ Your third focus block is the longest stretch — consider a slightly longer break before it so you finish strong.',
    getSystemPrompt: () => SESSION_ADVICE_PROMPT,
  },
];
