# Hold-gate Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** After a block with `[hold]`, do not auto-start the next slot; wait for tap / Space / Enter, with a next-slot card (layout C).

**Architecture:** Keep `hold` as an optional boolean on `FlowBlock` (same pattern as `skippable`). Pure functions in `timerProgress.ts` decide gate vs complete and restore `awaitingNext`. `FocusView` owns the `awaitingNext` React phase, persistence, keys, chime-on-zero, and the next-slot card. No new block type, no backend.

**Tech Stack:** React 19, TypeScript, Vitest (`npm test` / `npx vitest run <file>`), Vite 8 SPA. No React Testing Library — engine logic is unit-tested; UI is verified in the browser.

## Global Constraints

- Spec: `docs/specs/2026-08-28-hold-block-gate-design.md`
- DSL syntax changes must update all of: `dslParser.ts`, `dslSchema.ts`, `dslReference.ts`, `public/llms.txt`, `public/docs/dsl/`, `aiPrompts.ts`
- No dedicated `wait` block; no gate before the first slot; no yes/no decline; Space while `running` stays pause/play
- Last block with `hold` is a parser no-op at runtime (complete session as today)
- Confirm starts the next countdown **unpaused** (`setIsPaused(false)` after `handleBlockCompleted` when a next block exists)
- Node `>=20`; do not add dependencies
- Keep diffs in FocusView + DSL/schema/docs + `timerProgress`

## File map

| File | Role |
|------|------|
| `src/utils/dslParser.ts` | `FlowBlock.hold?`; parse `[hold]` / `[hold:true\|false]` |
| `src/utils/dslSchema.ts` | normalize / validate / stringify `hold` |
| `src/utils/dslParser.test.ts` | **Create** — parse + loop copy |
| `src/utils/dslSchema.test.ts` | **Create** — stringify / normalize / validate |
| `src/constants/dslReference.ts` | Syntax line + one example |
| `src/constants/aiPrompts.ts` | Optional JSON `hold` → `[hold]` |
| `public/llms.txt` | Attribute list |
| `public/docs/dsl/index.html` | Attribute list + example |
| `src/utils/timerProgress.ts` | `awaitingNext` on progress/restore; `resolveTimerZeroAction` |
| `src/utils/timerProgress.test.ts` | Restore/parse + zero-action tests |
| `src/components/FocusView.tsx` | Phase, persist, keys, chime, layout C |

`useAISessionThread` spreads AI blocks onto `FlowBlock`; `hold` from JSON is kept. Do not add a parallel normalizer.

---

### Task 1: DSL `hold` flag

**Files:**
- Create: `src/utils/dslParser.test.ts`
- Create: `src/utils/dslSchema.test.ts`
- Modify: `src/utils/dslParser.ts` (`FlowBlock` + attr loop ~102–139)
- Modify: `src/utils/dslSchema.ts` (`normalizeBlock`, `validateBlocks`, `stringifyBlocks`)
- Modify: `src/constants/dslReference.ts`
- Modify: `src/constants/aiPrompts.ts` (`BLOCK_OUTPUT_SCHEMA`, `BLOCK_FIELD_RULES`, `BLOCK_DSL_MAP`)
- Modify: `public/llms.txt`
- Modify: `public/docs/dsl/index.html`

**Interfaces:**
- Consumes: existing `parseDSL`, `normalizeBlock`, `stringifyBlocks`, `validateBlocks`
- Produces: `FlowBlock.hold?: boolean` — `true` when `[hold]` or `[hold:true]`; `false` when `[hold:false]`; omitted when absent. `stringifyBlocks` emits `hold` only when `hold === true`.

- [ ] **Step 1: Write the failing parser tests**

Create `src/utils/dslParser.test.ts`:

```ts
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
```

- [ ] **Step 2: Run parser tests — expect FAIL**

Run: `npx vitest run src/utils/dslParser.test.ts`

Expected: FAIL (`hold` undefined / property missing).

- [ ] **Step 3: Write the failing schema tests**

