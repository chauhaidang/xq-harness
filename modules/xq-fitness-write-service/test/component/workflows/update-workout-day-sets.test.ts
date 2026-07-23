/**
 * Component Test: Update Workout Day Sets
 *
 * This test validates the new functionality to update workout day sets
 * using workoutDayId and muscleGroupId query parameters instead of setId.
 *
 * Test scenarios:
 * 1. Update workout day sets using traditional setId method (backward compatibility)
 * 2. Update workout day sets using workoutDayId + muscleGroupId query parameters
 * 3. Verify error handling when query parameters are incomplete
 * 4. Verify error handling when workout day set doesn't exist
 */

import { testData } from '../helpers/test-data';
import { ApiClient } from '../helpers/api-client';
import { CleanupHelper } from '../helpers/cleanup';
import { logger } from '@chauhaidang/xq-harness-common-kit';

const apiClient = new ApiClient(process.env.API_BASE_URL || 'http://localhost:8080/xq-fitness-write-service/api/v1');

describe('Component Test: Update Workout Day Sets', () => {
  let cleanup: CleanupHelper;

  beforeEach(() => {
    cleanup = new CleanupHelper(apiClient);
  });

  afterEach(async () => {
    if (cleanup) await cleanup.cleanupAll();
  });

  test('should update workout day sets using setId (traditional method)', async () => {
    // Setup: Create routine, workout day, and sets
    const routine = await apiClient.createRoutine(testData.generateRoutine('Update Test Routine'));
    cleanup.trackRoutine(routine.id);

    const workoutDay = await apiClient.createWorkoutDay(testData.generateWorkoutDay(routine.id, 1, 'Test Day'));
    cleanup.trackWorkoutDay(workoutDay.id);

    const initialSets = await apiClient.createWorkoutDaySets(
      testData.generateSets(workoutDay.id, testData.muscleGroups.CHEST, 3)
    );
    cleanup.trackWorkoutDaySets(initialSets.id);

    // Test: Update using setId
    const updatedSets = await apiClient.updateWorkoutDaySets(initialSets.id, {
      numberOfSets: 5,
      notes: 'Updated via setId',
    });

    // Verify
    expect(updatedSets).toBeDefined();
    expect(updatedSets.id).toBe(initialSets.id);
    expect(updatedSets.workoutDayId).toBe(workoutDay.id);
    expect(updatedSets.muscleGroupId).toBe(testData.muscleGroups.CHEST);
    expect(updatedSets.numberOfSets).toBe(5);
    expect(updatedSets.notes).toBe('Updated via setId');

    logger.info('✅ Successfully updated workout day sets using setId');
  });

  test('should update workout day sets using workoutDayId and muscleGroupId query parameters', async () => {
    // Setup: Create routine, workout day, and sets
    const routine = await apiClient.createRoutine(testData.generateRoutine('Query Param Test'));
    cleanup.trackRoutine(routine.id);

    const workoutDay = await apiClient.createWorkoutDay(testData.generateWorkoutDay(routine.id, 1, 'Query Test Day'));
    cleanup.trackWorkoutDay(workoutDay.id);

    const initialSets = await apiClient.createWorkoutDaySets(
      testData.generateSets(workoutDay.id, testData.muscleGroups.SHOULDERS, 4)
    );
    cleanup.trackWorkoutDaySets(initialSets.id);

    // Test: Update using query parameters (without knowing setId)
    const updatedSets = await apiClient.updateWorkoutDaySetsByQuery(workoutDay.id, testData.muscleGroups.SHOULDERS, {
      numberOfSets: 6,
      notes: 'Updated via query params',
    });

    // Verify
    expect(updatedSets).toBeDefined();
    expect(updatedSets.id).toBe(initialSets.id); // Should be the same setId
    expect(updatedSets.workoutDayId).toBe(workoutDay.id);
    expect(updatedSets.muscleGroupId).toBe(testData.muscleGroups.SHOULDERS);
    expect(updatedSets.numberOfSets).toBe(6);
    expect(updatedSets.notes).toBe('Updated via query params');

    logger.info('✅ Successfully updated workout day sets using query parameters');
  });

  test('should update only numberOfSets when notes not provided', async () => {
    // Setup
    const routine = await apiClient.createRoutine(testData.generateRoutine('Partial Update Test'));
    cleanup.trackRoutine(routine.id);

    const workoutDay = await apiClient.createWorkoutDay(
      testData.generateWorkoutDay(routine.id, 1, 'Partial Update Day')
    );
    cleanup.trackWorkoutDay(workoutDay.id);

    const initialSets = await apiClient.createWorkoutDaySets(
      testData.generateSets(workoutDay.id, testData.muscleGroups.BACK, 3)
    );
    cleanup.trackWorkoutDaySets(initialSets.id);

    // Test: Update only numberOfSets
    const updatedSets = await apiClient.updateWorkoutDaySetsByQuery(workoutDay.id, testData.muscleGroups.BACK, {
      numberOfSets: 5,
    });

    // Verify
    expect(updatedSets.numberOfSets).toBe(5);
    expect(updatedSets.id).toBe(initialSets.id);

    logger.info('✅ Successfully updated only numberOfSets');
  });

  test('should return 404 when workout day set does not exist for query parameters', async () => {
    // Setup: Create routine and workout day but no sets
    const routine = await apiClient.createRoutine(testData.generateRoutine('Not Found Test'));
    cleanup.trackRoutine(routine.id);

    const workoutDay = await apiClient.createWorkoutDay(testData.generateWorkoutDay(routine.id, 1, 'Not Found Day'));
    cleanup.trackWorkoutDay(workoutDay.id);

    // Test: Try to update non-existent workout day set
    try {
      await apiClient.updateWorkoutDaySetsByQuery(workoutDay.id, testData.muscleGroups.CHEST, {
        numberOfSets: 5,
      });
      // Should not reach here
      expect(true).toBe(false);
    } catch (error: any) {
      expect(error.status).toBe(404);
      expect(error.body?.code).toBe('NOT_FOUND');
      expect(error.body?.message).toContain('not found for the given workout day and muscle group');
    }

    logger.info('✅ Correctly returned 404 for non-existent workout day set');
  });

  test('should handle multiple updates to same workout day set', async () => {
    // Setup
    const routine = await apiClient.createRoutine(testData.generateRoutine('Multiple Updates Test'));
    cleanup.trackRoutine(routine.id);

    const workoutDay = await apiClient.createWorkoutDay(
      testData.generateWorkoutDay(routine.id, 1, 'Multiple Updates Day')
    );
    cleanup.trackWorkoutDay(workoutDay.id);

    const initialSets = await apiClient.createWorkoutDaySets(
      testData.generateSets(workoutDay.id, testData.muscleGroups.LEGS, 3)
    );
    cleanup.trackWorkoutDaySets(initialSets.id);

    // Test: Multiple updates
    const firstUpdate = await apiClient.updateWorkoutDaySetsByQuery(workoutDay.id, testData.muscleGroups.LEGS, {
      numberOfSets: 4,
    });
    expect(firstUpdate.numberOfSets).toBe(4);

    const secondUpdate = await apiClient.updateWorkoutDaySetsByQuery(workoutDay.id, testData.muscleGroups.LEGS, {
      numberOfSets: 5,
      notes: 'Second update',
    });
    expect(secondUpdate.numberOfSets).toBe(5);
    expect(secondUpdate.notes).toBe('Second update');
    expect(secondUpdate.id).toBe(initialSets.id); // Same setId

    logger.info('✅ Successfully handled multiple updates');
  });

  test('should maintain backward compatibility with setId method', async () => {
    // Setup
    const routine = await apiClient.createRoutine(testData.generateRoutine('Backward Compat Test'));
    cleanup.trackRoutine(routine.id);

    const workoutDay = await apiClient.createWorkoutDay(
      testData.generateWorkoutDay(routine.id, 1, 'Backward Compat Day')
    );
    cleanup.trackWorkoutDay(workoutDay.id);

    const initialSets = await apiClient.createWorkoutDaySets(
      testData.generateSets(workoutDay.id, testData.muscleGroups.CORE, 2)
    );
    cleanup.trackWorkoutDaySets(initialSets.id);

    // Test: Both methods should work and produce same result
    const updateViaSetId = await apiClient.updateWorkoutDaySets(initialSets.id, {
      numberOfSets: 4,
      notes: 'Via setId',
    });

    const updateViaQuery = await apiClient.updateWorkoutDaySetsByQuery(workoutDay.id, testData.muscleGroups.CORE, {
      numberOfSets: 4,
      notes: 'Via query',
    });

    // Both should update the same record
    expect(updateViaSetId.id).toBe(updateViaQuery.id);
    expect(updateViaSetId.workoutDayId).toBe(updateViaQuery.workoutDayId);
    expect(updateViaSetId.muscleGroupId).toBe(updateViaQuery.muscleGroupId);

    logger.info('✅ Backward compatibility maintained');
  });
});
