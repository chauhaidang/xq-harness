import FitnessCore
import SwiftUI

struct FitnessRootView: View {
    let store: FitnessStore
    @State private var router = AppRouter()

    var body: some View {
        @Bindable var router = router

        NavigationStack(path: $router.path) {
            RoutineListView(store: store, router: router)
                .navigationDestination(for: AppRoute.self) { route in
                    switch route {
                    case .routine(let routineID):
                        RoutineWorkspaceView(store: store, router: router, routineID: routineID)
                    case let .trainingDay(routineID, dayID):
                        TrainingDayView(
                            store: store,
                            router: router,
                            routineID: routineID,
                            dayID: dayID
                        )
                    case .snapshotReport(let routineID):
                        SnapshotReportView(store: store, routineID: routineID)
                    }
                }
        }
        .sheet(item: $router.sheet) { destination in
            switch destination {
            case .createRoutine:
                RoutineEditorView(store: store)
            case let .exercise(routineID, dayID, exerciseID):
                ExerciseEditorView(
                    store: store,
                    routineID: routineID,
                    dayID: dayID,
                    exerciseID: exerciseID
                )
            }
        }
    }
}

private struct RoutineListView: View {
    let store: FitnessStore
    let router: AppRouter

    var body: some View {
        Group {
            if store.snapshot.routines.isEmpty {
                ContentUnavailableView {
                    Label("No Routines Yet", systemImage: "figure.strengthtraining.traditional")
                        .accessibilityIdentifier(FitnessAccessibility.emptyRoutineList)
                } description: {
                    Text("Create a simple weekly routine. Everything stays on this device.")
                } actions: {
                    Button("Create Routine") {
                        router.sheet = .createRoutine
                    }
                    .buttonStyle(.borderedProminent)
                    .accessibilityIdentifier(FitnessAccessibility.createRoutineButton)
                }
            } else {
                List(store.snapshot.routines) { routine in
                    NavigationLink(value: AppRoute.routine(routine.id)) {
                        VStack(alignment: .leading, spacing: 4) {
                            Text(routine.name)
                                .font(.headline)

                            if let notes = routine.notes {
                                Text(notes)
                                    .font(.subheadline)
                                    .foregroundStyle(.secondary)
                                    .lineLimit(2)
                            }
                        }
                        .padding(.vertical, 4)
                    }
                    .accessibilityIdentifier("\(FitnessAccessibility.routineRow).\(routine.id.uuidString)")
                }
            }
        }
        .navigationTitle("Routines")
        .toolbar {
            if !store.snapshot.routines.isEmpty {
                ToolbarItem(placement: .primaryAction) {
                    Button {
                        router.sheet = .createRoutine
                    } label: {
                        Label("Create Routine", systemImage: "plus")
                    }
                    .accessibilityIdentifier(FitnessAccessibility.createRoutineButton)
                }
            }
        }
    }
}

private struct RoutineEditorView: View {
    @Environment(\.dismiss) private var dismiss

    let store: FitnessStore
    @State private var model = RoutineEditorModel()

    var body: some View {
        @Bindable var model = model

        NavigationStack {
            Form {
                Section("Routine") {
                    TextField("Name", text: $model.name)
                        .textInputAutocapitalization(.words)
                        .accessibilityIdentifier(FitnessAccessibility.routineNameField)

                    TextField("Notes (optional)", text: $model.notes, axis: .vertical)
                        .lineLimit(3...6)
                        .accessibilityIdentifier(FitnessAccessibility.routineNotesField)
                }

                if let validationMessage = model.validationMessage {
                    Section {
                        Text(validationMessage)
                            .foregroundStyle(.red)
                            .accessibilityIdentifier(FitnessAccessibility.editorError)
                    }
                }

                Section {
                    Text("Saved locally on this device. Online sync can be added later without changing this flow.")
                        .font(.footnote)
                        .foregroundStyle(.secondary)
                }
            }
            .navigationTitle("New Routine")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                }

                ToolbarItem(placement: .confirmationAction) {
                    Button("Save") {
                        if model.save(to: store) {
                            dismiss()
                        }
                    }
                    .disabled(!model.canSave)
                    .accessibilityIdentifier(FitnessAccessibility.routineSaveButton)
                }
            }
        }
    }
}

#Preview("Empty routines") {
    let store = try! FitnessStore(persistence: InMemoryFitnessPersistence())
    return FitnessRootView(store: store)
}
