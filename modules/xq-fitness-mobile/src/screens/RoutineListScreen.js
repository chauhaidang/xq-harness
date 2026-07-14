import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getRoutines, deleteRoutine } from '../services/api';
import { commonStyles, colors, spacing } from '../styles/common';

const RoutineListScreen = ({ navigation }) => {
  const [routines, setRoutines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchRoutines = async () => {
    try {
      setLoading(true);
      const data = await getRoutines();
      setRoutines(data);
    } catch (error) {
      console.error('Error fetching routines:', error);
      Alert.alert('Error', 'Failed to load routines. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchRoutines();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchRoutines();
  };

  const handleDelete = (routineId, routineName) => {
    Alert.alert(
      'Delete Routine',
      `Are you sure you want to delete "${routineName}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteRoutine(routineId);
              Alert.alert('Success', 'Routine deleted successfully');
              fetchRoutines();
            } catch (error) {
              console.error('Error deleting routine:', error);
              Alert.alert('Error', 'Failed to delete routine');
            }
          },
        },
      ]
    );
  };

  const renderRoutine = ({ item }) => (
    <View testID={`routine-item-${item.id}`} style={commonStyles.card}>
      <TouchableOpacity
        testID={`routine-item-touchable-${item.id}`}
        onPress={() => navigation.navigate('RoutineDetail', { routineId: item.id })}
        activeOpacity={0.7}
      >
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View style={{ flex: 1 }}>
            <Text testID={`routine-name-${item.id}`} style={commonStyles.subtitle}>{item.name}</Text>
            {item.description && (
              <Text style={commonStyles.textSecondary} numberOfLines={2}>
                {item.description}
              </Text>
            )}
            <View style={{ marginTop: spacing.xs }}>
              <Text style={[commonStyles.textSecondary, { fontSize: 12 }]}>
                {item.isActive ? '● Active' : '○ Inactive'}
              </Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
      <View style={{ flexDirection: 'row', gap: spacing.sm, alignItems: 'center', marginTop: spacing.sm, justifyContent: 'flex-end' }}>
        <TouchableOpacity
          testID={`report-routine-${item.id}`}
          accessibilityLabel={`View weekly report for routine ${item.name}`}
          accessibilityRole="button"
          onPress={() => navigation.navigate('WeeklyReport', { routineId: item.id })}
          style={{ 
            minWidth: 44,
            minHeight: 44,
            paddingHorizontal: spacing.md,
            paddingVertical: spacing.sm,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ color: colors.secondary, fontWeight: '600' }}>Report</Text>
        </TouchableOpacity>
        <TouchableOpacity
          testID={`edit-routine-${item.id}`}
          accessibilityLabel={`Edit routine ${item.name}`}
          accessibilityRole="button"
          onPress={() => navigation.navigate('EditRoutine', { routineId: item.id, routine: item })}
          style={{ 
            minWidth: 44,
            minHeight: 44,
            paddingHorizontal: spacing.md,
            paddingVertical: spacing.sm,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ color: colors.primary, fontWeight: '600' }}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity
          testID={`delete-routine-${item.id}`}
          accessibilityLabel={`Delete routine ${item.name}`}
          accessibilityRole="button"
          accessibilityHint="Double tap to delete this routine"
          onPress={() => handleDelete(item.id, item.name)}
          style={{ 
            minWidth: 44,
            minHeight: 44,
            paddingHorizontal: spacing.md,
            paddingVertical: spacing.sm,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: colors.danger + '15', // Light red background for better visibility
            borderRadius: 6,
          }}
        >
          <Text style={{ color: colors.danger, fontWeight: '600', fontSize: 14 }}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading && !refreshing) {
    return (
      <View style={commonStyles.centeredContainer} testID="loading-container">
        <ActivityIndicator size="large" color={colors.primary} testID="loading-indicator" />
      </View>
    );
  }

  return (
    <View style={commonStyles.container} testID="routine-list-screen">
      <FlatList
        testID="routine-list"
        data={routines}
        renderItem={renderRoutine}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={{ paddingVertical: spacing.md }}
        ListEmptyComponent={
          <View style={{ padding: spacing.xl, alignItems: 'center' }} testID="empty-state">
            <Text style={commonStyles.textSecondary}>No routines found</Text>
            <Text style={[commonStyles.textSecondary, { marginTop: spacing.sm }]}>
              Tap the + button to create your first routine
            </Text>
          </View>
        }
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
        }
      />
      <TouchableOpacity
        testID="create-routine-button"
        style={{
          position: 'absolute',
          bottom: spacing.lg,
          right: spacing.lg,
          width: 56,
          height: 56,
          borderRadius: 28,
          backgroundColor: colors.primary,
          alignItems: 'center',
          justifyContent: 'center',
          shadowColor: colors.black,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.3,
          shadowRadius: 4,
          elevation: 5,
        }}
        onPress={() => navigation.navigate('CreateRoutine')}
      >
        <Text style={{ color: colors.white, fontSize: 32, fontWeight: 'bold' }}>+</Text>
      </TouchableOpacity>
    </View>
  );
};

export default RoutineListScreen;
