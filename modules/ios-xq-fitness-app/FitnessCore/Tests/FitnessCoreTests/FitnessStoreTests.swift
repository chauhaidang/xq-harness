import Foundation
import XCTest
@testable import FitnessCore

final class FitnessStoreTests: XCTestCase {
    func testFirstLaunchStartsWithAnEmptyVersionedSnapshot() throws {
        let persistence = InMemoryFitnessPersistence()

        let store = try FitnessStore(persistence: persistence)

        XCTAssertEqual(store.snapshot, FitnessSnapshot())
        XCTAssertEqual(store.snapshot.schemaVersion, FitnessSnapshot.currentSchemaVersion)
        XCTAssertTrue(store.snapshot.routines.isEmpty)
    }

    func testCreateRoutineTrimsInputAndPersistsTheCandidateSnapshot() throws {
        let persistence = InMemoryFitnessPersistence()
        let store = try FitnessStore(persistence: persistence)
        let routineID = UUID(uuidString: "0F2B8215-BB22-41AE-82B8-A6C81D1D657E")!

        try store.send(.createRoutine(
            id: routineID,
            name: "  Strength Reset  ",
            notes: "  Three focused days.  "
        ))

        XCTAssertEqual(
            store.snapshot.routines,
            [Routine(id: routineID, name: "Strength Reset", notes: "Three focused days.")]
        )
        XCTAssertEqual(persistence.savedSnapshots, [store.snapshot])
    }

    func testCreateRoutineRejectsBlankNameWithoutMutatingOrPersisting() throws {
        let persistence = InMemoryFitnessPersistence()
        let store = try FitnessStore(persistence: persistence)

        XCTAssertThrowsError(
            try store.send(.createRoutine(id: UUID(), name: " \n ", notes: "ignored"))
        ) { error in
            XCTAssertEqual(error as? FitnessStoreError, .routineNameRequired)
        }
        XCTAssertTrue(store.snapshot.routines.isEmpty)
        XCTAssertTrue(persistence.savedSnapshots.isEmpty)
    }

    func testFailedSaveDoesNotPublishPartiallyAppliedState() throws {
        let persistence = InMemoryFitnessPersistence(saveError: TestFailure.expected)
        let store = try FitnessStore(persistence: persistence)

        XCTAssertThrowsError(
            try store.send(.createRoutine(id: UUID(), name: "Upper Body", notes: ""))
        )
        XCTAssertTrue(store.snapshot.routines.isEmpty)
    }

    func testBlankRoutineNotesAreStoredAsNil() throws {
        let store = try FitnessStore(persistence: InMemoryFitnessPersistence())

        try store.send(.createRoutine(id: UUID(), name: "Cardio", notes: "  \n  "))

        XCTAssertNil(store.snapshot.routines.first?.notes)
    }

    func testEveryRoutineOwnsExactlySevenStableOrderedDays() throws {
        let routineID = UUID(uuidString: "6E91E8BB-54D7-42E4-8B11-6D55DCFC9020")!
        let store = try FitnessStore(persistence: InMemoryFitnessPersistence())

        try store.send(.createRoutine(id: routineID, name: "Seven Day Plan", notes: ""))

        let days = try XCTUnwrap(store.snapshot.routines.first?.days)
        XCTAssertEqual(days.count, 7)
        XCTAssertEqual(days.map(\.number), Array(1...7))
        XCTAssertEqual(days.map(\.name), TrainingDay.weekdayNames)
        XCTAssertEqual(Set(days.map(\.id)).count, 7)
        XCTAssertEqual(days, Routine(id: routineID, name: "Seven Day Plan", notes: nil).days)
    }

    func testLegacySchemaMigratesToSevenDaysAndCurrentVersion() throws {
        let directory = FileManager.default.temporaryDirectory
            .appendingPathComponent(UUID().uuidString, isDirectory: true)
        defer { try? FileManager.default.removeItem(at: directory) }
        let persistence = JSONFitnessPersistence(directory: directory)
        try FileManager.default.createDirectory(at: directory, withIntermediateDirectories: true)
        let legacy = LegacySnapshot(
            schemaVersion: 1,
            routines: [LegacyRoutine(id: UUID(), name: "Legacy", notes: nil)]
        )
        let data = try JSONEncoder().encode(legacy)
        try data.write(to: persistence.primaryURL)
        try data.write(to: persistence.recoveryURL)

        let store = try FitnessStore(persistence: persistence)

        XCTAssertEqual(store.snapshot.schemaVersion, FitnessSnapshot.currentSchemaVersion)
        XCTAssertEqual(store.snapshot.routines.first?.days.count, 7)
        XCTAssertEqual(store.snapshot.routines.first?.days.map(\.name), TrainingDay.weekdayNames)
        XCTAssertTrue(store.snapshot.routines.first?.snapshots.isEmpty == true)
    }

