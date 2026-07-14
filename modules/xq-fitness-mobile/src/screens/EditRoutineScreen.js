import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Switch,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { updateRoutine } from '../services/api';
import { commonStyles, colors, spacing } from '../styles/common';

const EditRoutineScreen = ({ route, navigation }) => {
  const { routineId, routine } = route.params;
  const [name, setName] = useState(routine.name);
  const [description, setDescription] = useState(routine.description || '');
  const [isActive, setIsActive] = useState(routine.isActive);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim()) {
      Alert.alert('Validation Error', 'Please enter a routine name');
      return;
    }

    try {
      setLoading(true);
      await updateRoutine(routineId, {
        name: name.trim(),
        description: description.trim() || null,
        isActive,
      });
      Alert.alert('Success', 'Routine updated successfully', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      console.error('Error updating routine:', error);
      Alert.alert(
        'Error',
        error.response?.data?.message || 'Failed to update routine'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      testID="edit-routine-screen"
      style={commonStyles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={{ padding: spacing.md }}>
        <View style={{ marginBottom: spacing.md }}>
          <Text style={commonStyles.label}>Routine Name *</Text>
          <TextInput
            testID="routine-name-input"
            style={commonStyles.input}
            value={name}
            onChangeText={setName}
            placeholder="Enter routine name"
            maxLength={200}
          />
        </View>

        <View style={{ marginBottom: spacing.md }}>
          <Text style={commonStyles.label}>Description</Text>
          <TextInput
            testID="routine-description-input"
            style={[commonStyles.input, { height: 100, textAlignVertical: 'top' }]}
            value={description}
            onChangeText={setDescription}
            placeholder="Enter description (optional)"
            multiline
            numberOfLines={4}
            maxLength={1000}
          />
        </View>

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.lg }}>
          <Text style={commonStyles.label}>Active</Text>
          <Switch
            testID="routine-active-switch"
            value={isActive}
            onValueChange={setIsActive}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor={colors.white}
          />
        </View>

        <TouchableOpacity
          testID="submit-button"
          style={[commonStyles.button, loading && { opacity: 0.6 }]}
          onPress={handleSubmit}
          disabled={loading}
        >
          <Text style={commonStyles.buttonText}>
            {loading ? 'Updating...' : 'Update Routine'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default EditRoutineScreen;
