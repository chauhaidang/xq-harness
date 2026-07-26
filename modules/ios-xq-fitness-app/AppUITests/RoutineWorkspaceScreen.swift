import XCTest

@MainActor
struct RoutineWorkspaceScreen: ScreenObject {
    let application: XCUIApplication

    var root: XCUIElement {
        application.descendants(matching: .any)[FitnessAccessibility.routineWorkspace]
    }

    func day(_ number: Int) -> XCUIElement {
        application.descendants(matching: .any)[
            "\(FitnessAccessibility.trainingDayRow).\(number)"
        ]
    }

    func dayName(_ number: Int) -> XCUIElement {
        application.staticTexts[weekdayName(number)]
    }

    private func weekdayName(_ number: Int) -> String {
        ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"][number - 1]
    }

    func openDay(_ number: Int) -> TrainingDayScreen {
        day(number).tapWhenHittable()
        return TrainingDayScreen(application: application)
    }

    func createSnapshot() -> SnapshotReportScreen {
        application.buttons[FitnessAccessibility.snapshotButton].tapWhenHittable()
        return SnapshotReportScreen(application: application)
    }

    func openLatestComparison() -> SnapshotReportScreen {
        application.staticTexts["Latest Comparison"].tapWhenHittable()
        return SnapshotReportScreen(application: application)
    }
}

@MainActor
struct TrainingDayScreen: ScreenObject {
    let application: XCUIApplication

    var emptyState: XCUIElement {
        application.staticTexts["No Exercises"]
    }

    func exercise(named name: String) -> XCUIElement {
        application.staticTexts[name]
    }

    func openAddExercise() -> ExerciseEditorScreen {
        application.buttons[FitnessAccessibility.addExerciseButton]
            .firstMatch
            .tapWhenHittable()
        return ExerciseEditorScreen(application: application)
    }

    func openExercise(named name: String) -> ExerciseEditorScreen {
        exercise(named: name).tapWhenHittable()
        return ExerciseEditorScreen(application: application)
    }

    func deleteExercise(named name: String) {
        exercise(named: name).swipeLeft()
        application.buttons["Delete"].tapWhenHittable()
    }

    func backToWorkspace() -> RoutineWorkspaceScreen {
        application.navigationBars.buttons.element(boundBy: 0).tapWhenHittable()
        return RoutineWorkspaceScreen(application: application)
    }
}

@MainActor
struct ExerciseEditorScreen: ScreenObject {
    let application: XCUIApplication

    var nameLabel: XCUIElement {
        application.staticTexts[FitnessAccessibility.exerciseNameLabel]
    }

    var setsLabel: XCUIElement {
        application.staticTexts[FitnessAccessibility.exerciseSetsLabel]
    }

    var repsLabel: XCUIElement {
        application.staticTexts[FitnessAccessibility.exerciseRepsLabel]
    }

    var weightLabel: XCUIElement {
        application.staticTexts[FitnessAccessibility.exerciseWeightLabel]
    }

    var nameField: XCUIElement {
        application.textFields[FitnessAccessibility.exerciseNameField]
    }

    var setsField: XCUIElement {
        application.textFields[FitnessAccessibility.exerciseSetsField]
    }

    var repsField: XCUIElement {
        application.textFields[FitnessAccessibility.exerciseRepsField]
    }

    var weightField: XCUIElement {
        application.textFields[FitnessAccessibility.exerciseWeightField]
    }

    var saveButton: XCUIElement {
        application.buttons[FitnessAccessibility.exerciseSaveButton]
    }

    func save(name: String? = nil) {
        if let name {
            nameField.replaceText(with: name)
        }
        saveButton.tapWhenHittable()
    }

    func update(reps: String? = nil, weight: String? = nil, sets: String? = nil) {
        if let sets {
            setsField.replaceText(with: sets)
        }
        if let reps {
            repsField.replaceText(with: reps)
        }
        if let weight {
            weightField.replaceText(with: weight)
        }
        save()
    }

    func cancel() {
        application.buttons["Cancel"].tapWhenHittable()
    }
}

@MainActor
struct SnapshotReportScreen: ScreenObject {
    let application: XCUIApplication

    var root: XCUIElement {
        application.descendants(matching: .any)[FitnessAccessibility.snapshotReport]
    }

    func exercise(named name: String) -> XCUIElement {
        application.staticTexts[name]
    }

    func progress(_ indicator: String) -> XCUIElement {
        let title = switch indicator {
        case "first": "First snapshot"
        case "increased": "Increased"
        case "decreased": "Decreased"
        case "maintained": "Same"
        default: indicator
        }
        return application.staticTexts[title].firstMatch
    }

    func backToWorkspace() -> RoutineWorkspaceScreen {
        application.navigationBars.buttons.element(boundBy: 0).tapWhenHittable()
        return RoutineWorkspaceScreen(application: application)
    }
}