Create `src/utils/dslSchema.test.ts`:

```ts
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
```

- [ ] **Step 4: Run schema tests — expect FAIL**

Run: `npx vitest run src/utils/dslSchema.test.ts`

Expected: FAIL (stringify has no `hold`; validate may still pass until `hold: 'yes'` is checked — after parser exists, stringify still fails).

- [ ] **Step 5: Implement parser**

In `src/utils/dslParser.ts`, add `hold?: boolean` to `FlowBlock`.

In the attribute loop, next to `skippable` / `retryable`:

```ts
let hold: boolean | undefined;
// inside key:val:
else if (key === 'hold') hold = val === 'true';
// inside bare token:
else if (attr === 'hold') hold = true;
```

Pass `hold` into `blocks.push({ ... })`.

- [ ] **Step 6: Implement schema**

`normalizeBlock`: `hold: typeof block.hold === 'boolean' ? block.hold : undefined`

`validateBlocks`: `if (block.hold !== undefined && typeof block.hold !== 'boolean') return false;`

`stringifyBlocks`: `if (block.hold) attrs.push('hold');`

- [ ] **Step 7: Run both test files — expect PASS**

Run: `npx vitest run src/utils/dslParser.test.ts src/utils/dslSchema.test.ts`

Expected: PASS

- [ ] **Step 8: Sync DSL docs and AI prompts**

`src/constants/dslReference.ts` — `DSL_SYNTAX_LINES` attributes list includes `hold`. Add example:

```ts
{
  title: 'Hold before next',
  dsl: '25m work [hold] + 5m rest [color:teal]',
},
```

`src/constants/aiPrompts.ts`:

- Optional fields: `- "hold": boolean (only when the next slot must wait for tap/Space/Enter after this block)`
- Field rules: `- hold: only when the user asks to wait / confirm before the next slot.`
- DSL map: `- hold → [hold]`

`public/llms.txt` — attributes line: `color, emoji, skippable, retry, hold` and the optional-fields sentence includes `[hold]`.

`public/docs/dsl/index.html` — attributes `<li>` includes `hold`. Add example block:

```html
<div class="example">
  <div class="example-title">Hold before next</div>
  <pre>25m work [hold] + 5m rest [color:teal]</pre>
</div>
```

- [ ] **Step 9: Commit**

```bash
git add src/utils/dslParser.ts src/utils/dslParser.test.ts src/utils/dslSchema.ts src/utils/dslSchema.test.ts src/constants/dslReference.ts src/constants/aiPrompts.ts public/llms.txt public/docs/dsl/index.html
git commit -m "feat: parse [hold] so the next slot can wait for a gesture"
```

---

### Task 2: Persist and restore `awaitingNext`

**Files:**
- Modify: `src/utils/timerProgress.ts`
- Modify: `src/utils/timerProgress.test.ts`

**Interfaces:**
- Consumes: existing `parseTimerProgress`, `restoreTimerProgress`
- Produces:

```ts
export type TimerProgress = {
  activeBlockId: string | number;
  remainingSeconds: number;
  lastTimestamp: number;
  isPaused: boolean;
  awaitingNext?: boolean;
};

export type RestoredTimer = {
  blockIndex: number;
  remainingSeconds: number;
  isPaused: boolean;
  awaitingNext: boolean;
};

export function parseTimerProgress(raw: string | null): TimerProgress | null
export function restoreTimerProgress(
  blocks: Array<{ id: string | number }>,
  raw: string | null,
  now: number,
  ttlMs?: number
): RestoredTimer | null
```

`parseTimerProgress`: if `awaitingNext` is not `true`, store `awaitingNext: false` (missing, `false`, or wrong type → false). Do not reject the snapshot.

`restoreTimerProgress`: always set `awaitingNext` on the result. If `progress.awaitingNext === true`: `remainingSeconds = 0`, `isPaused = true`, **do not** subtract elapsed (even if `isPaused` in JSON is `false`). TTL and unknown id unchanged.

