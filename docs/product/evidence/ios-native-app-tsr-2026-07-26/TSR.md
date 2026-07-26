# Test Summary Report — iOS native apps (Simulator)

| Field | Value |
| --- | --- |
| **Report ID** | `ios-native-app-tsr-2026-07-26` |
| **Date** | 2026-07-26 (Asia/Bangkok, +07) |
| **Scope** | `ios-xq-finance-app`, `ios-xq-fitness-app` |
| **Strategy** | [ios-native-app-test-strategy.md](../../ios-native-app-test-strategy.md) |
| **Executor** | Cursor agent (local host), first-party runs |
| **Verdict** | **PASS** — 52 / 52 executed cases passed; 0 failed; 0 skipped |

## 1. Objective

Prove the supported unit + Simulator UI gates for both native iOS apps after
moving UI testing off physical device (device UI retained as tech debt only).

## 2. Environment (recorded)

See [`host-environment.txt`](./host-environment.txt).

| Item | Value |
| --- | --- |
| Host | macOS 15.x / Darwin 24.6.0 (x86_64) |
| Xcode | 26.0.1 (17A400) |
| UI destination | iOS Simulator — **iPhone 16**, iOS **26.0.1** (`E9F9419A-A059-4B8C-8E45-6E026D5F6452`) |
| Unit finance destination | iPhone 16 Simulator (via `./scripts/module test`) |
| Unit fitness destination | host `swift test` (`FitnessCore`) |
| Signing | Not required for Simulator UI / unit |

## 3. Entry / exit criteria

| Criterion | Result |
| --- | --- |
| Unit suites green for both modules | Met |
| Simulator UI schemes green for both modules | Met |
| Isolated UI-test storage / reset contract exercised | Met (suite design + reset journeys) |
| Physical-device UI | **Out of scope** (tech debt) |

## 4. Execution commands (evidence generators)

```bash
./scripts/module test ios-xq-finance-app
./scripts/module test ios-xq-fitness-app
modules/ios-xq-finance-app/scripts/run-ui-tests.sh
modules/ios-xq-fitness-app/scripts/run-ui-tests.sh
```

## 5. Results overview

| Layer | Module | Cases | Passed | Failed | Evidence |
| --- | --- | --- | --- | --- | --- |
| Unit | `ios-xq-finance-app` | 14 | 14 | 0 | [`finance-unit-summary.txt`](./finance-unit-summary.txt), [`finance-unit-tests.log`](./finance-unit-tests.log) |
| Unit | `ios-xq-fitness-app` | 17 | 17 | 0 | [`fitness-unit-summary.txt`](./fitness-unit-summary.txt), [`fitness-unit-tests.log`](./fitness-unit-tests.log) |
| UI (Simulator) | `ios-xq-finance-app` | 10 | 10 | 0 | [`finance-ui-summary.json`](./finance-ui-summary.json), [`finance-ui-cases.txt`](./finance-ui-cases.txt) |
| UI (Simulator) | `ios-xq-fitness-app` | 11 | 11 | 0 | [`fitness-ui-summary.json`](./fitness-ui-summary.json), [`fitness-ui-cases.txt`](./fitness-ui-cases.txt) |
| **Total** | | **52** | **52** | **0** | |

Machine summaries:

- Finance UI: `"result": "Passed"`, `passedTests: 10`, `failedTests: 0`
- Fitness UI: `"result": "Passed"`, `passedTests: 11`, `failedTests: 0`

## 6. UI case matrix (executed)

### 6.1 Finance (`ios-xq-finance-app-ui-tests`)

| Result | Duration | Case |
| --- | --- | --- |
| Passed | 47s | `AddAssetValidationTests.testAddAssetRequiresSymbolAndNameAndCancelKeepsPortfolioEmpty` |
| Passed | 38s | `AddAssetValidationTests.testCanCreateVNDNativeAsset` |
| Passed | 12s | `CurrencyToggleHitTargetTests.testCurrencyToggleRespondsToEdgeTaps` |
| Passed | 56s | `DeductionDialogTests.testCancelingDeductionKeepsTransaction` |
| Passed | 45s | `ExchangeRateTests.testExchangeRateCancelLeavesRateUnchanged` |
| Passed | 1m 13s | `ExchangeRateTests.testExchangeRateUpdatePersistsAndAffectsVNDDisplay` |
| Passed | 38s | `MultiAssetDeckTests.testIsolatedResetClearsPersistedAssets` |
| Passed | 58s | `MultiAssetDeckTests.testMultipleAssetsUpdatePositionAndSwipeAdvancesDeck` |
| Passed | 1m 24s | `PortfolioLifecycleTests.testPortfolioLifecyclePersistsInIsolatedStorage` |
| Passed | 1m 2s | `SheetValidationTests.testPriceAndBuyLotValidationAndCancelLeaveStateUnchanged` |

