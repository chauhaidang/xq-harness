/**
 * Component Test: Create Complete Routine
 *
 * This test validates the write service operations:
 * 1. Creating a routine
 * 2. Adding multiple workout days
 * 3. Adding sets to each workout day
 * 4. Verifying all data is created correctly via write service responses
 */

import { testData } from '../helpers/test-data';
import { ApiClient } from '../helpers/api-client';
import { CleanupHelper } from '../helpers/cleanup';
import { logger } from '@chauhaidang/xq-harness-common-kit';

const apiClient = new ApiClient(process.env.API_BASE_URL || 'http://localhost:8080/xq-fitness-write-service/api/v1');

describe('Component Test: Create Complete Routine', () => {
  let cleanup: CleanupHelper;

  beforeEach(() => {
    cleanup = new CleanupHelper(apiClient);
  });

  afterEach(async () => {
    if (cleanup) await cleanup.cleanupAll();
  });

  test('should create complete PPL routine with days and sets', async () => {
    const routine = await apiClient.createRoutine(testData.generateRoutine('PPL Split'));

    cleanup.trackRoutine(routine.id);
    const pushDay = await apiClient.createWorkoutDay(testData.generateWorkoutDay(routine.id, 1, 'Push Day'));

    cleanup.trackWorkoutDay(pushDay.id);
    const pushExercises = [
      { muscleGroup: testData.muscleGroups.CHEST, sets: 4 },
      { muscleGroup: testData.muscleGroups.SHOULDERS, sets: 3 },
      { muscleGroup: testData.muscleGroups.TRICEPS, sets: 3 },
    ];

    for (const exercise of pushExercises) {
      const sets = await apiClient.createWorkoutDaySets(
        testData.generateSets(pushDay.id, exercise.muscleGroup, exercise.sets)
      );
      cleanup.trackWorkoutDaySets(sets.id);
    }

    const pullDay = await apiClient.createWorkoutDay(testData.generateWorkoutDay(routine.id, 2, 'Pull Day'));
    cleanup.trackWorkoutDay(pullDay.id);
    const pullExercises = [
      { muscleGroup: testData.muscleGroups.BACK, sets: 4 },
      { muscleGroup: testData.muscleGroups.BICEPS, sets: 3 },
    ];

    for (const exercise of pullExercises) {
      const sets = await apiClient.createWorkoutDaySets(
        testData.generateSets(pullDay.id, exercise.muscleGroup, exercise.sets)
      );
      cleanup.trackWorkoutDaySets(sets.id);
    }

    const legDay = await apiClient.createWorkoutDay(testData.generateWorkoutDay(routine.id, 3, 'Leg Day'));
    cleanup.trackWorkoutDay(legDay.id);
    const legExercises = [
      { muscleGroup: testData.muscleGroups.LEGS, sets: 5 },
      { muscleGroup: testData.muscleGroups.CORE, sets: 3 },
    ];

    for (const exercise of legExercises) {
      const sets = await apiClient.createWorkoutDaySets(
        testData.generateSets(legDay.id, exercise.muscleGroup, exercise.sets)
      );
      cleanup.trackWorkoutDaySets(sets.id);
    }

    // Validate all resources were created
    expect(routine).toBeDefined();
    expect(routine.id).toBeDefined();
    expect(routine.name).toContain('PPL Split');
    expect(routine.isActive).toBe(true);

    expect(pushDay).toBeDefined();
    expect(pushDay.id).toBeDefined();
    expect(pushDay.routineId).toBe(routine.id);
    expect(pushDay.dayName).toBe('Push Day');
    expect(pushDay.dayNumber).toBe(1);

    expect(pullDay).toBeDefined();
    expect(pullDay.id).toBeDefined();
    expect(pullDay.routineId).toBe(routine.id);
    expect(pullDay.dayName).toBe('Pull Day');
    expect(pullDay.dayNumber).toBe(2);

    expect(legDay).toBeDefined();
    expect(legDay.id).toBeDefined();
    expect(legDay.routineId).toBe(routine.id);
    expect(legDay.dayName).toBe('Leg Day');
    expect(legDay.dayNumber).toBe(3);

    logger.info('✅ Complete PPL routine created successfully');
    logger.info(`Created: 1 routine, 3 workout days, 7 exercise sets`);
  });

  test('should handle routine creation with minimal data', async () => {
    logger.info('Testing minimal routine creation');

    const routine = await apiClient.createRoutine({
      name: 'Minimal Routine',
      isActive: true,
    });

    expect(routine).toBeDefined();
    expect(routine.id).toBeDefined();
    expect(routine.name).toBe('Minimal Routine');
    expect(routine.isActive).toBe(true);

    cleanup.trackRoutine(routine.id);
    logger.info('✅ Minimal routine created successfully');
  });
});
