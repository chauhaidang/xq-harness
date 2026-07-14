import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getRoutineById, deleteWorkoutDay, createWeeklySnapshot } from '../services/api';
import { commonStyles, colors, spacing } from '../styles/common';
import Toast from '../components/Toast';

/**
 * Compute muscle group total sets for display: from exercises (sum of totalSets per muscle group)
 * when available, otherwise fall back to legacy workout_day_sets (numberOfSets).
 * API returns day.sets (legacy) and day.exercises (each has totalSets, muscleGroupId, muscleGroup).
 */
const getMuscleGroupTotalsForDay = (day) => {
  const byMg = {}; // muscleGroupId -> { name, totalSetsFromExercises, legacySets }
  if (day.sets && day.sets.length > 0) {
    day.sets.forEach((s) => {
      const id = s.muscleGroup?.id ?? s.muscleGroupId;
      if (id != null) {
        byMg[id] = {
          name: s.muscleGroup?.name ?? `Muscle group ${id}`,
          totalSetsFromExercises: 0,
          legacySets: s.numberOfSets ?? 0,
        };
      }
    });
  }
  if (day.exercises && day.exercises.length > 0) {
    day.exercises.forEach((ex) => {
      const id = ex.muscleGroupId ?? ex.muscleGroup?.id;
      if (id != null) {
        if (!byMg[id]) {
          byMg[id] = {
            name: ex.muscleGroup?.name ?? `Muscle group ${id}`,
            totalSetsFromExercises: 0,
            legacySets: 0,
          };
        }
        byMg[id].totalSetsFromExercises =
          (byMg[id].totalSetsFromExercises || 0) + (ex.totalSets ?? 0);
      }
    });
  }
  return Object.entries(byMg).map(([id, v]) => ({
    muscleGroupId: parseInt(id, 10),
    name: v.name,
    totalSets: v.totalSetsFromExercises > 0 ? v.totalSetsFromExercises : v.legacySets,
  }));
};

