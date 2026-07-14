import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {
  getMuscleGroups,
  createWorkoutDay,
  updateWorkoutDay,
  createWorkoutDaySet,
  updateWorkoutDaySet,
  deleteWorkoutDaySet,
} from '../services/api';
import { commonStyles, colors, spacing } from '../styles/common';

const ManageWorkoutDayScreen = ({ route, navigation }) => {
  const { routineId, workoutDay, isEdit } = route.params;

  const [dayNumber, setDayNumber] = useState(workoutDay?.dayNumber?.toString() || '');
  const [dayName, setDayName] = useState(workoutDay?.dayName || '');
  const [notes, setNotes] = useState(workoutDay?.notes || '');
  const [muscleGroups, setMuscleGroups] = useState([]);
  const [selectedSets, setSelectedSets] = useState({});
  const [loading, setLoading] = useState(false);
  const [loadingMuscleGroups, setLoadingMuscleGroups] = useState(true);

  useEffect(() => {
    fetchMuscleGroups();
    if (isEdit && workoutDay?.sets) {
      // Initialize selected sets from existing workout day
      const sets = {};
      workoutDay.sets.forEach((set) => {
        sets[set.muscleGroup.id] = {
          setId: set.id,
          numberOfSets: set.numberOfSets.toString(),
        };
      });
      setSelectedSets(sets);
    }
  }, []);

  const fetchMuscleGroups = async () => {
    try {
      const data = await getMuscleGroups();
      setMuscleGroups(data);
    } catch (error) {
      console.error('Error fetching muscle groups:', error);
      Alert.alert('Error', 'Failed to load muscle groups');
    } finally {
      setLoadingMuscleGroups(false);
    }
  };

  const handleSetChange = (muscleGroupId, value) => {
    if (value === '' || value === '0') {
      // Remove the muscle group
      const newSets = { ...selectedSets };
      delete newSets[muscleGroupId];
      setSelectedSets(newSets);
    } else {
      setSelectedSets({
        ...selectedSets,
        [muscleGroupId]: {
          ...selectedSets[muscleGroupId],
          numberOfSets: value,
        },
      });
    }
  };

  const handleSubmit = async () => {
    // Validation
    if (!dayNumber || parseInt(dayNumber) < 1) {
      Alert.alert('Validation Error', 'Please enter a valid day number (1 or greater)');
      return;
    }
    if (!dayName.trim()) {
      Alert.alert('Validation Error', 'Please enter a day name');
      return;
    }

    const setsArray = Object.entries(selectedSets);
    if (setsArray.length === 0) {
      Alert.alert('Validation Error', 'Please select at least one muscle group and number of sets');
      return;
    }

    // Validate all sets have valid numbers
    for (const [_, data] of setsArray) {
      const sets = parseInt(data.numberOfSets);
      if (!sets || sets < 1) {
        Alert.alert('Validation Error', 'All selected muscle groups must have at least 1 set');
        return;
      }
    }

    try {
      setLoading(true);

      let workoutDayId = workoutDay?.id;

      // Create or update workout day
      if (isEdit) {
        await updateWorkoutDay(workoutDayId, {
          dayNumber: parseInt(dayNumber),
          dayName: dayName.trim(),
          notes: notes.trim() || null,
        });
      } else {
        const newDay = await createWorkoutDay({
          routineId: parseInt(routineId),
          dayNumber: parseInt(dayNumber),
          dayName: dayName.trim(),
          notes: notes.trim() || null,
        });
        workoutDayId = newDay.id;
      }

      // Handle sets - create, update, or delete
      if (isEdit) {
        // Track which sets to delete (existed before but not selected now)
        const existingSets = workoutDay.sets || [];
        for (const existingSet of existingSets) {
          const muscleGroupId = existingSet.muscleGroup.id;
          if (!selectedSets[muscleGroupId]) {
            // Delete this set
            await deleteWorkoutDaySet(existingSet.id);
          }
        }
      }

      // Create or update sets
      for (const [muscleGroupId, data] of Object.entries(selectedSets)) {
        const numberOfSets = parseInt(data.numberOfSets);
        if (data.setId) {
          // Update existing set using workoutDayId and muscleGroupId (more reliable than setId)
          await updateWorkoutDaySet(0, { numberOfSets }, workoutDayId, parseInt(muscleGroupId));
        } else {
          // Create new set
          await createWorkoutDaySet({
            workoutDayId,
            muscleGroupId: parseInt(muscleGroupId),
            numberOfSets,
          });
        }
      }

      Alert.alert(
        'Success',
        `Workout day ${isEdit ? 'updated' : 'created'} successfully`,
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      console.error('Error saving workout day:', error);
      Alert.alert(
        'Error',
        error.response?.data?.message || `Failed to ${isEdit ? 'update' : 'create'} workout day`
      );
    } finally {
      setLoading(false);
    }
  };

  if (loadingMuscleGroups) {
    return (
      <View style={commonStyles.centeredContainer} testID="loading-container">
        <ActivityIndicator size="large" color={colors.primary} testID="loading-indicator" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      testID="manage-workout-day-screen"
      style={commonStyles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={{ padding: spacing.md }}>
        <View style={{ marginBottom: spacing.md }}>
          <Text style={commonStyles.label}>Day Number *</Text>
          <TextInput
            testID="day-number-input"
            style={commonStyles.input}
            value={dayNumber}
            onChangeText={setDayNumber}
            placeholder="Enter day number (e.g., 1, 2, 3)"
            keyboardType="number-pad"
          />
        </View>

        <View style={{ marginBottom: spacing.md }}>
          <Text style={commonStyles.label}>Day Name *</Text>
          <TextInput
            testID="day-name-input"
            style={commonStyles.input}
            value={dayName}
            onChangeText={setDayName}
            placeholder="Enter day name (e.g., Push Day)"
            maxLength={100}
          />
        </View>

        <View style={{ marginBottom: spacing.md }}>
          <Text style={commonStyles.label}>Notes</Text>
          <TextInput
            testID="day-notes-input"
            style={[commonStyles.input, { height: 80, textAlignVertical: 'top' }]}
            value={notes}
            onChangeText={setNotes}
            placeholder="Enter notes (optional)"
            multiline
            numberOfLines={3}
            maxLength={1000}
          />
        </View>

        <Text style={[commonStyles.subtitle, { marginTop: spacing.md, marginBottom: spacing.sm }]}>
          Muscle Groups & Sets
        </Text>
        <Text style={[commonStyles.textSecondary, { marginBottom: spacing.md }]}>
          Select muscle groups and enter number of sets for each
        </Text>

        {muscleGroups.map((muscleGroup) => (
          <View
            key={muscleGroup.id}
            testID={`muscle-group-${muscleGroup.id}`}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingVertical: spacing.sm,
              borderBottomWidth: 1,
              borderBottomColor: colors.border,
            }}
          >
            <Text style={[commonStyles.text, { flex: 1 }]}>{muscleGroup.name}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <TextInput
                testID={`sets-input-${muscleGroup.id}`}
                style={[
                  commonStyles.input,
                  {
                    width: 80,
                    textAlign: 'center',
                    marginRight: spacing.sm,
                  },
                ]}
                value={selectedSets[muscleGroup.id]?.numberOfSets || ''}
                onChangeText={(value) => handleSetChange(muscleGroup.id, value)}
                placeholder="0"
                keyboardType="number-pad"
                maxLength={2}
              />
              <Text style={commonStyles.textSecondary}>sets</Text>
            </View>
          </View>
        ))}

        {isEdit && workoutDay?.id && (
          <TouchableOpacity
            testID="manage-exercises-button"
            onPress={() =>
              navigation.navigate('ManageExercise', {
                routineId: parseInt(routineId, 10),
                workoutDay: { ...workoutDay, sets: workoutDay?.sets || [] },
              })
            }
            style={[commonStyles.button, commonStyles.buttonSecondary, { marginTop: spacing.lg }]}
          >
            <Text style={[commonStyles.buttonText, commonStyles.buttonSecondaryText]}>
              Manage Exercises
            </Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          testID="submit-button"
          style={[commonStyles.button, { marginTop: spacing.xl }, loading && { opacity: 0.6 }]}
          onPress={handleSubmit}
          disabled={loading}
        >
          <Text style={commonStyles.buttonText}>
            {loading ? 'Saving...' : isEdit ? 'Update Workout Day' : 'Create Workout Day'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default ManageWorkoutDayScreen;