    func testExerciseCommandsAddUpdateAndDeleteWithinOneDay() throws {
        let persistence = InMemoryFitnessPersistence()
        let store = try FitnessStore(persistence: persistence)
        let routineID = UUID()
        let exerciseID = UUID()
        try store.send(.createRoutine(id: routineID, name: "Strength", notes: ""))
        let dayID = try XCTUnwrap(store.snapshot.routines.first?.days.first?.id)

        try store.send(.addExercise(
            routineID: routineID,
            dayID: dayID,
            id: exerciseID,
            name: "  Bench Press  ",
            sets: 3,
            reps: 10,
            weightKg: 80
        ))
        XCTAssertEqual(
            store.snapshot.routines.first?.days.first?.exercises,
            [Exercise(id: exerciseID, name: "Bench Press", sets: 3, reps: 10, weightKg: 80)]
        )

        try store.send(.updateExercise(
            routineID: routineID,
            dayID: dayID,
            exerciseID: exerciseID,
            name: "Bench Press",
            sets: 4,
            reps: 8,
            weightKg: 90
        ))
        XCTAssertEqual(store.snapshot.routines.first?.days.first?.exercises.first?.sets, 4)
        XCTAssertEqual(store.snapshot.routines.first?.days.first?.exercises.first?.weightKg, 90)

        try store.send(.deleteExercise(
            routineID: routineID,
            dayID: dayID,
            exerciseID: exerciseID
        ))
        XCTAssertTrue(store.snapshot.routines.first?.days.first?.exercises.isEmpty == true)
        XCTAssertEqual(persistence.savedSnapshots.count, 4)
    }

    func testInvalidExerciseDoesNotMutateOrPersistCandidate() throws {
        let persistence = InMemoryFitnessPersistence()
        let store = try FitnessStore(persistence: persistence)
        let routineID = UUID()
        try store.send(.createRoutine(id: routineID, name: "Strength", notes: ""))
        let dayID = try XCTUnwrap(store.snapshot.routines.first?.days.first?.id)
        let savesBeforeInvalidCommand = persistence.savedSnapshots.count

        XCTAssertThrowsError(try store.send(.addExercise(
            routineID: routineID,
            dayID: dayID,
            id: UUID(),
            name: "Bench Press",
            sets: 0,
            reps: 10,
            weightKg: 80
        ))) { error in
            XCTAssertEqual(error as? FitnessStoreError, .exerciseMetricsInvalid)
        }
        XCTAssertTrue(store.snapshot.routines.first?.days.first?.exercises.isEmpty == true)
        XCTAssertEqual(persistence.savedSnapshots.count, savesBeforeInvalidCommand)
    }

