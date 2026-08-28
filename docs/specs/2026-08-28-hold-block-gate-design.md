# Hold gate — next slot starts on gesture

Date: 2026-08-28  
Status: approved (brainstorm)  
Branch intent: `feat/hold-on`

## Goal

Some timed blocks may **not auto-start the next slot**. After that block’s countdown hits `0`, the session waits for tap / Space / Enter. The wait is **“start the next slot?”**, not “acknowledge this block finished.”

## Out of scope

- Dedicated `wait` block (duration 0)
- Gate before the first slot of a session
- Explicit yes/no (decline / stop from the gate)
- Changing Space-as-pause while a block is still running

## DSL / data model

New optional boolean on `FlowBlock`: `hold`.

Parse like `skippable`:

- `[hold]` → `true`
- `[hold:true]` / `[hold:false]`

`stringifyBlocks` emits `hold` when true.

`normalizeBlock` / `validateBlocks` accept optional `hold?: boolean`.

`N * (...)` copies `hold` onto each expanded instance, same as other attrs.

Last block may still carry `[hold]` in the string; **runtime treats it as a no-op** (no next slot → current completion path, including end-of-session).

Example: `25m work [hold] + 5m rest [color:teal]`

Keep in sync (same rule as any DSL change):

- `src/utils/dslParser.ts`
- `src/utils/dslSchema.ts`
- `src/constants/dslReference.ts`
- `public/llms.txt`
- `public/docs/dsl/`
- `src/constants/aiPrompts.ts` (optional JSON field `hold`, DSL map `[hold]`; only when the user asks to wait before the next slot)

## Timer engine

Phases: `running` | `awaitingNext`.

When `remainingSeconds` hits `0`:

- If current block has `hold === true` **and** there is a next block → enter `awaitingNext`. Do **not** call today’s `handleBlockCompleted`.
- Otherwise → existing completion path (including last-block “all done”).

In `awaitingNext`:

- `currentBlockIndex` unchanged
- current block still `active`, `completed: false`
- interval stopped; clock not shown (see UI)
- persist `isPaused: true` plus `awaitingNext: true`

Confirm (tap on stage except control buttons, Space, Enter, or Play in gate) = existing `handleBlockCompleted`: mark current complete, activate next, `remainingSeconds = next.duration`, start countdown (not paused).

Skip (`→` / skip control) in gate = existing `handleNext`.

Retry (`r`) in gate = restart **current** block duration and leave `awaitingNext`.

Space while `running`: still pause/play. Enter only confirms in `awaitingNext`.

Chime when entering the gate (timer reached 0), not on confirm.

## Persistence

Extend `TimerProgress` with `awaitingNext?: boolean`.

- Missing / not boolean → `false` (old snapshots stay non-gate).
- Restore: if `awaitingNext === true`, stay in gate: `remainingSeconds` 0, `isPaused` true, do not auto-complete. Ignore elapsed-time subtraction even if a snapshot has `isPaused: false`.
- Elapsed-time subtraction while unpaused applies only when not in gate.

`RestoredTimer` must carry `awaitingNext` so `FocusView` can re-enter the phase.

## UI (layout C)

In `awaitingNext`, hide the `00:00` clock and the block-progress bar for the finished slot.

Show a next-slot card in the focus stage, matching timeline language:

- color (border / badge)
- emoji
- label
- duration

Plus a short hint that tap / Space / Enter starts it.

Focus control row stays. Play in this phase confirms rather than toggling pause.

Timeline: current still the finishing block until confirm; next remains upcoming.

## Tests

- Parser round-trip: `[hold]` / `[hold:true]` / absent
- `stringifyBlocks` includes `hold` only when true
- Timer/progress: `remaining === 0` + `hold` + next → no complete; confirm advances; last block + `hold` completes session
- `parseTimerProgress` / `restoreTimerProgress`: `awaitingNext` true/false/absent; TTL unchanged

## Implementation notes

Keep the diff in `FocusView` + DSL/schema/docs + `timerProgress`. No new block type, no backend.
