# US-APP-006 Seven-Day Routine Snapshots

## Status

implemented

## Product Contract

Make the native app intentionally different from the imported reference: a
routine always contains seven training days, exercises are managed inside those
days, and each local snapshot compares current exercise performance with the
immediately previous snapshot.

## Acceptance Criteria

- New and migrated routines contain exactly seven stable, ordered days.
- A user can drill from a routine into any day and add, edit, or delete an
  exercise with name, sets, reps, and weight.
- Exercise data and snapshot history persist locally through the versioned JSON
  store; no API is introduced.
- Snapshot captures are immutable.
- After a third capture, only the newest two snapshots remain.
- Exercises sharing a case-insensitive name across days aggregate to one entry
  using the highest sets, reps, and weight.
- The first capture uses a First snapshot indicator; later captures classify
  reps and weight as Increased, Decreased, or Same against the prior capture.
- Host tests cover migration, invariants, mutations, aggregation, immutability,
  and comparison.
- A physical-device journey proves seven-day drill-down, exercise editing,
  three captures, immediate-previous comparison, and relaunch persistence.
- CI remains an unsigned generic iOS build plus host-side unit tests only.

## Validation

| Layer | Proof |
| --- | --- |
| Host domain | 17 `FitnessCore` tests pass |
| Generic iOS | `./scripts/module ci ios-xq-fitness-app` passes |
| Device E2E | XCResult reports 7 passed, 0 failed on iPhone 12 / iOS 26.5 |
