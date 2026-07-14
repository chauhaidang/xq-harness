import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { commonStyles, colors, spacing } from '../styles/common';

/**
 * Form for adding or editing an exercise (name, total reps, weight, total sets, optional notes).
 * Used by ManageExerciseScreen for create and update.
 */
const ExerciseForm = ({
  initialValues = null,
  onSubmit,
  onCancel,
  submitLabel = 'Save',
  loading = false,
}) => {
  const [exerciseName, setExerciseName] = useState(initialValues?.exerciseName ?? '');
  const [totalReps, setTotalReps] = useState(
    initialValues?.totalReps != null ? String(initialValues.totalReps) : ''
  );
  const [weight, setWeight] = useState(
    initialValues?.weight != null ? String(initialValues.weight) : ''
  );
  const [totalSets, setTotalSets] = useState(
    initialValues?.totalSets != null ? String(initialValues.totalSets) : ''
  );
  const [notes, setNotes] = useState(initialValues?.notes ?? '');

  useEffect(() => {
    if (initialValues) {
      setExerciseName(initialValues.exerciseName ?? '');
      setTotalReps(initialValues.totalReps != null ? String(initialValues.totalReps) : '');
      setWeight(initialValues.weight != null ? String(initialValues.weight) : '');
      setTotalSets(initialValues.totalSets != null ? String(initialValues.totalSets) : '');
      setNotes(initialValues.notes ?? '');
    }
  }, [initialValues]);

  const handleSubmit = () => {
    const name = exerciseName.trim();
    if (!name) {
      onSubmit?.({ error: 'Exercise name is required' });
      return;
    }
    const totalRepsNum = totalReps === '' ? 0 : parseInt(totalReps, 10);
    const weightNum = weight === '' ? 0 : parseFloat(weight);
    const totalSetsNum = totalSets === '' ? 0 : parseInt(totalSets, 10);
    if (Number.isNaN(totalRepsNum) || totalRepsNum < 0) {
      onSubmit?.({ error: 'Total reps must be 0 or greater' });
      return;
    }
    if (Number.isNaN(weightNum) || weightNum < 0) {
      onSubmit?.({ error: 'Weight must be 0 or greater' });
      return;
    }
    if (Number.isNaN(totalSetsNum) || totalSetsNum < 0) {
      onSubmit?.({ error: 'Total sets must be 0 or greater' });
      return;
    }
    onSubmit?.({
      exerciseName: name,
      totalReps: totalRepsNum,
      weight: weightNum,
      totalSets: totalSetsNum,
      notes: notes.trim() || null,
    });
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ marginVertical: spacing.md }}
    >
      <View testID="exercise-form" style={[commonStyles.card, { marginHorizontal: spacing.md }]}>
        <Text style={[commonStyles.subtitle, { marginBottom: spacing.sm }]}>
          {initialValues ? 'Edit Exercise' : 'Add Exercise'}
        </Text>

        <Text style={commonStyles.label}>Exercise Name *</Text>
        <TextInput
          testID="exercise-name-input"
          style={commonStyles.input}
          value={exerciseName}
          onChangeText={setExerciseName}
          placeholder="e.g. Bench Press"
          maxLength={200}
          autoCapitalize="words"
        />

        <Text style={[commonStyles.label, { marginTop: spacing.sm }]}>Total Reps</Text>
        <TextInput
          testID="total-reps-input"
          style={commonStyles.input}
          value={totalReps}
          onChangeText={setTotalReps}
          placeholder="0"
          keyboardType="number-pad"
        />

        <Text style={[commonStyles.label, { marginTop: spacing.sm }]}>Weight (kg)</Text>
        <TextInput
          testID="weight-input"
          style={commonStyles.input}
          value={weight}
          onChangeText={setWeight}
          placeholder="0"
          keyboardType="decimal-pad"
        />

        <Text style={[commonStyles.label, { marginTop: spacing.sm }]}>Total Sets</Text>
        <TextInput
          testID="total-sets-input"
          style={commonStyles.input}
          value={totalSets}
          onChangeText={setTotalSets}
          placeholder="0"
          keyboardType="number-pad"
        />

        <Text style={[commonStyles.label, { marginTop: spacing.sm }]}>Notes (optional)</Text>
        <TextInput
          testID="exercise-notes-input"
          style={[commonStyles.input, { height: 60, textAlignVertical: 'top' }]}
          value={notes}
          onChangeText={setNotes}
          placeholder="Optional notes"
          multiline
          maxLength={1000}
        />

        <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md }}>
          <TouchableOpacity
            testID="exercise-cancel-button"
            style={[commonStyles.button, commonStyles.buttonSecondary, { flex: 1 }]}
            onPress={onCancel}
            disabled={loading}
          >
            <Text style={[commonStyles.buttonText, commonStyles.buttonSecondaryText]}>
              Cancel
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            testID="exercise-submit-button"
            style={[commonStyles.button, { flex: 1 }, loading && { opacity: 0.6 }]}
            onPress={handleSubmit}
            disabled={loading}
          >
            <Text style={commonStyles.buttonText}>{loading ? 'Saving...' : submitLabel}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

export default ExerciseForm;