- [ ] **Step 1: Write the failing tests**

Update every existing `toEqual` on `restoreTimerProgress` to include `awaitingNext: false`.

Add:

```ts
import { parseTimerProgress, restoreTimerProgress, TIMER_PROGRESS_TTL_MS } from './timerProgress';

it('treats missing awaitingNext as false', () => {
  expect(restoreTimerProgress(blocks, JSON.stringify(paused), 1_000_000)).toEqual({
    blockIndex: 1,
    remainingSeconds: 215,
    isPaused: true,
    awaitingNext: false,
  });
});

it('restores a hold gate without subtracting elapsed', () => {
  const gated = {
    activeBlockId: '1',
    remainingSeconds: 0,
    lastTimestamp: 1_000_000,
    isPaused: false,
    awaitingNext: true,
  };
  expect(restoreTimerProgress(blocks, JSON.stringify(gated), 1_000_000 + 30_000)).toEqual({
    blockIndex: 0,
    remainingSeconds: 0,
    isPaused: true,
    awaitingNext: true,
  });
});

describe('parseTimerProgress awaitingNext', () => {
  it('coerces non-boolean awaitingNext to false', () => {
    const parsed = parseTimerProgress(
      JSON.stringify({
        activeBlockId: '1',
        remainingSeconds: 10,
        lastTimestamp: 1,
        isPaused: true,
        awaitingNext: 'yes',
      })
    );
    expect(parsed?.awaitingNext).toBe(false);
  });
});
```

(Merge the first `it` with the existing paused test instead of duplicating — one paused assertion with `awaitingNext: false`.)

- [ ] **Step 2: Run tests — expect FAIL**

Run: `npx vitest run src/utils/timerProgress.test.ts`

Expected: FAIL (`awaitingNext` missing; elapsed still subtracted for gated snapshot).

- [ ] **Step 3: Implement**

In `parseTimerProgress`, after validating required fields:

```ts
const awaitingNext = parsed.awaitingNext === true;
return { activeBlockId, remainingSeconds, lastTimestamp, isPaused, awaitingNext };
```

In `restoreTimerProgress`:

```ts
if (progress.awaitingNext) {
  return {
    blockIndex,
    remainingSeconds: 0,
    isPaused: true,
    awaitingNext: true,
  };
}

let remainingSeconds = progress.remainingSeconds;
if (!progress.isPaused) {
  const elapsed = Math.floor((now - progress.lastTimestamp) / 1000);
  remainingSeconds = Math.max(0, progress.remainingSeconds - elapsed);
}

return {
  blockIndex,
  remainingSeconds,
  isPaused: progress.isPaused,
  awaitingNext: false,
};
```

Keep the TTL / unknown-id checks **before** this return.

- [ ] **Step 4: Run tests — expect PASS**

Run: `npx vitest run src/utils/timerProgress.test.ts`

Expected: PASS (including existing running/TTL cases with `awaitingNext: false`).

- [ ] **Step 5: Commit**

```bash
git add src/utils/timerProgress.ts src/utils/timerProgress.test.ts
git commit -m "feat: restore hold-gate timer snapshots without auto-advance"
```

---

### Task 3: `resolveTimerZeroAction`

**Files:**
- Modify: `src/utils/timerProgress.ts` (same module as Task 2 — timer policy lives with progress)
- Modify: `src/utils/timerProgress.test.ts`

**Interfaces:**
- Consumes: `FlowBlock.hold` from Task 1
- Produces:

```ts
export type TimerZeroAction = 'complete' | 'awaitNext';

export function resolveTimerZeroAction(
  block: { hold?: boolean } | undefined,
  hasNextBlock: boolean
): TimerZeroAction
```

Returns `'awaitNext'` only when `block?.hold === true` **and** `hasNextBlock`. Otherwise `'complete'` (includes last block with `hold`, missing block, `hold: false`).

- [ ] **Step 1: Write the failing tests**

Append to `src/utils/timerProgress.test.ts`:

```ts
import { resolveTimerZeroAction } from './timerProgress';

describe('resolveTimerZeroAction', () => {
  it('awaits next when hold and a successor exist', () => {
    expect(resolveTimerZeroAction({ hold: true }, true)).toBe('awaitNext');
  });

  it('completes the last block even with hold', () => {
    expect(resolveTimerZeroAction({ hold: true }, false)).toBe('complete');
  });

  it('completes when hold is absent or false', () => {
    expect(resolveTimerZeroAction({}, true)).toBe('complete');
    expect(resolveTimerZeroAction({ hold: false }, true)).toBe('complete');
    expect(resolveTimerZeroAction(undefined, true)).toBe('complete');
  });
});
```

- [ ] **Step 2: Run tests — expect FAIL**

Run: `npx vitest run src/utils/timerProgress.test.ts -t resolveTimerZeroAction`

Expected: FAIL (`resolveTimerZeroAction` is not exported).

- [ ] **Step 3: Implement**

```ts
export type TimerZeroAction = 'complete' | 'awaitNext';

export function resolveTimerZeroAction(
  block: { hold?: boolean } | undefined,
  hasNextBlock: boolean
): TimerZeroAction {
  if (block?.hold === true && hasNextBlock) return 'awaitNext';
  return 'complete';
}
```

- [ ] **Step 4: Run tests — expect PASS**

Run: `npx vitest run src/utils/timerProgress.test.ts`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/utils/timerProgress.ts src/utils/timerProgress.test.ts
git commit -m "feat: decide hold-gate vs auto-complete when a block hits zero"
```

---

### Task 4: FocusView gate engine + layout C

**Files:**
- Modify: `src/components/FocusView.tsx`

**Interfaces:**
- Consumes: `resolveTimerZeroAction`, `RestoredTimer.awaitingNext`, `TimerProgress.awaitingNext`, `FlowBlock.hold`
- Produces: UI phase `awaitingNext`; persist field `awaitingNext`; confirm = existing complete path + unpause if a next block exists

There is no RTL in this repo. After the steps below, run `npm test` and `npm run lint`, then verify in the browser (checklist at the end of this task).

- [ ] **Step 1: Restore `awaitingNext` and persist it**

Import `resolveTimerZeroAction`.

Add state (same restore pattern as `isPaused`):

```ts
const [awaitingNext, setAwaitingNext] = useState(() => {
  const restoredInit = restoreTimerProgress(
    blocks,
    localStorage.getItem(STORAGE_KEYS.timerProgress),
    Date.now()
  );
  return restoredInit?.awaitingNext ?? false;
});
```

In the persist `useEffect`, include `awaitingNext` on `TimerProgress` and add `awaitingNext` to the dependency array.

On `handleStop` and `resetSession`, `setAwaitingNext(false)`.

- [ ] **Step 2: Timer zero → gate or complete; chime once**

Remove `playChime()` from the start of `handleBlockCompleted`.

When the interval sees `remaining === 0`:

```ts
playChime();
const hasNext = currentBlockIndex < blocks.length - 1;
if (resolveTimerZeroAction(blocks[currentBlockIndex], hasNext) === 'awaitNext') {
  setAwaitingNext(true);
  setIsPaused(true);
  setRemainingSeconds(0);
} else {
  handleBlockCompleted();
}
```

At the start of `handleBlockCompleted` and `handleNext`, `setAwaitingNext(false)`.

After advancing to a next block inside `handleBlockCompleted` (the `if (currentBlockIndex < blocks.length - 1)` branch), `setIsPaused(false)` so the next slot actually runs.

`retryBlock`:

```ts
setAwaitingNext(false);
if (activeBlock) setRemainingSeconds(activeBlock.duration);
```

Interval already no-ops when `isPaused`; gate is always paused.

- [ ] **Step 3: Keys and Play**

In `handleKeyDown`:

- If `awaitingNext` and (`e.code === 'Space'` or `e.key === 'Enter'`): `preventDefault`, call `handleBlockCompleted`, return.
- Else if `e.code === 'Space'`: existing pause toggle.
- Enter does nothing while `running`.
- `r` / arrows / Escape unchanged (`r` uses updated `retryBlock`).

Play button:

```ts
onClick={() => {
  if (awaitingNext) {
    handleBlockCompleted();
    return;
  }
  setIsPaused((p) => !p);
}}
aria-label={awaitingNext ? 'Start next slot' : isPaused ? 'Play' : 'Pause'}
```

Keep showing Play (not Pause) while `awaitingNext`.

Add `awaitingNext` to the keydown effect deps.

- [ ] **Step 4: Layout C + tap on stage**

`const nextBlock = blocks[currentBlockIndex + 1];`

On `focus-split-stage`:

```ts
onClick={() => {
  if (awaitingNext) handleBlockCompleted();
}}
```

When `awaitingNext && nextBlock`:

- Hide the timer `div.focus-timer` and the immersive progress bar.
- Hide or keep the current-block badge — spec is next-card as hero; **hide** the finished-block badge and description while gated.
- Show:

```tsx
<div className="flex flex-col items-center gap-3 px-4 max-w-md w-full">
  <p className="text-[10px] uppercase tracking-[0.2em] opacity-50 font-mono">
    Tap · Space · Enter
  </p>
  <div
    className={clsx(
      'w-full rounded-2xl border px-4 py-5 flex flex-col items-center gap-2 text-center',
      getColorBorderClass(nextBlock.color),
      getColorBadgeClasses(nextBlock.color)
    )}
  >
    {nextBlock.emoji && <span className="text-3xl">{nextBlock.emoji}</span>}
    <div className="font-mono font-bold">{nextBlock.label}</div>
    <div className="text-xs opacity-70 font-mono">{formatTime(nextBlock.duration)}</div>
  </div>