    func testSnapshotsAreImmutableAggregateDuplicateExercisesAndCompareToPrevious() throws {
        let store = try FitnessStore(persistence: InMemoryFitnessPersistence())
        let routineID = UUID()
        let firstBenchID = UUID()
        let secondBenchID = UUID()
        try store.send(.createRoutine(id: routineID, name: "Strength", notes: ""))
        let days = try XCTUnwrap(store.snapshot.routines.first?.days)

        try store.send(.addExercise(
            routineID: routineID,
            dayID: days[0].id,
            id: firstBenchID,
            name: "Bench Press",
            sets: 3,
            reps: 30,
            weightKg: 80
        ))
        try store.send(.addExercise(
            routineID: routineID,
            dayID: days[1].id,
            id: secondBenchID,
            name: "bench press",
            sets: 4,
            reps: 25,
            weightKg: 85
        ))
        try store.send(.createSnapshot(
            routineID: routineID,
            id: UUID(),
            createdAt: Date(timeIntervalSince1970: 100)
        ))

        var report = try store.snapshotReport(routineID: routineID)
        XCTAssertNil(report.previous)
        XCTAssertEqual(report.exercises.count, 1)
        XCTAssertEqual(report.exercises.first?.current.sets, 4)
        XCTAssertEqual(report.exercises.first?.current.reps, 30)
        XCTAssertEqual(report.exercises.first?.current.weightKg, 85)
        XCTAssertEqual(report.exercises.first?.reps, .first)
        XCTAssertEqual(report.exercises.first?.weight, .first)

        try store.send(.updateExercise(
            routineID: routineID,
            dayID: days[0].id,
            exerciseID: firstBenchID,
            name: "Bench Press",
            sets: 3,
            reps: 35,
            weightKg: 80
        ))
        try store.send(.createSnapshot(
            routineID: routineID,
            id: UUID(),
            createdAt: Date(timeIntervalSince1970: 200)
        ))

        report = try store.snapshotReport(routineID: routineID)
        XCTAssertEqual(report.exercises.first?.reps, .increased)
        XCTAssertEqual(report.exercises.first?.weight, .maintained)
        XCTAssertEqual(report.previous?.exercises.first?.reps, 30)
        XCTAssertEqual(store.snapshot.routines.first?.snapshots.first?.exercises.first?.reps, 30)

        try store.send(.updateExercise(
            routineID: routineID,
            dayID: days[0].id,
            exerciseID: firstBenchID,
            name: "Bench Press",
            sets: 3,
            reps: 35,
            weightKg: 70
        ))
        try store.send(.updateExercise(
            routineID: routineID,
            dayID: days[1].id,
            exerciseID: secondBenchID,
            name: "Bench Press",
            sets: 4,
            reps: 25,
            weightKg: 75
        ))
        try store.send(.createSnapshot(
            routineID: routineID,
            id: UUID(),
            createdAt: Date(timeIntervalSince1970: 300)
        ))

        report = try store.snapshotReport(routineID: routineID)
        XCTAssertEqual(report.exercises.first?.reps, .maintained)
        XCTAssertEqual(report.exercises.first?.weight, .decreased)
    }

    func testCreatingThirdSnapshotRetainsOnlyNewestTwoCaptures() throws {
        let store = try FitnessStore(persistence: InMemoryFitnessPersistence())
        let routineID = UUID()
        let snapshotA = UUID()
        let snapshotB = UUID()
        let snapshotC = UUID()
        try store.send(.createRoutine(id: routineID, name: "Bounded History", notes: ""))

        try store.send(.createSnapshot(
            routineID: routineID,
            id: snapshotA,
            createdAt: Date(timeIntervalSince1970: 100)
        ))
        try store.send(.createSnapshot(
            routineID: routineID,
            id: snapshotB,
            createdAt: Date(timeIntervalSince1970: 200)
        ))
        try store.send(.createSnapshot(
            routineID: routineID,
            id: snapshotC,
            createdAt: Date(timeIntervalSince1970: 300)
        ))

        let retained = try XCTUnwrap(store.snapshot.routines.first?.snapshots)
        XCTAssertEqual(retained.map(\.id), [snapshotB, snapshotC])
        let report = try store.snapshotReport(routineID: routineID)
        XCTAssertEqual(report.previous?.id, snapshotB)
        XCTAssertEqual(report.current.id, snapshotC)
    }

    func testJSONPersistenceRoundTripsAndRecoversFromDamagedPrimaryFile() throws {
        let directory = FileManager.default.temporaryDirectory
            .appendingPathComponent(UUID().uuidString, isDirectory: true)
        defer { try? FileManager.default.removeItem(at: directory) }
        let persistence = JSONFitnessPersistence(directory: directory)
        let routine = Routine(id: UUID(), name: "Mobility", notes: "Daily reset")
        let snapshot = FitnessSnapshot(routines: [routine])

        try persistence.save(snapshot)
        XCTAssertEqual(try persistence.load(), snapshot)

        try Data("not-json".utf8).write(to: persistence.primaryURL, options: .atomic)
        XCTAssertEqual(try persistence.load(), snapshot)
    }

