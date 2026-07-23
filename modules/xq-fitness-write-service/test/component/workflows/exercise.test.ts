/**
 * Component Test: Exercise CRUD
 *
 * Validates create, get, update, delete for exercises (Write Service).
 * TDD: Run and confirm tests fail until implementation is in place.
 *
 * API: POST/GET/PUT/DELETE /api/v1/exercises (and /exercises/:id).
 * Request body: workoutDayId, muscleGroupId, exerciseName, totalReps, weight, totalSets, notes?.
 *
 * Test scenarios:
 * 1. POST  – create exercise (201), assert id and all fields returned
 * 2. GET   – get exercise by ID (200), assert fields match created
 * 3. PUT   – partial update (200), assert updated fields and unchanged fields preserved
 * 4. DELETE – delete exercise (204), assert subsequent GET throws
 */

import { testData } from '../helpers/test-data';
import { ApiClient } from '../helpers/api-client';
import { CleanupHelper } from '../helpers/cleanup';
import { logger } from '@chauhaidang/xq-harness-common-kit';

const apiClient = new ApiClient(process.env.API_BASE_URL || 'http://localhost:8080/xq-fitness-write-service/api/v1');

describe('Component Test: Exercise CRUD', () => {
  let cleanup: CleanupHelper | undefined;

  beforeEach(() => {
    cleanup = new CleanupHelper(apiClient);
  });

  afterEach(async () => {
    if (cleanup) await cleanup.cleanupAll();
  });

  describe('POST /exercises', () => {
    test('should create exercise (returns 201) with workoutDayId, muscleGroupId, name, reps, weight, sets', async () => {
      const routine = await apiClient.createRoutine(testData.generateRoutine('Exercise CRUD Routine'));
      cleanup!.trackRoutine(routine.id);

      const workoutDay = await apiClient.createWorkoutDay(testData.generateWorkoutDay(routine.id, 1, 'Push Day'));
      cleanup!.trackWorkoutDay(workoutDay.id);

      const exercise = await apiClient.createExercise(
        testData.generateExercise(workoutDay.id, testData.muscleGroups.CHEST, 'Bench Press', 30, 135, 3)
      );
      cleanup!.trackExercise(exercise.id);

      expect(exercise).toBeDefined();
      expect(exercise.id).toBeDefined();
      expect(exercise.workoutDayId).toBe(workoutDay.id);
      expect(exercise.muscleGroupId).toBe(testData.muscleGroups.CHEST);
      expect(exercise.exerciseName).toBe('Bench Press');
      expect(exercise.totalReps).toBe(30);
      expect(exercise.weight).toBe(135);
      expect(exercise.totalSets).toBe(3);

      logger.info('✅ Successfully created exercise');
    });
  });

  describe('GET /exercises/:id', () => {
    test('should get exercise by ID (returns 200) and return same exerciseName, totalReps, weight, totalSets', async () => {
      const routine = await apiClient.createRoutine(testData.generateRoutine('Get Exercise Routine'));
      cleanup!.trackRoutine(routine.id);

      const workoutDay = await apiClient.createWorkoutDay(testData.generateWorkoutDay(routine.id, 1, 'Pull Day'));
      cleanup!.trackWorkoutDay(workoutDay.id);

      const created = await apiClient.createExercise(
        testData.generateExercise(workoutDay.id, testData.muscleGroups.BACK, 'Deadlift', 10, 225, 3)
      );
      cleanup!.trackExercise(created.id);

      const fetched = await apiClient.getExercise(created.id);

      expect(fetched).toBeDefined();
      expect(fetched.id).toBe(created.id);
      expect(fetched.exerciseName).toBe('Deadlift');
      expect(fetched.totalReps).toBe(10);
      expect(fetched.weight).toBe(225);
      expect(fetched.totalSets).toBe(3);

      logger.info('✅ Successfully got exercise by ID');
    });
  });

  describe('PUT /exercises/:id', () => {
    test('should update exercise (partial update, returns 200) and preserve exerciseName and totalSets', async () => {
      const routine = await apiClient.createRoutine(testData.generateRoutine('Update Exercise Routine'));
      cleanup!.trackRoutine(routine.id);

      const workoutDay = await apiClient.createWorkoutDay(testData.generateWorkoutDay(routine.id, 1, 'Leg Day'));
      cleanup!.trackWorkoutDay(workoutDay.id);

      const created = await apiClient.createExercise(
        testData.generateExercise(workoutDay.id, testData.muscleGroups.LEGS, 'Squat', 25, 185, 4)
      );
      cleanup!.trackExercise(created.id);

      const updated = await apiClient.updateExercise(created.id, {
        totalReps: 30,
        weight: 195,
      });

      expect(updated).toBeDefined();
      expect(updated.id).toBe(created.id);
      expect(updated.exerciseName).toBe('Squat');
      expect(updated.totalReps).toBe(30);
      expect(updated.weight).toBe(195);
      expect(updated.totalSets).toBe(4);

      logger.info('✅ Successfully updated exercise');
    });
  });

  describe('Same workout day, same muscle group', () => {
    test('should allow two exercises for the same muscle group on one workout day', async () => {
      const routine = await apiClient.createRoutine(testData.generateRoutine('Same Muscle Group Routine'));
      cleanup!.trackRoutine(routine.id);

      const workoutDay = await apiClient.createWorkoutDay(testData.generateWorkoutDay(routine.id, 1, 'Push Day'));
      cleanup!.trackWorkoutDay(workoutDay.id);

      const bench = await apiClient.createExercise(
        testData.generateExercise(workoutDay.id, testData.muscleGroups.CHEST, 'Bench Press', 30, 135, 3)
      );
      cleanup!.trackExercise(bench.id);

      const incline = await apiClient.createExercise(
        testData.generateExercise(workoutDay.id, testData.muscleGroups.CHEST, 'Incline Dumbbell Press', 24, 80, 3)
      );
      cleanup!.trackExercise(incline.id);

      const fetchedBench = await apiClient.getExercise(bench.id);
      const fetchedIncline = await apiClient.getExercise(incline.id);

      expect(fetchedBench.workoutDayId).toBe(workoutDay.id);
      expect(fetchedBench.muscleGroupId).toBe(testData.muscleGroups.CHEST);
      expect(fetchedBench.exerciseName).toBe('Bench Press');

      expect(fetchedIncline.workoutDayId).toBe(workoutDay.id);
      expect(fetchedIncline.muscleGroupId).toBe(testData.muscleGroups.CHEST);
      expect(fetchedIncline.exerciseName).toBe('Incline Dumbbell Press');

      logger.info('✅ Two exercises for same muscle group on one day created and retrieved');
    });
  });

  describe('DELETE /exercises/:id', () => {
    test('should delete exercise (returns 204) and make subsequent GET throw', async () => {
      const routine = await apiClient.createRoutine(testData.generateRoutine('Delete Exercise Routine'));
      cleanup!.trackRoutine(routine.id);

      const workoutDay = await apiClient.createWorkoutDay(testData.generateWorkoutDay(routine.id, 1, 'Delete Day'));
      cleanup!.trackWorkoutDay(workoutDay.id);

      const created = await apiClient.createExercise(
        testData.generateExercise(workoutDay.id, testData.muscleGroups.TRICEPS, 'Tricep Pushdown', 20, 40, 3)
      );
      cleanup!.trackExercise(created.id);

      await apiClient.deleteExercise(created.id);

      await expect(apiClient.getExercise(created.id)).rejects.toThrow();

      logger.info('✅ Successfully deleted exercise');
    });
  });
});