Full extract: [`finance-ui-cases.txt`](./finance-ui-cases.txt).

### 6.2 Fitness (`ios-xq-fitness-app-ui-tests`)

| Result | Duration | Case |
| --- | --- | --- |
| Passed | 1m 5s | `ExerciseEditorValidationTests.testBlankExerciseNameDisablesSaveAndCancelLeavesDayEmpty` |
| Passed | 1m 12s | `MultiDayExerciseTests.testExercisesCanBeAddedAcrossMultipleTrainingDays` |
| Passed | 53s | `MultiDayExerciseTests.testUpdatingSetsPersistsOnTrainingDay` |
| Passed | 21s | `RoutineEditorValidationTests.testRequiredNameValidationAndCancelLeaveRoutineListEmpty` |
| Passed | 40s | `RoutineLifecycleTests.testRoutineCreationNavigationAndRelaunchPersistence` |
| Passed | 39s | `RoutineListTests.testCreatesRoutineWithoutNotesAndAddsAnotherFromToolbar` |
| Passed | 27s | `RoutineListTests.testResetClearsPreviouslyPersistedUITestRoutines` |
| Passed | 45s | `SevenDaySnapshotTests.testExerciseCanBeDeletedFromTrainingDay` |
| Passed | 35s | `SevenDaySnapshotTests.testExerciseEditorShowsEveryInputLabel` |
| Passed | 2m 27s | `SevenDaySnapshotTests.testSevenDayExerciseDrillDownAndThreeSnapshotComparisonPersists` |
| Passed | 56s | `SnapshotMaintainedProgressTests.testUnchangedExerciseShowsMaintainedProgressOnSecondSnapshot` |

Full extract: [`fitness-ui-cases.txt`](./fitness-ui-cases.txt).

## 7. Primary artifacts (own evidence)

Checked into this folder (text/JSON extracts + logs):

| Artifact | Purpose |
| --- | --- |
| [`finance-ui-summary.json`](./finance-ui-summary.json) / [`fitness-ui-summary.json`](./fitness-ui-summary.json) | `xcresulttool get test-results summary` |
| [`finance-ui-tests.json`](./finance-ui-tests.json) / [`fitness-ui-tests.json`](./fitness-ui-tests.json) | Full tree from `xcresulttool get test-results tests` |
| [`finance-ui-tests.log`](./finance-ui-tests.log) / [`fitness-ui-tests.log`](./fitness-ui-tests.log) | Runner console |
| [`finance-unit-tests.log`](./finance-unit-tests.log) / [`fitness-unit-tests.log`](./fitness-unit-tests.log) | Module unit console |
| [`CHECKSUMS.txt`](./CHECKSUMS.txt) | SHA-256 of summary extracts |

Local XCResult bundles (binary; not committed; paths recorded):

| Suite | Path file | Bundle |
| --- | --- | --- |
| Finance UI | [`finance-ui-xcresult.path`](./finance-ui-xcresult.path) | `modules/ios-xq-finance-app/build/ui-test-results/finance-ui-tests-20260726-153712.xcresult` |
| Fitness UI | [`fitness-ui-xcresult.path`](./fitness-ui-xcresult.path) | `modules/ios-xq-fitness-app/build/ui-test-results/fitness-ui-tests-20260726-154756.xcresult` |
| Finance unit | [`finance-unit-xcresult.path`](./finance-unit-xcresult.path) | DerivedData `Test-ios-xq-finance-app-2026.07.26_15-34-45-+0700.xcresult` |

Reproduce summary extraction:

```bash
xcrun xcresulttool get test-results summary --path "$(cat docs/product/evidence/ios-native-app-tsr-2026-07-26/finance-ui-xcresult.path)"
xcrun xcresulttool get test-results summary --path "$(cat docs/product/evidence/ios-native-app-tsr-2026-07-26/fitness-ui-xcresult.path)"
```

## 8. Defects / deviations

| ID | Item | Disposition |
| --- | --- | --- |
| D1 | Physical-device UI / IPA / plugged-in UDID runners | Deferred tech debt; not executed this TSR |
| D2 | Fitness UI compile warning: `wednesday` should be `let` in `MultiDayExerciseTests.swift:17` | Non-blocking; suite still passed |
| — | No product defects found in executed scope | — |

## 9. Risks / residual

- UI gate is **Simulator-only**; device-specific gestures, performance, and signing are unproven.
- UI suites are local-only (not CI); regressions require manual/agent Simulator runs.
- XCResult binaries remain on the executor host under `build/ui-test-results/` / DerivedData.

## 10. Recommendation

**Accept** the Simulator unit+UI gate for both apps as the current release/test bar.
Track physical-device UI separately as tech debt per the strategy doc.
