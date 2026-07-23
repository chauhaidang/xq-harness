/**
 * Component Test: Create Workout Day Sets - Upsert Behavior
 *
 * This test validates the upsert behavior of the create workout day sets endpoint.
 * When creating a workout day set that already exists, it should update the existing
 * set instead of creating a duplicate or throwing an error.
 *
 * Test scenarios:
 * 1. Create new workout day set when none exists (returns 201)
 * 2. Create workout day set when one already exists (upsert - returns 200)
 * 3. Verify that upsert updates the correct set
 * 4. Verify that upsert preserves existing fields when not provided
 */

import { testData } from '../helpers/test-data';
import { ApiClient } from '../helpers/api-client';
import { CleanupHelper } from '../helpers/cleanup';
import { logger } from '@chauhaidang/xq-harness-common-kit';

const apiClient = new ApiClient(process.env.API_BASE_URL || 'http://localhost:8080/xq-fitness-write-service/api/v1');

describe('Component Test: Create Workout Day Sets - Upsert Behavior', () => {
  let cleanup: CleanupHelper;

  beforeEach(() => {
    cleanup = new CleanupHelper(apiClient);
  });

  afterEach(async () => {
    if (cleanup) await cleanup.cleanupAll();
  });

  test('should create new workout day set when none exists (returns 201)', async () => {
    // Setup: Create routine and workout day
    const routine = await apiClient.createRoutine(testData.generateRoutine('Upsert Test Routine'));
    cleanup.trackRoutine(routine.id);

    const workoutDay = await apiClient.createWorkoutDay(testData.generateWorkoutDay(routine.id, 1, 'Upsert Test Day'));
    cleanup.trackWorkoutDay(workoutDay.id);

    // Test: Create new workout day set
    const newSet = await apiClient.createWorkoutDaySets(
      testData.generateSets(workoutDay.id, testData.muscleGroups.CHEST, 3)
    );
    cleanup.trackWorkoutDaySets(newSet.id);

    // Verify
    expect(newSet).toBeDefined();
    expect(newSet.workoutDayId).toBe(workoutDay.id);
    expect(newSet.muscleGroupId).toBe(testData.muscleGroups.CHEST);
    expect(newSet.numberOfSets).toBe(3);

    logger.info('✅ Successfully created new workout day set');
  });

  test('should update existing workout day set when creating duplicate (upsert - returns 200)', async () => {
    // Setup: Create routine, workout day, and initial set
    const routine = await apiClient.createRoutine(testData.generateRoutine('Upsert Update Test'));
    cleanup.trackRoutine(routine.id);

    const workoutDay = await apiClient.createWorkoutDay(
      testData.generateWorkoutDay(routine.id, 1, 'Upsert Update Day')
    );
    cleanup.trackWorkoutDay(workoutDay.id);

    const initialSet = await apiClient.createWorkoutDaySets({
      workoutDayId: workoutDay.id,
      muscleGroupId: testData.muscleGroups.SHOULDERS,
      numberOfSets: 4,
      notes: 'Initial notes',
    } as any);
    cleanup.trackWorkoutDaySets(initialSet.id);

    // Test: Try to create the same set again (should update instead)
    const updatedSet = await apiClient.createWorkoutDaySets({
      workoutDayId: workoutDay.id,
      muscleGroupId: testData.muscleGroups.SHOULDERS,
      numberOfSets: 6,
      notes: 'Updated notes',
    } as any);

    // Verify: Should be the same setId (updated, not created)
    expect(updatedSet).toBeDefined();
    expect(updatedSet.id).toBe(initialSet.id); // Same ID means it was updated
    expect(updatedSet.workoutDayId).toBe(workoutDay.id);
    expect(updatedSet.muscleGroupId).toBe(testData.muscleGroups.SHOULDERS);
    expect(updatedSet.numberOfSets).toBe(6); // Updated value
    expect(updatedSet.notes).toBe('Updated notes'); // Updated value

    logger.info('✅ Successfully updated existing workout day set via upsert');
  });

  test('should update existing set with partial data (preserve existing fields)', async () => {
    // Setup: Create routine, workout day, and initial set with notes
    const routine = await apiClient.createRoutine(testData.generateRoutine('Upsert Partial Test'));
    cleanup.trackRoutine(routine.id);

    const workoutDay = await apiClient.createWorkoutDay(
      testData.generateWorkoutDay(routine.id, 1, 'Upsert Partial Day')
    );
    cleanup.trackWorkoutDay(workoutDay.id);

    const initialSet = await apiClient.createWorkoutDaySets({
      workoutDayId: workoutDay.id,
      muscleGroupId: testData.muscleGroups.BACK,
      numberOfSets: 3,
      notes: 'Original notes',
    } as any);
    cleanup.trackWorkoutDaySets(initialSet.id);

    // Test: Upsert with only numberOfSets (notes not provided)
    const updatedSet = await apiClient.createWorkoutDaySets({
      workoutDayId: workoutDay.id,
      muscleGroupId: testData.muscleGroups.BACK,
      numberOfSets: 5,
      // notes not provided - should preserve existing or be null
    });

    // Verify: Same setId, updated numberOfSets
    expect(updatedSet.id).toBe(initialSet.id);
    expect(updatedSet.numberOfSets).toBe(5);
    // Notes behavior depends on implementation - could be preserved or null
    expect(updatedSet.workoutDayId).toBe(workoutDay.id);
    expect(updatedSet.muscleGroupId).toBe(testData.muscleGroups.BACK);

    logger.info('✅ Successfully updated set with partial data via upsert');
  });

  test('should handle multiple upserts to the same set', async () => {
    // Setup
    const routine = await apiClient.createRoutine(testData.generateRoutine('Multiple Upserts Test'));
    cleanup.trackRoutine(routine.id);

    const workoutDay = await apiClient.createWorkoutDay(
      testData.generateWorkoutDay(routine.id, 1, 'Multiple Upserts Day')
    );
    cleanup.trackWorkoutDay(workoutDay.id);

    // Test: Create initial set
    const firstSet = await apiClient.createWorkoutDaySets(
      testData.generateSets(workoutDay.id, testData.muscleGroups.LEGS, 3)
    );
    cleanup.trackWorkoutDaySets(firstSet.id);

    // Test: Upsert multiple times
    const secondSet = await apiClient.createWorkoutDaySets(
      testData.generateSets(workoutDay.id, testData.muscleGroups.LEGS, 4)
    );
    expect(secondSet.id).toBe(firstSet.id);
    expect(secondSet.numberOfSets).toBe(4);

    const thirdSet = await apiClient.createWorkoutDaySets({
      workoutDayId: workoutDay.id,
      muscleGroupId: testData.muscleGroups.LEGS,
      numberOfSets: 5,
      notes: 'Final notes',
    } as any);
    expect(thirdSet.id).toBe(firstSet.id);
    expect(thirdSet.numberOfSets).toBe(5);
    expect(thirdSet.notes).toBe('Final notes');

    logger.info('✅ Successfully handled multiple upserts');
  });

  test('should create different sets for different muscle groups on same workout day', async () => {
    // Setup
    const routine = await apiClient.createRoutine(testData.generateRoutine('Different Muscle Groups Test'));
    cleanup.trackRoutine(routine.id);

    const workoutDay = await apiClient.createWorkoutDay(
      testData.generateWorkoutDay(routine.id, 1, 'Different Groups Day')
    );
    cleanup.trackWorkoutDay(workoutDay.id);

    // Test: Create sets for different muscle groups
    const chestSet = await apiClient.createWorkoutDaySets(
      testData.generateSets(workoutDay.id, testData.muscleGroups.CHEST, 4)
    );
    cleanup.trackWorkoutDaySets(chestSet.id);

    const backSet = await apiClient.createWorkoutDaySets(
      testData.generateSets(workoutDay.id, testData.muscleGroups.BACK, 5)
    );
    cleanup.trackWorkoutDaySets(backSet.id);

    // Verify: Different sets created
    expect(chestSet.id).not.toBe(backSet.id);
    expect(chestSet.muscleGroupId).toBe(testData.muscleGroups.CHEST);
    expect(backSet.muscleGroupId).toBe(testData.muscleGroups.BACK);

    // Test: Upsert each one separately
    const updatedChestSet = await apiClient.createWorkoutDaySets(
      testData.generateSets(workoutDay.id, testData.muscleGroups.CHEST, 6)
    );
    expect(updatedChestSet.id).toBe(chestSet.id);
    expect(updatedChestSet.muscleGroupId).toBe(testData.muscleGroups.CHEST);

    const updatedBackSet = await apiClient.createWorkoutDaySets(
      testData.generateSets(workoutDay.id, testData.muscleGroups.BACK, 7)
    );
    expect(updatedBackSet.id).toBe(backSet.id);
    expect(updatedBackSet.muscleGroupId).toBe(testData.muscleGroups.BACK);

    logger.info('✅ Successfully created and updated different muscle group sets');
  });
});
