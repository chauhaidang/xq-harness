# iOS XQ Fitness App

## Product Surface

`ios-xq-fitness-app` is the native, offline-first replacement for the Expo
fitness reference app.

## Current Contract

- The app is SwiftUI and targets iPhone on iOS 17 or newer.
- First launch contains no seeded routines.
- The empty routines screen explains the local-only behavior and presents a
  labeled **Create Routine** action.
- After the first routine exists, a toolbar add button creates another routine.
- The New Routine sheet accepts a required name and optional notes.
- Routine creation is persisted before the new state is published to the UI.
- Data is stored as a versioned JSON snapshot in Application Support with a
  local recovery copy and a separate UI-test namespace.
- The app owns a physical-device XCUITest target, stable accessibility
  identifiers, fitness screen objects, and seven journeys covering empty/reset,
  required-name validation and cancel, creation with and without notes,
  additional routine creation, workspace navigation, labeled exercise inputs,
  exercise deletion, and relaunch persistence.
- UI-test reset requires both `--xq-ui-testing` and
  `--xq-ui-testing-reset`; it removes only the isolated UI-test directory.
- Shared UI-test setup resets that isolated directory and verifies an empty
  routine list before every test; explicit relaunch helpers preserve data only
  within the current journey.
- Every new routine owns exactly seven stable, ordered training days. Schema-v1
  routines migrate to the same seven-day shape when loaded.
- Users can drill into any day and add, edit, or delete locally persisted
  exercises with a name, sets, reps, and weight in kilograms.
- Every exercise input has a persistent visible label—Exercise name, Sets,
  Repetitions, and Weight (kg)—plus a matching accessibility label.
- **Snapshot Progress** captures immutable exercise metrics. Exercises with the
  same case-insensitive name across multiple days are represented by their
  highest sets, reps, and weight values.
- The latest snapshot compares its reps and weight with the immediately
  previous snapshot and labels each metric First snapshot, Increased,
  Decreased, or Same.
- The app owns seven physical-device journeys; they cover all seven day
  rows, exercise creation and editing, three snapshots, immediate-previous
  comparison, relaunch persistence, and swipe deletion.
- Each routine retains only its newest two snapshots. Creation and pruning are
  persisted atomically, so the prior capture required for comparison remains
  while older captures are removed.
- Behavioral coverage is tracked in
  `docs/product/ios-xq-fitness-app-test-coverage.md` as component × capability,
  with unit/UI ownership or an explicit gap in every applicable cell.
- API integration, authentication, analytics, simulator workflows, routine
  rename/delete, custom day names, and cloud reports remain outside this slice.

## Validation

- `./scripts/module build ios-xq-fitness-app` compiles the unsigned app for
  generic iOS without a simulator.
- `./scripts/module test ios-xq-fitness-app` runs host-side `FitnessCore` unit
  tests.
- Signed build, install, launch, and UI acceptance run locally on the dedicated
  iPhone.
- `modules/ios-xq-fitness-app/scripts/run-device-ui-tests.sh` runs the complete
  suite on an environment-selected physical iPhone and retains XCResult output.
