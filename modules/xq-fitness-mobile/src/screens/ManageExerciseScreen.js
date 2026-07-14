import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import {
  getExercises,
  createExercise,
  updateExercise,
  deleteExercise,
} from '../services/api';
import { commonStyles, colors, spacing } from '../styles/common';
import ExerciseForm from '../components/ExerciseForm';

const ManageExerciseScreen = ({ route, navigation }) => {
  const { routineId, workoutDay: initialWorkoutDay } = route.params;
  const workoutDayId = initialWorkoutDay?.id;

  const [exercises, setExercises] = useState(initialWorkoutDay?.exercises ?? []);
  const [loading, setLoading] = useState(!(initialWorkoutDay?.exercises?.length > 0));
  const [showForm, setShowForm] = useState(false);
  const [editingExercise, setEditingExercise] = useState(null);
  const [selectedMuscleGroupId, setSelectedMuscleGroupId] = useState(null);
  const [saving, setSaving] = useState(false);

  const muscleGroupsFromSets = initialWorkoutDay?.sets?.map((s) => s.muscleGroup) ?? [];
  const firstMuscleGroupId = muscleGroupsFromSets[0]?.id ?? null;

  const fetchExercises = useCallback(async () => {
    if (!workoutDayId) return;
    try {
      const data = await getExercises(parseInt(workoutDayId, 10));
      setExercises(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching exercises:', error);
      Alert.alert('Error', 'Failed to load exercises');
      setExercises((prev) => (prev.length > 0 ? prev : []));
    } finally {
      setLoading(false);
    }
  }, [workoutDayId]);

  useEffect(() => {
    fetchExercises();
  }, [fetchExercises]);

  const handleAddExercise = () => {
    setSelectedMuscleGroupId(firstMuscleGroupId);
    setEditingExercise(null);
    setShowForm(true);
  };

  const handleAddExerciseForMuscleGroup = (muscleGroupId) => {
    setSelectedMuscleGroupId(muscleGroupId);
    setEditingExercise(null);
    setShowForm(true);
  };

  const handleEditExercise = (exercise) => {
    setEditingExercise(exercise);
    setSelectedMuscleGroupId(null);
    setShowForm(true);
  };

  const handleDeleteExercise = (exercise) => {
    Alert.alert(
      'Delete Exercise',
      `Delete "${exercise.exerciseName}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteExercise(exercise.id);
              Alert.alert('Success', 'Exercise deleted');
              fetchExercises();
            } catch (error) {
              console.error('Error deleting exercise:', error);
              Alert.alert('Error', error.response?.data?.message || 'Failed to delete exercise');
            }
          },
        },
      ]
    );
  };

  const handleFormSubmit = async (data) => {
    if (data.error) {
      Alert.alert('Validation Error', data.error);
      return;
    }
    setSaving(true);
    try {
      if (editingExercise) {
        await updateExercise(editingExercise.id, data);
        Alert.alert('Success', 'Exercise updated');
      } else {
        const muscleGroupId = selectedMuscleGroupId ?? firstMuscleGroupId;
        if (!muscleGroupId) {
          Alert.alert('Validation Error', 'No muscle group selected');
          setSaving(false);
          return;
        }
        await createExercise({
          workoutDayId: parseInt(workoutDayId, 10),
          muscleGroupId: parseInt(muscleGroupId, 10),
          ...data,
        });
        Alert.alert('Success', 'Exercise added');
      }
      setShowForm(false);
      setEditingExercise(null);
      setSelectedMuscleGroupId(null);
      fetchExercises();
    } catch (error) {
      console.error('Error saving exercise:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to save exercise');
    } finally {
      setSaving(false);
    }
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setEditingExercise(null);
    setSelectedMuscleGroupId(null);
  };

  if (loading) {
    return (
      <View style={commonStyles.centeredContainer} testID="loading-container">
        <ActivityIndicator size="large" color={colors.primary} testID="loading-indicator" />
      </View>
    );
  }

  const exercisesByMuscleGroup = muscleGroupsFromSets.length
    ? muscleGroupsFromSets.map((mg) => ({
        muscleGroup: mg,
        exercises: exercises.filter((e) => e.muscleGroupId === mg.id || e.muscleGroup?.id === mg.id),
      }))
    : [{ muscleGroup: { id: 0, name: 'Exercises' }, exercises }];

  return (
    <View style={commonStyles.container} testID="manage-exercise-screen">
      <ScrollView contentContainerStyle={{ padding: spacing.md }}>
        <View style={[commonStyles.card, { marginBottom: spacing.md }]}>
          <Text style={commonStyles.title}>
            {initialWorkoutDay?.dayName ?? 'Workout Day'} — Exercises
          </Text>
          <Text style={commonStyles.textSecondary}>
            Day {initialWorkoutDay?.dayNumber ?? ''}. Add or edit exercises per muscle group.
          </Text>
        </View>

        {showForm && (
          <ExerciseForm
            initialValues={editingExercise ? {
              exerciseName: editingExercise.exerciseName,
              totalReps: editingExercise.totalReps,
              weight: editingExercise.weight,
              totalSets: editingExercise.totalSets,
              notes: editingExercise.notes ?? '',
            } : null}
            onSubmit={handleFormSubmit}
            onCancel={handleFormCancel}
            submitLabel={editingExercise ? 'Update' : 'Add'}
            loading={saving}
          />
        )}

        {!showForm && (
          <TouchableOpacity
            testID="add-exercise-button"
            style={[commonStyles.button, { marginBottom: spacing.md }]}
            onPress={handleAddExercise}
          >
            <Text style={commonStyles.buttonText}>+ Add Exercise</Text>
          </TouchableOpacity>
        )}

        {exercisesByMuscleGroup.map(({ muscleGroup, exercises: list }) => (
          <View key={muscleGroup.id} style={[commonStyles.card, { marginBottom: spacing.md }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm }}>
              <Text style={commonStyles.subtitle}>{muscleGroup.name}</Text>
              {!showForm && muscleGroupsFromSets.some((mg) => mg.id === muscleGroup.id) && (
                <TouchableOpacity
                  testID={`add-exercise-button-${muscleGroup.id}`}
                  onPress={() => handleAddExerciseForMuscleGroup(muscleGroup.id)}
                >
                  <Text style={{ color: colors.primary, fontWeight: '600' }}>+ Add</Text>
                </TouchableOpacity>
              )}
            </View>
            {list.length === 0 ? (
              <Text style={commonStyles.textSecondary}>No exercises yet</Text>
            ) : (
              list.map((ex) => (
                <View
                  key={ex.id}
                  testID={`exercise-item-${ex.id}`}
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    paddingVertical: spacing.sm,
                    borderBottomWidth: 1,
                    borderBottomColor: colors.border,
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={commonStyles.text}>{ex.exerciseName}</Text>
                    <Text style={commonStyles.textSecondary}>
                      {ex.totalReps} reps · {ex.weight} kg · {ex.totalSets} sets
                    </Text>
                  </View>
                  <View style={{ flexDirection: 'row', gap: spacing.sm }}>
                    <TouchableOpacity
                      testID={`edit-exercise-${ex.id}`}
                      onPress={() => handleEditExercise(ex)}
                    >
                      <Text style={{ color: colors.primary, fontWeight: '600' }}>Edit</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      testID={`delete-exercise-${ex.id}`}
                      onPress={() => handleDeleteExercise(ex)}
                    >
                      <Text style={{ color: colors.danger, fontWeight: '600' }}>Delete</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

export default ManageExerciseScreen;
