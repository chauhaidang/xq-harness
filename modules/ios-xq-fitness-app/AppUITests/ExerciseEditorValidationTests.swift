import XCTest

@MainActor
final class ExerciseEditorValidationTests: FitnessUITestCase {
    func testBlankExerciseNameDisablesSaveAndCancelLeavesDayEmpty() {
        let app = fitnessApp
        let routines = RoutineListScreen(application: app)
        routines.openCreateRoutine().save(name: "Editor Gates")
        routines.openRoutine(named: "Editor Gates")

        let day = RoutineWorkspaceScreen(application: app).openDay(1)
        let editor = day.openAddExercise()

        editor.saveButton.requireExistence()
        XCTAssertFalse(editor.saveButton.isEnabled)

        editor.nameField.replaceText(with: "   ")
        XCTAssertFalse(editor.saveButton.isEnabled)

        editor.cancel()
        day.emptyState.requireExistence()
        captureScreenshot(named: "Exercise editor cancel keeps day empty")
    }
}