</div>
```

(`formatTime` already exists in this file.)

Leave the control row and timeline as they are: current block still active/uncompleted; next still in upcoming.

Chip text can stay `done` counts; optional: do not add a second prompt.

- [ ] **Step 5: Automated verification**

Run: `npm test`

Expected: all existing + new tests PASS.

Run: `npm run lint`

Expected: no new errors in touched files.

- [ ] **Step 6: Browser verification**

`npm run dev`. Load `25m` is slow — use `8s work [hold] + 5s rest [emoji:☕, color:teal]`.

Checklist:

1. Without `[hold]`, blocks still auto-advance at 0 and chime once.
2. With `[hold]`, at 0: chime, no auto-advance, clock gone, next card (emoji/color/label/time), timeline still on `work`.
3. Space / Enter / tap on stage / Play → `rest` starts counting (not paused).
4. Last block `5s end [hold]` → session completes (alert) with no extra gate.
5. In gate, `r` restarts `work` with full duration and leaves the gate.
6. Skip in gate completes `work` and starts `rest`.
7. Space during a running (non-gate) block still pauses.
8. Reload in gate restores the gate (not auto-complete). Reload mid-run still restores remaining time.
9. Landscape / stacked Focus still shows the card and controls.

- [ ] **Step 7: Commit**

```bash
git add src/components/FocusView.tsx
git commit -m "feat: wait for a gesture before starting the next hold slot"
```

---

## Self-review (spec coverage)

| Spec | Task |
|------|------|
| `[hold]` parse/stringify/normalize/validate, loop copy | 1 |
| dslReference, llms.txt, docs/dsl, aiPrompts | 1 |
| Last-block `hold` no-op | 3 (`hasNextBlock: false`) + 4 |
| Zero + hold + next → `awaitingNext`, no complete | 3 + 4 |
| Confirm = complete + start next unpaused | 4 |
| Skip / retry / Space-running / Enter-gate | 4 |
| Chime on zero, not on confirm | 4 |
| Persist/restore `awaitingNext`, TTL, absent = false | 2 |
| Layout C card | 4 |
| No wait-block / no first-slot gate / no yes-no | out of scope, not tasked |
