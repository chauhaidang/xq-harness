# iOS XQ Fitness Test Coverage Matrix

## Purpose

Coverage is tracked as **product component × capability**. Every applicable
cell must identify its owner as a host unit test, a physical-device UI test,
both, or an explicit gap. Line coverage is secondary to this behavior map.

Legend:

- **U** — covered through the public `FitnessStore`/persistence interface by a
  host-side unit test.
- **UI** — covered as visible behavior by a physical-device XCUITest.
- **U+UI** — both domain correctness and user-visible behavior are covered.
- **GAP** — applicable behavior is implemented without the named layer, or the
  product capability is not implemented yet.
- **N/A** — capability does not apply to that component.

## Component × Capability Matrix

| Component | Create/Input | Read/Navigate | Update | Delete/Reset | Validate/Invariants | Persist/Recover | Compare/Report |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Routine | U+UI | UI | GAP: rename absent | GAP: delete absent | U+UI | U+UI | N/A |
| Seven-day week | U | UI | GAP: custom labels absent | N/A: fixed seven days | U | U | N/A |
| Training day | U | UI | GAP: rename absent | N/A: fixed membership | U | U | N/A |
| Exercise | U+UI | UI | U+UI | U+UI | U | U+UI | U+UI |
| Snapshot capture | U+UI | UI | N/A: immutable | U: bounded retention | U | U+UI | U+UI |
| Snapshot retention | U | UI: latest report only | N/A | U | U | U+UI | U+UI |
| JSON persistence | U | U | U | U | U | U | N/A |
| UI-test storage isolation | UI | N/A | N/A | U+UI | U | U+UI | N/A |
| Router and sheets | N/A | UI | N/A | N/A | UI | UI: relaunch | UI |

## Current Evidence

### Host unit tests

- Routine creation, trimming, optional notes, and rejected blank names.
- Exactly seven stable ordered days for new routines and schema-v1 migration.
- Exercise add, update, delete, metric validation, and failed-save rollback.
- Immutable snapshot capture, duplicate-name aggregation, and all progress
  classifications.
- Three-capture retention: after A/B/C, only B/C remain and the report pairs C
  with B.
- Atomic JSON round-trip, recovery, future-schema refusal, and isolated UI-test
  reset.

### Physical-device UI tests

- Empty state, routine editor validation/cancel, routine creation with and
  without notes, multiple routines, workspace navigation, relaunch persistence,
  and isolated reset.
- All seven workspace rows exist with exact Day 1 through Day 7 labels, followed
  by exercise creation/editing.
- Exercise editor shows and asserts the exact persistent labels Exercise name,
  Sets, Repetitions, and Weight (kg), including matching field accessibility
  labels before data entry.
- Exercise swipe deletion and the resulting empty training-day state.
- Snapshot A at 10 reps shows First snapshot.
- Snapshot B at 20 reps shows Increased.
- Snapshot C at 15 reps shows Decreased, proving comparison with B rather than
  A; relaunching and opening Latest Comparison still shows Decreased.

## Ownership Rules

1. Domain invariants, retention counts, migration, and failure atomicity belong
   to **U** because they are exact store-interface contracts.
2. Navigation, controls, visible indicators, and relaunch journeys belong to
   **UI** because they are user-observable behavior.
3. Critical paths use **U+UI** when domain correctness and presentation can fail
   independently.
4. Do not expose test-only product UI merely to turn an internal invariant into
   a UI assertion. Exact snapshot deletion remains unit-owned; the UI owns the
   visible latest-comparison behavior.
5. Every new story updates this matrix and either closes or explicitly records
   affected gaps.
6. Every physical-device test inherits `FitnessUITestCase`; shared setup resets
   the isolated store and requires the empty routine state before the test body.
   Only explicit relaunch helpers may preserve data within one journey.
