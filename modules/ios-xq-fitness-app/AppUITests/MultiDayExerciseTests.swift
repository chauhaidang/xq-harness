import XCTest

@MainActor
final class MultiDayExerciseTests: FitnessUITestCase {
    func testExercisesCanBeAddedAcrossMultipleTrainingDays() {
        let app = fitnessApp
        let routines = RoutineListScreen(application: app)
        routines.openCreateRoutine().save(name: "Week Spread")
        routines.openRoutine(named: "Week Spread")

        var workspace = RoutineWorkspaceScreen(application: app)
        var monday = workspace.openDay(1)
        monday.openAddExercise().save(name: "Monday Squats")
        monday.exercise(named: "Monday Squats").requireExistence()
        workspace = monday.backToWorkspace()

        var wednesday = workspace.openDay(3)
        wednesday.openAddExercise().save(name: "Wednesday Rows")
        wednesday.exercise(named: "Wednesday Rows").requireExistence()
        XCTAssertFalse(wednesday.exercise(named: "Monday Squats").exists)
        workspace = wednesday.backToWorkspace()

        monday = workspace.openDay(1)
        monday.exercise(named: "Monday Squats").requireExistence()
        XCTAssertFalse(monday.exercise(named: "Wednesday Rows").exists)
        captureScreenshot(named: "Exercises isolated per training day")
    }

    func testUpdatingSetsPersistsOnTrainingDay() {
        let app = fitnessApp
        let routines = RoutineListScreen(application: app)
        routines.openCreateRoutine().save(name: "Sets Plan")
        routines.openRoutine(named: "Sets Plan")

        let day = RoutineWorkspaceScreen(application: app).openDay(2)
        day.openAddExercise().save(name: "Deadlift")
        day.openExercise(named: "Deadlift").update(sets: "5")
        day.exercise(named: "Deadlift").requireExistence()
        captureScreenshot(named: "Exercise sets updated")
    }
}
