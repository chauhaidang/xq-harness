import FitnessCore
import SwiftUI

struct RoutineWorkspaceView: View {
    let store: FitnessStore
    let router: AppRouter
    let routineID: UUID

    @State private var errorMessage: String?

    private var routine: Routine? {
        store.snapshot.routines.first { $0.id == routineID }
    }

    var body: some View {
        Group {
            if let routine {
                List {
                    Section {
                        Button {
                            createSnapshot()
                        } label: {
                            Label("Snapshot Progress", systemImage: "camera.aperture")
                                .frame(maxWidth: .infinity, alignment: .center)
                        }
                        .buttonStyle(.borderedProminent)
                        .accessibilityIdentifier(FitnessAccessibility.snapshotButton)

                        if !routine.snapshots.isEmpty {
                            NavigationLink(value: AppRoute.snapshotReport(routineID: routineID)) {
                                Label(
                                    "Latest Comparison",
                                    systemImage: "chart.line.uptrend.xyaxis"
                                )
                            }
                        }
                    } footer: {
                        Text("Snapshots stay on this device and compare exercise reps and weight with the previous capture.")
                    }

                    Section("Seven-Day Training Week") {
                        ForEach(routine.days.sorted(using: KeyPathComparator(\.number))) { day in
                            NavigationLink(
                                value: AppRoute.trainingDay(routineID: routineID, dayID: day.id)
                            ) {
                                TrainingDayRow(day: day)
                            }
                            .accessibilityIdentifier(
                                "\(FitnessAccessibility.trainingDayRow).\(day.number)"
                            )
                        }
                    }
                }
                .accessibilityIdentifier(FitnessAccessibility.routineWorkspace)
                .navigationTitle(routine.name)
            } else {
                ContentUnavailableView(
                    "Routine Unavailable",
                    systemImage: "exclamationmark.triangle"
                )
            }
        }
        .alert("Could Not Create Snapshot", isPresented: errorIsPresented) {
            Button("OK", role: .cancel) {}
        } message: {
            Text(errorMessage ?? "Unknown error")
        }
    }

    private var errorIsPresented: Binding<Bool> {
        Binding(
            get: { errorMessage != nil },
            set: { if !$0 { errorMessage = nil } }
        )
    }

    private func createSnapshot() {
        do {
            try store.send(.createSnapshot(
                routineID: routineID,
                id: UUID(),
                createdAt: Date()
            ))
            router.path.append(.snapshotReport(routineID: routineID))
        } catch {
            errorMessage = error.localizedDescription
        }
    }
}

private struct TrainingDayRow: View {
    let day: TrainingDay

    var body: some View {
        HStack(spacing: 12) {
            Text(day.name.prefix(3).uppercased())
                .font(.caption.bold())
                .foregroundStyle(.white)
                .frame(width: 34, height: 34)
                .background(.blue.gradient, in: Circle())

            VStack(alignment: .leading, spacing: 3) {
                Text(day.name)
                    .font(.headline)
                Text(day.exercises.isEmpty
                    ? "Rest or add exercises"
                    : "\(day.exercises.count) exercise\(day.exercises.count == 1 ? "" : "s")")
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
            }
        }
        .padding(.vertical, 3)
    }
}

struct TrainingDayView: View {
    let store: FitnessStore
    let router: AppRouter
    let routineID: UUID
    let dayID: UUID

    @State private var errorMessage: String?

    private var day: TrainingDay? {
        store.snapshot.routines
            .first(where: { $0.id == routineID })?
            .days.first(where: { $0.id == dayID })
    }

    var body: some View {
        Group {
            if let day {
                List {
                    if day.exercises.isEmpty {
                        ContentUnavailableView {
                            Label("No Exercises", systemImage: "dumbbell")
                        } description: {
                            Text("Add the exercises planned for this training day.")
                        } actions: {
                            addExerciseButton
                        }
                    } else {
                        Section("Exercises") {
                            ForEach(day.exercises) { exercise in
                                Button {
                                    router.sheet = .exercise(
                                        routineID: routineID,
                                        dayID: dayID,
                                        exerciseID: exercise.id
                                    )
                                } label: {
                                    ExerciseRow(exercise: exercise)
                                }
                                .buttonStyle(.plain)
                                .accessibilityIdentifier(
                                    "\(FitnessAccessibility.exerciseRow).\(exercise.id.uuidString)"
                                )
                                .swipeActions {
                                    Button("Delete", role: .destructive) {
                                        delete(exercise)
                                    }
                                }
                            }
                        }
                    }
                }
                .accessibilityIdentifier(FitnessAccessibility.trainingDayScreen)
                .navigationTitle(day.name)
                .toolbar {
                    ToolbarItem(placement: .primaryAction) {
                        addExerciseButton
                    }
                }
            } else {
                ContentUnavailableView("Training Day Unavailable", systemImage: "calendar.badge.exclamationmark")
            }
        }
        .alert("Could Not Update Exercise", isPresented: errorIsPresented) {
            Button("OK", role: .cancel) {}
        } message: {
            Text(errorMessage ?? "Unknown error")
        }
    }

    private var addExerciseButton: some View {
        Button {
            router.sheet = .exercise(routineID: routineID, dayID: dayID, exerciseID: nil)
        } label: {
            Label("Add Exercise", systemImage: "plus")
        }
        .accessibilityIdentifier(FitnessAccessibility.addExerciseButton)
    }

    private var errorIsPresented: Binding<Bool> {
        Binding(
            get: { errorMessage != nil },
            set: { if !$0 { errorMessage = nil } }
        )
    }

    private func delete(_ exercise: Exercise) {
        do {
            try store.send(.deleteExercise(
                routineID: routineID,
                dayID: dayID,
                exerciseID: exercise.id
            ))
        } catch {
            errorMessage = error.localizedDescription
        }
    }
}

private struct ExerciseRow: View {
    let exercise: Exercise

    var body: some View {
        VStack(alignment: .leading, spacing: 5) {
            Text(exercise.name)
                .font(.headline)
            Text("\(exercise.sets) sets · \(exercise.reps) reps · \(exercise.weightKg.formatted()) kg")
                .font(.subheadline.monospacedDigit())
                .foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .contentShape(Rectangle())
    }
}
