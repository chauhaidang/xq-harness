import XCTest

@MainActor
final class RoutineLifecycleTests: FitnessUITestCase {
    func testRoutineCreationNavigationAndRelaunchPersistence() {
        var app = fitnessApp
        var routines = RoutineListScreen(application: app)
        routines.emptyState.requireExistence()

        routines.openCreateRoutine().save(
            name: "Strength Reset",
            notes: "Three focused days"
        )
        routines.routine(named: "Strength Reset").requireExistence()
        routines.notes("Three focused days").requireExistence()

        routines.openRoutine(named: "Strength Reset")
        app.descendants(matching: .any)[FitnessAccessibility.routineWorkspace]
            .requireExistence()
        captureScreenshot(named: "Routine workspace")

        app = relaunchPreservingTestData()
        routines = RoutineListScreen(application: app)
        routines.routine(named: "Strength Reset").requireExistence()
        routines.notes("Three focused days").requireExistence()
        captureScreenshot(named: "Persisted routine after relaunch")
    }
}