const RoutineDetailScreen = ({ route, navigation }) => {
  const { routineId } = route.params;
  const [routine, setRoutine] = useState(null);
  const [loading, setLoading] = useState(true);
  const [creatingSnapshot, setCreatingSnapshot] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });

  const fetchRoutineDetail = async () => {
    try {
      setLoading(true);
      const data = await getRoutineById(routineId);
      setRoutine(data);
    } catch (error) {
      console.error('Error fetching routine details:', error);
      Alert.alert('Error', 'Failed to load routine details');
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchRoutineDetail();
    }, [routineId])
  );

  const handleDeleteDay = (dayId, dayName) => {
    Alert.alert(
      'Delete Workout Day',
      `Are you sure you want to delete "${dayName}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteWorkoutDay(dayId);
              Alert.alert('Success', 'Workout day deleted successfully');
              fetchRoutineDetail();
            } catch (error) {
              console.error('Error deleting workout day:', error);
              Alert.alert('Error', 'Failed to delete workout day');
            }
          },
        },
      ]
    );
  };

  const handleCreateSnapshot = async () => {
    try {
      setCreatingSnapshot(true);
      await createWeeklySnapshot(routineId);
      setToast({ visible: true, message: 'Weekly snapshot created successfully', type: 'success' });
    } catch (error) {
      console.error('Error creating snapshot:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to create snapshot';
      Alert.alert('Error', errorMessage, [{ text: 'OK' }]);
    } finally {
      setCreatingSnapshot(false);
    }
  };

  if (loading) {
    return (
      <View style={commonStyles.centeredContainer} testID="loading-container">
        <ActivityIndicator size="large" color={colors.primary} testID="loading-indicator" />
      </View>
    );
  }

  if (!routine) {
    return (
      <View style={commonStyles.centeredContainer} testID="not-found-container">
        <Text style={commonStyles.textSecondary}>Routine not found</Text>
      </View>
    );
  }

  return (
    <View style={commonStyles.container} testID="routine-detail-screen">
      <Toast
        message={toast.message}
        visible={toast.visible}
        type={toast.type}
        onHide={() => setToast({ visible: false, message: '', type: 'success' })}
      />
      <ScrollView contentContainerStyle={{ paddingVertical: spacing.md }}>
        {/* Routine Info */}
        <View style={[commonStyles.card, { marginBottom: spacing.lg }]} testID="routine-info">
          <Text testID="routine-name" style={commonStyles.title}>{routine.name}</Text>
          {routine.description && (
            <Text style={[commonStyles.text, { marginBottom: spacing.sm }]}>
              {routine.description}
            </Text>
          )}
          <Text style={commonStyles.textSecondary}>
            Status: {routine.isActive ? 'Active' : 'Inactive'}
          </Text>
          <TouchableOpacity
            testID="create-snapshot-button"
            onPress={handleCreateSnapshot}
            disabled={creatingSnapshot}
            style={[
              commonStyles.button,
              { marginTop: spacing.md },
              creatingSnapshot && { opacity: 0.6 },
            ]}
            accessibilityState={{ disabled: creatingSnapshot }}
          >
            {creatingSnapshot ? (
              <ActivityIndicator size="small" color={colors.white} />
            ) : (
              <Text style={commonStyles.buttonText}>Create Snapshot</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Workout Days Section */}
        <View style={{ marginHorizontal: spacing.md, marginBottom: spacing.md }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm }}>
            <Text style={commonStyles.subtitle}>Workout Days</Text>
            <TouchableOpacity
              testID="add-workout-day-button"
              onPress={() =>
                navigation.navigate('ManageWorkoutDay', {
                  routineId: routine.id,
                  isEdit: false,
                })
              }
            >
              <Text style={{ color: colors.primary, fontWeight: '600', fontSize: 16 }}>+ Add Day</Text>
            </TouchableOpacity>
          </View>
          {routine.workoutDays && routine.workoutDays.length > 0 && (
            <Text style={[commonStyles.textSecondary, { marginBottom: spacing.sm, fontSize: 13 }]}>
              Tap &quot;Exercises&quot; on a day to add or edit exercises (name, reps, weight, sets).
            </Text>
          )}
        </View>

        {routine.workoutDays && routine.workoutDays.length > 0 ? (
          routine.workoutDays
            .sort((a, b) => a.dayNumber - b.dayNumber)
            .map((day) => (
              <View key={day.id} testID={`workout-day-${day.id}`} style={[commonStyles.card, { marginBottom: spacing.sm }]}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.sm }}>
                  <View style={{ flex: 1 }}>
                    <Text testID={`day-name-${day.id}`} style={[commonStyles.subtitle, { marginBottom: spacing.xs }]}>
                      Day {day.dayNumber}: {day.dayName}
                    </Text>
                    {day.notes && (
                      <Text style={commonStyles.textSecondary}>{day.notes}</Text>
                    )}
                  </View>
                  <View style={{ flexDirection: 'row', gap: spacing.sm }}>
                    <TouchableOpacity
                      testID={`exercises-day-${day.id}`}
                      onPress={() =>
                        navigation.navigate('ManageExercise', {
                          routineId: routine.id,
                          workoutDay: day,
                        })
                      }
                      style={{ padding: spacing.xs }}
                    >
                      <Text style={{ color: colors.primary, fontWeight: '600' }}>Exercises</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      testID={`edit-day-${day.id}`}
                      onPress={() =>
                        navigation.navigate('ManageWorkoutDay', {
                          routineId: routine.id,
                          workoutDay: day,
                          isEdit: true,
                        })
                      }
                      style={{ padding: spacing.xs }}
                    >
                      <Text style={{ color: colors.primary, fontWeight: '600' }}>Edit</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      testID={`delete-day-${day.id}`}
                      onPress={() => handleDeleteDay(day.id, day.dayName)}
                      style={{ padding: spacing.xs }}
                    >
                      <Text style={{ color: colors.danger, fontWeight: '600' }}>Delete</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Muscle Groups and total sets (from exercises when present, else legacy sets) */}
                {(() => {
                  const muscleGroupTotals = getMuscleGroupTotalsForDay(day);
                  if (muscleGroupTotals.length === 0) return null;
                  return (
                    <View style={{ marginTop: spacing.sm, paddingTop: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border }}>
                      <Text style={[commonStyles.text, { fontWeight: '600', marginBottom: spacing.xs }]}>
                        Muscle Groups:
                      </Text>
                      {muscleGroupTotals.map((mg) => (
                        <View key={mg.muscleGroupId} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing.xs }}>
                          <Text style={commonStyles.text}>{mg.name}</Text>
                          <Text style={[commonStyles.text, { fontWeight: '600', color: colors.primary }]}>
                            {mg.totalSets} sets
                          </Text>
                        </View>
                      ))}
                    </View>
                  );
                })()}
              </View>
            ))
        ) : (
          <View style={[commonStyles.card, { alignItems: 'center' }]} testID="no-workout-days">
            <Text style={commonStyles.textSecondary}>No workout days yet</Text>
            <Text style={[commonStyles.textSecondary, { marginTop: spacing.xs, fontSize: 13 }]}>
              Add a workout day below to manage exercises (name, reps, weight, sets).
            </Text>
            <TouchableOpacity
              testID="add-first-day-button"
              onPress={() =>
                navigation.navigate('ManageWorkoutDay', {
                  routineId: routine.id,
                  isEdit: false,
                })
              }
              style={[commonStyles.button, { marginTop: spacing.md }]}
            >
              <Text style={commonStyles.buttonText}>Add First Day</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

export default RoutineDetailScreen;
