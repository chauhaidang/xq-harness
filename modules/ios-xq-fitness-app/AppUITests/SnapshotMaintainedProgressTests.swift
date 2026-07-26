import XCTest

@MainActor
final class SnapshotMaintainedProgressTests: FitnessUITestCase {
    func testUnchangedExerciseShowsMaintainedProgressOnSecondSnapshot() {
        let app = fitnessApp
        let routines = RoutineListScreen(application: app)
        routines.openCreateRoutine().save(name: "Steady Plan")
        routines.openRoutine(named: "Steady Plan")

        var workspace = RoutineWorkspaceScreen(application: app)
        let day = workspace.openDay(1)
        day.openAddExercise().save(name: "Plank Hold")
        workspace = day.backToWorkspace()

        var report = workspace.createSnapshot()
        report.progress("first").requireExistence()
        workspace = report.backToWorkspace()

        report = workspace.createSnapshot()
        report.root.requireExistence()
        report.progress("maintained").requireExistence()
        captureScreenshot(named: "Maintained progress on unchanged exercise")
    }
}