    func testProductionStorageStartsEmptyAndSeparatesUITestNamespace() throws {
        let baseURL = FileManager.default.temporaryDirectory
            .appendingPathComponent(UUID().uuidString, isDirectory: true)
        defer { try? FileManager.default.removeItem(at: baseURL) }
        let normalDirectory = FitnessStorage.directory(baseURL: baseURL, arguments: [])
        let uiTestDirectory = FitnessStorage.directory(
            baseURL: baseURL,
            arguments: ["--xq-ui-testing"]
        )

        let store = try FitnessStore(
            persistence: JSONFitnessPersistence(directory: normalDirectory)
        )

        XCTAssertEqual(store.snapshot, FitnessSnapshot())
        XCTAssertEqual(normalDirectory.lastPathComponent, "XQFitness")
        XCTAssertEqual(uiTestDirectory.lastPathComponent, "XQFitnessUITests")
        XCTAssertNotEqual(normalDirectory, uiTestDirectory)
    }

    func testUITestResetRequiresIsolationAndResetFlags() {
        XCTAssertFalse(FitnessStorage.shouldReset(arguments: ["app", "--xq-ui-testing-reset"]))
        XCTAssertFalse(FitnessStorage.shouldReset(arguments: ["app", "--xq-ui-testing"]))
        XCTAssertTrue(FitnessStorage.shouldReset(arguments: [
            "app",
            "--xq-ui-testing",
            "--xq-ui-testing-reset"
        ]))
    }

    func testUITestResetRemovesOnlyIsolatedDirectory() throws {
        let baseURL = FileManager.default.temporaryDirectory
            .appendingPathComponent(UUID().uuidString, isDirectory: true)
        defer { try? FileManager.default.removeItem(at: baseURL) }
        let normalDirectory = FitnessStorage.directory(baseURL: baseURL, arguments: [])
        let uiTestDirectory = FitnessStorage.directory(
            baseURL: baseURL,
            arguments: ["--xq-ui-testing"]
        )
        try FileManager.default.createDirectory(at: normalDirectory, withIntermediateDirectories: true)
        try FileManager.default.createDirectory(at: uiTestDirectory, withIntermediateDirectories: true)
        let normalMarker = normalDirectory.appendingPathComponent("normal-marker")
        let uiTestMarker = uiTestDirectory.appendingPathComponent("ui-test-marker")
        try Data().write(to: normalMarker)
        try Data().write(to: uiTestMarker)

        try FitnessStorage.resetUITestDataIfRequested(
            directory: uiTestDirectory,
            arguments: ["app", "--xq-ui-testing", "--xq-ui-testing-reset"]
        )

        XCTAssertTrue(FileManager.default.fileExists(atPath: normalMarker.path))
        XCTAssertFalse(FileManager.default.fileExists(atPath: uiTestDirectory.path))
    }

    func testRecoveryWriteFailureFailsSaveAndRollsBackPrimary() throws {
        let directory = FileManager.default.temporaryDirectory
            .appendingPathComponent(UUID().uuidString, isDirectory: true)
        defer { try? FileManager.default.removeItem(at: directory) }
        let persistence = JSONFitnessPersistence(directory: directory)
        try FileManager.default.createDirectory(
            at: persistence.recoveryURL,
            withIntermediateDirectories: true
        )

        XCTAssertThrowsError(
            try persistence.save(FitnessSnapshot(
                routines: [Routine(id: UUID(), name: "Blocked", notes: nil)]
            ))
        )
        XCTAssertFalse(FileManager.default.fileExists(atPath: persistence.primaryURL.path))
    }

    func testFuturePrimarySchemaIsNotReplacedByOlderRecovery() throws {
        let directory = FileManager.default.temporaryDirectory
            .appendingPathComponent(UUID().uuidString, isDirectory: true)
        defer { try? FileManager.default.removeItem(at: directory) }
        let persistence = JSONFitnessPersistence(directory: directory)
        try persistence.save(FitnessSnapshot())
        let futureData = try JSONEncoder().encode(
            FitnessSnapshot(schemaVersion: FitnessSnapshot.currentSchemaVersion + 1)
        )
        try futureData.write(to: persistence.primaryURL, options: .atomic)

        XCTAssertThrowsError(try persistence.load()) { error in
            XCTAssertEqual(
                error as? JSONFitnessPersistenceError,
                .unsupportedSchemaVersion(FitnessSnapshot.currentSchemaVersion + 1)
            )
        }
        XCTAssertEqual(try Data(contentsOf: persistence.primaryURL), futureData)
    }
}

private enum TestFailure: Error {
    case expected
}

private struct LegacySnapshot: Codable {
    let schemaVersion: Int
    let routines: [LegacyRoutine]
}

private struct LegacyRoutine: Codable {
    let id: UUID
    let name: String
    let notes: String?
}
