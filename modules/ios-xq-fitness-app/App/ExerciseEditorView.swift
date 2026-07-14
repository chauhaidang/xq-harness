import FitnessCore
import SwiftUI

struct ExerciseEditorView: View {
    @Environment(\.dismiss) private var dismiss

    let store: FitnessStore
    let routineID: UUID
    let dayID: UUID
    let exerciseID: UUID?

    @State private var name: String
    @State private var sets: Int
    @State private var reps: Int
    @State private var weightKg: Double
    @State private var errorMessage: String?

    init(store: FitnessStore, routineID: UUID, dayID: UUID, exerciseID: UUID?) {
        self.store = store
        self.routineID = routineID
        self.dayID = dayID
        self.exerciseID = exerciseID

        let exercise = store.snapshot.routines
            .first(where: { $0.id == routineID })?
            .days.first(where: { $0.id == dayID })?
            .exercises.first(where: { $0.id == exerciseID })
        _name = State(initialValue: exercise?.name ?? "")
        _sets = State(initialValue: exercise?.sets ?? 3)
        _reps = State(initialValue: exercise?.reps ?? 10)
        _weightKg = State(initialValue: exercise?.weightKg ?? 0)
    }

    private var canSave: Bool {
        !name.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
    }

    var body: some View {
        NavigationStack {
            Form {
                Section("Exercise") {
                    VStack(alignment: .leading, spacing: 6) {
                        Text("Exercise name")
                            .font(.subheadline)
                            .foregroundStyle(.secondary)
                            .accessibilityIdentifier(FitnessAccessibility.exerciseNameLabel)
                        TextField("e.g. Bench Press", text: $name)
                            .textInputAutocapitalization(.words)
                            .accessibilityLabel("Exercise name")
                            .accessibilityIdentifier(FitnessAccessibility.exerciseNameField)
                    }

                    VStack(alignment: .leading, spacing: 6) {
                        Text("Sets")
                            .font(.subheadline)
                            .foregroundStyle(.secondary)
                            .accessibilityIdentifier(FitnessAccessibility.exerciseSetsLabel)
                        TextField("Number of sets", value: $sets, format: .number)
                            .keyboardType(.numberPad)
                            .accessibilityLabel("Sets")
                            .accessibilityIdentifier(FitnessAccessibility.exerciseSetsField)
                    }

                    VStack(alignment: .leading, spacing: 6) {
                        Text("Repetitions")
                            .font(.subheadline)
                            .foregroundStyle(.secondary)
                            .accessibilityIdentifier(FitnessAccessibility.exerciseRepsLabel)
                        TextField("Repetitions per set", value: $reps, format: .number)
                            .keyboardType(.numberPad)
                            .accessibilityLabel("Repetitions")
                            .accessibilityIdentifier(FitnessAccessibility.exerciseRepsField)
                    }

                    VStack(alignment: .leading, spacing: 6) {
                        Text("Weight (kg)")
                            .font(.subheadline)
                            .foregroundStyle(.secondary)
                            .accessibilityIdentifier(FitnessAccessibility.exerciseWeightLabel)
                        TextField("Weight in kilograms", value: $weightKg, format: .number)
                            .keyboardType(.decimalPad)
                            .accessibilityLabel("Weight (kg)")
                            .accessibilityIdentifier(FitnessAccessibility.exerciseWeightField)
                    }
                }

                if let errorMessage {
                    Section {
                        Text(errorMessage)
                            .foregroundStyle(.red)
                    }
                }

                Section {
                    Text("Snapshots compare the highest reps and weight recorded for exercises with the same name across the seven-day routine.")
                        .font(.footnote)
                        .foregroundStyle(.secondary)
                }
            }
            .navigationTitle(exerciseID == nil ? "Add Exercise" : "Edit Exercise")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Save") { save() }
                        .disabled(!canSave)
                        .accessibilityIdentifier(FitnessAccessibility.exerciseSaveButton)
                }
            }
        }
    }

    private func save() {
        do {
            if let exerciseID {
                try store.send(.updateExercise(
                    routineID: routineID,
                    dayID: dayID,
                    exerciseID: exerciseID,
                    name: name,
                    sets: sets,
                    reps: reps,
                    weightKg: weightKg
                ))
            } else {
                try store.send(.addExercise(
                    routineID: routineID,
                    dayID: dayID,
                    id: UUID(),
                    name: name,
                    sets: sets,
                    reps: reps,
                    weightKg: weightKg
                ))
            }
            dismiss()
        } catch {
            errorMessage = error.localizedDescription
        }
    }
}
