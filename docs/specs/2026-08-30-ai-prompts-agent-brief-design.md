# AI prompts + agent brief (paste-out)

Date: 2026-08-30  
Status: approved (brainstorm)  
Branch intent: stay on current branch unless implementation starts elsewhere

## Goal

Two isolated contracts:

1. **Paste-out.** A sentence like `zrob mi plan cwiczenia na kolano w https://vitumer.jplucinski.dev/` is enough. The model fetches the origin (and/or `/llms.txt`) and returns English Vitumer DSL plus a ready `https://vitumer.jplucinski.dev/?flow=` link.
2. **In-app.** OpenRouter still returns JSON `{ reasoning, blocks, suggestions }`. Keep Settings → Detailed AI prompts (`compact` / `verbose`). Rebuild `verbose` so it works across models (no DSL bleed, stronger schema, better few-shots).

## Out of scope

- Changing DSL syntax or the parser
- Changing in-app JSON shape, `response_format: json_object`, or OpenRouter retry/parse in `aiService`
- JSON Schema in the API request
- Backend, new endpoints, or a docs-compile pipeline
- Copy-button “agent brief” widget
- Eval harness / CI that calls live models
- Changing `SESSION_ADVICE_PROMPT` behavior

## Two contracts (do not mix)

| Surface | Source of truth | Required output |
|---|---|---|
| In-app OpenRouter | `src/constants/aiPrompts.ts` | JSON only. Loops expanded. `duration` integer seconds. |
| External model given the site URL | `public/llms.txt` (full). Short copy on `/` noscript, `/ai`, `/docs/dsl` | English DSL + production share URL. Loops allowed. |

`llms.txt` must not tell assistants to emit in-app JSON. At most one sentence: Vitumer’s built-in AI uses a different JSON format; this file is only for DSL + share links.

`/prompts` documents in-app system prompts only. One line at the top: this page is not the ChatGPT/Claude brief; that brief is `/llms.txt`.

## Paste-out fetch path

Production origin in all agent-facing docs: `https://vitumer.jplucinski.dev` (not `{ORIGIN}` / `{your-origin}`).

When a model fetches the pasted origin without executing JS:

1. **`index.html` noscript** (about 8–12 lines): one sentence what Vitumer is; the four output rules below; links to `/llms.txt`, `/docs/dsl`, `/ai`.
2. **`public/llms.txt`**: complete playbook (syntax, attributes, encoding, examples including knee mobility, output rules).
3. **`/ai` (`AIAgentsPage`)**: same contract in human prose. Examples stay DSL + URL, never “return JSON blocks”. No implication of a server API.
4. **`public/docs/dsl/index.html`**: same syntax and production origin as `llms.txt`.

Keep existing `rel=alternate` → `/llms.txt` and `robots.txt` comment.

### Output rules (paste-out)

When the user asks to create a session “in” / “on” / “at” the Vitumer origin:

1. Short English explanation of the schedule.
2. Valid Vitumer DSL. Attributes on each block, not after `N * (...)`.
3. One ready link: `https://vitumer.jplucinski.dev/?flow=` + UTF-8 base64 of the DSL, same as `btoa(unescape(encodeURIComponent(dsl)))`.
4. Labels and `{description}` in English even if the user wrote Polish. Colors: focus/work → `orange`, rest/break → `teal`, override when the task implies another. Emoji on each block.

### Syntax in the playbook (must match parser)

- Block: `{duration}{h\|m\|s} {label} {optional description} [optional attributes]`
- Sequence: `block + block + ...`
- Loop: `N * (block + block + ...)`
- Attributes: `color`, `emoji`, `skippable`, `retry`, `hold`
- Units: `h`, `m`, `s`
- Colors: `orange`, `teal`, `blue`, `purple`, `rose`, `amber`

Examples required in `llms.txt` (and mirrored on `/docs/dsl` / `/ai` where space allows): pomodoro loop, HIIT loop, hold, **knee mobility** (success case for the goal sentence). Keep one fully encoded pomodoro URL that matches the existing base64 example:

`https://vitumer.jplucinski.dev/?flow=MyAqICgyNW0gcG9tbyBbY29sb3I6b3JhbmdlXSArIDVtIGJyZWFrIFtjb2xvcjp0ZWFsXSk=`

## In-app prompts

Shared required layers for `buildBlockGenerationPrompt` / `buildBlockGenerationSystemPrompt`, in this order:

1. Output-first: return a single JSON object only. No markdown, no fences, no DSL.
2. Schema: `reasoning` (1–2 English sentences), `blocks` (array), `suggestions` (3–4 chips).
3. Each block: `duration` (positive integer seconds), `label` (short lowercase English), `color` (enum), `emoji` (required). Forbidden: `id`, `completed`, loop multipliers, shorthand.
4. Anti-bleed: “Do not emit Vitumer DSL. Expand loops into separate block objects.”
5. Short field rules + suggestion rules (concrete deltas, English chips, always include Regenerate).

**Remove** `BLOCK_DSL_MAP` from in-app system prompts.

**`compact`:** layers 1–5 only. No few-shots.

**`verbose`:** compact plus few-shots, not a second copy of the rules:

- Positive: current pomodoro example
- Positive: current HIIT example
- Positive: ritual with `{description}` and `hold` (missing today)
- Negative (exactly three): (1) markdown fence around JSON, (2) `3 * (...)` inside JSON `blocks`, (3) a DSL string instead of a `blocks` array

Refinement addendum stays: apply latest user message as a delta unless they ask for a rewrite; return full `blocks` and fresh `suggestions`; keep emoji/color on unchanged blocks.

`SESSION_ADVICE_PROMPT` unchanged.

`AI_PROMPT_DOCS` must stay in sync with the builders (including `/prompts` preview for compact/verbose).

## Runtime (unchanged)

`aiService` keeps `response_format: json_object`, color infer/normalize, suggestion normalize, fail if `reasoning` or `blocks` missing, retry on 429/5xx.

## Testing

- `npm run lint` and `npm run build`
- Unit tests on prompt builders: compact has no examples and no DSL-map; verbose includes three positives and negatives; refinement addendum only when `isRefinement` is true
- Manual: Detailed checkbox; `/prompts` banner; `/ai` has no JSON-as-output
- Fetch without JS: noscript in `index.html`, `llms.txt`, `/docs/dsl` use production origin
- Success sentence (browser or browsing model): knee plan → DSL + working `?flow=`
- Optional live: one compact + one verbose (pomodoro + ritual/hold) on two OpenRouter models if a key is available

## Files to touch (implementation)

- `index.html` — noscript brief
- `public/llms.txt` — paste-out playbook
- `src/components/AIAgentsPage.tsx` — align with playbook
- `public/docs/dsl/index.html` — production origin + same rules
- `src/constants/aiPrompts.ts` — compact/verbose rebuild, drop DSL-map
- `src/components/PromptsPage.tsx` — one-line “not the external brief”
- Prompt builder tests (new or extend existing)

Do not change `dslParser.ts` / `dslSchema.ts` unless a doc example is found invalid against the current parser (fix the example, not the parser).
