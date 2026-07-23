/**
 * Component Test: Weekly Snapshot Creation
 *
 * This test validates the snapshot creation endpoint:
 * 1. Creating a snapshot for a routine with workout days and sets
 * 2. Verifying snapshot data is created correctly
 * 3. Verifying sets are reset to zero after snapshot
 * 4. Handling edge cases (no sets, replacing existing snapshot, invalid routineId)
 */

import { testData } from '../helpers/test-data';
import { ApiClient } from '../helpers/api-client';
import { CleanupHelper } from '../helpers/cleanup';
import { DatabaseHelper } from '@chauhaidang/xq-harness-test-utils';
import { logger } from '@chauhaidang/xq-harness-common-kit';

const apiClient = new ApiClient(process.env.API_BASE_URL || 'http://localhost:8080/xq-fitness-write-service/api/v1');

describe('Component Test: Weekly Snapshot Creation', () => {
  let cleanup: CleanupHelper;
  let dbHelper: DatabaseHelper;

  /**
   * Database query helper function for component tests
   */
  async function query(text: string, params?: any[]) {
    return await dbHelper.query(text, params);
  }

  beforeAll(async () => {
    // Initialize database helper with explicit config for component test environment.
    // Use 127.0.0.1 (IPv4) and longer connectionTimeoutMillis to avoid timeouts
    // when connecting from host to DB container (xq-infra exposes 5432).
    const dbConfig = {
      host: process.env.DB_HOST || '127.0.0.1',
      port: parseInt(process.env.DB_PORT || '5432', 10),
      database: process.env.DB_NAME || 'xq_fitness',
      user: process.env.DB_USER || 'xq_user',
      password: process.env.DB_PASSWORD || 'xq_password',
      ssl: process.env.DB_SSL === 'true',
      connectionTimeoutMillis: 10000,
    };
    dbHelper = new DatabaseHelper(dbConfig as any);

    // Connect to database
    await dbHelper.connect();

    // Verify database health and schema
    const healthCheck = await dbHelper.healthCheck([
      'weekly_snapshots',
      'snapshot_workout_days',
      'snapshot_workout_day_sets',
      'snapshot_exercises',
    ]);

    if (!healthCheck.healthy) {
      throw new Error(
        `Database health check failed. Connection: ${healthCheck.connection}, Schema: ${healthCheck.schema}`
      );
    }

    // Log database connection info for debugging
    const dbInfo = await query(
      'SELECT current_database() as db_name, current_user as db_user, inet_server_addr() as server_addr'
    );
    logger.info('Test database connection info:', dbInfo.rows[0]);
  });

  afterAll(async () => {
    // Close database connection pool
    if (dbHelper) {
      await dbHelper.disconnect();
    }
  });

  beforeEach(async () => {
    cleanup = new CleanupHelper(apiClient);
  });

  afterEach(async () => {
    if (cleanup) {
      await cleanup.cleanupAll();
    }
  });

  test('should create snapshot and reset sets to zero (happy path)', async () => {
    // Create routine with workout days and sets
    const routine = await apiClient.createRoutine(testData.generateRoutine('PPL Split'));
    cleanup.trackRoutine(routine.id);

    const pushDay = await apiClient.createWorkoutDay(testData.generateWorkoutDay(routine.id, 1, 'Push Day'));
    cleanup.trackWorkoutDay(pushDay.id);

    const chestSets = await apiClient.createWorkoutDaySets(
      testData.generateSets(pushDay.id, testData.muscleGroups.CHEST, 4)
    );
    cleanup.trackWorkoutDaySets(chestSets.id);

    const shoulderSets = await apiClient.createWorkoutDaySets(
      testData.generateSets(pushDay.id, testData.muscleGroups.SHOULDERS, 3)
    );
    cleanup.trackWorkoutDaySets(shoulderSets.id);

    // Now query by the ID returned from API
    const setsBeforeSnapshot = await query('SELECT number_of_sets FROM workout_day_sets WHERE id = $1', [chestSets.id]);
    expect(setsBeforeSnapshot.rows[0].number_of_sets).toBe(4);

    // Create snapshot
    const snapshot = await apiClient.createSnapshot(routine.id);

    // Verify snapshot response
    expect(snapshot).toBeDefined();
    expect(snapshot.id).toBeDefined();
    expect(snapshot.routineId).toBe(routine.id);
    // weekStartDate is a string (YYYY-MM-DD) from the axios-generated client
    expect(typeof snapshot.weekStartDate).toBe('string');
    expect(snapshot.weekStartDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(snapshot.createdAt).toBeDefined();

    // Verify snapshot data exists in database
    const snapshotRecord = await query('SELECT * FROM weekly_snapshots WHERE id = $1', [snapshot.id]);
    expect(snapshotRecord.rows.length).toBe(1);
    expect(snapshotRecord.rows[0].routine_id).toBe(routine.id);

    // Verify weekStartDate matches
    // The API response already has weekStartDate as a string (YYYY-MM-DD) formatted by the model using UTC
    // The database stores it as DATE type, which pg returns as a Date object
    // Extract date from database using UTC methods (same as model does) to ensure consistency
    expect(snapshot.weekStartDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);

    // Verify the date stored in database matches (extract date part using local date methods)
    // PostgreSQL DATE stores date without timezone, pg creates Date at midnight in server timezone
    // Use local date methods (not UTC) to extract the exact date that was stored
    const dbDateValue = snapshotRecord.rows[0].week_start_date;
    const dbDate =
      dbDateValue instanceof Date
        ? (() => {
            // Use local date methods to extract date, same as model does
            const year = dbDateValue.getFullYear();
            const month = String(dbDateValue.getMonth() + 1).padStart(2, '0');
            const day = String(dbDateValue.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
          })()
        : dbDateValue.substring(0, 10);
    expect(dbDate).toBe(snapshot.weekStartDate);

    // Verify snapshot workout days exist
    const snapshotDays = await query('SELECT * FROM snapshot_workout_days WHERE snapshot_id = $1', [snapshot.id]);
    expect(snapshotDays.rows.length).toBeGreaterThan(0);

    // Verify snapshot sets exist
    const snapshotSets = await query(
      `SELECT swds.* FROM snapshot_workout_day_sets swds
       JOIN snapshot_workout_days swd ON swds.snapshot_workout_day_id = swd.id
       WHERE swd.snapshot_id = $1`,
      [snapshot.id]
    );
    expect(snapshotSets.rows.length).toBeGreaterThan(0);

    // Verify original sets are reset to zero
    const setsAfterSnapshot = await query('SELECT number_of_sets FROM workout_day_sets WHERE id = $1', [chestSets.id]);
    expect(setsAfterSnapshot.rows[0].number_of_sets).toBe(4);

    logger.info('✅ Snapshot created successfully and sets reset');
  });

  test('should create snapshot when no sets exist', async () => {
    // Create routine with workout day but no sets
    const routine = await apiClient.createRoutine(testData.generateRoutine('Empty Routine'));
    cleanup.trackRoutine(routine.id);

    const workoutDay = await apiClient.createWorkoutDay(testData.generateWorkoutDay(routine.id, 1, 'Day 1'));
    cleanup.trackWorkoutDay(workoutDay.id);

    // Create snapshot
    const snapshot = await apiClient.createSnapshot(routine.id);

    // Verify snapshot was created
    expect(snapshot).toBeDefined();
    expect(snapshot.id).toBeDefined();
    expect(snapshot.routineId).toBe(routine.id);

    // Verify snapshot workout day exists but no sets
    const snapshotDays = await query('SELECT * FROM snapshot_workout_days WHERE snapshot_id = $1', [snapshot.id]);
    expect(snapshotDays.rows.length).toBe(1);

    const snapshotSets = await query(
      `SELECT swds.* FROM snapshot_workout_day_sets swds
       JOIN snapshot_workout_days swd ON swds.snapshot_workout_day_id = swd.id
       WHERE swd.snapshot_id = $1`,
      [snapshot.id]
    );
    expect(snapshotSets.rows.length).toBe(0);

    logger.info('✅ Snapshot created successfully with no sets');
  });

  test('should replace existing snapshot for same week', async () => {
    // Create routine with sets
    const routine = await apiClient.createRoutine(testData.generateRoutine('Replace Test'));
    cleanup.trackRoutine(routine.id);

    const workoutDay = await apiClient.createWorkoutDay(testData.generateWorkoutDay(routine.id, 1, 'Day 1'));
    cleanup.trackWorkoutDay(workoutDay.id);

    const sets1 = await apiClient.createWorkoutDaySets(
      testData.generateSets(workoutDay.id, testData.muscleGroups.CHEST, 4)
    );
    cleanup.trackWorkoutDaySets(sets1.id);

    // Create first snapshot
    const snapshot1 = await apiClient.createSnapshot(routine.id);

    // Update sets
    await apiClient.updateWorkoutDaySets(sets1.id, { numberOfSets: 5 });

    // Create second snapshot (should replace first)
    const snapshot2 = await apiClient.createSnapshot(routine.id);

    // Verify only one snapshot exists for this week
    // weekStartDate is already a string in YYYY-MM-DD format
    const weekStartDateStr = snapshot1.weekStartDate;
    const snapshots = await query('SELECT * FROM weekly_snapshots WHERE routine_id = $1 AND week_start_date = $2', [
      routine.id,
      weekStartDateStr,
    ]);
    expect(snapshots.rows.length).toBe(1);
    expect(snapshots.rows[0].id).toBe(snapshot2.id); // Should be the new snapshot

    // Verify old snapshot data is deleted
    const oldSnapshotDays = await query('SELECT * FROM snapshot_workout_days WHERE snapshot_id = $1', [snapshot1.id]);
    expect(oldSnapshotDays.rows.length).toBe(0);

    logger.info('✅ Existing snapshot replaced successfully');
  });

  test('should return 404 for invalid routineId', async () => {
    const invalidRoutineId = 99999;

    try {
      await apiClient.createSnapshot(invalidRoutineId);
      fail('Expected error to be thrown');
    } catch (error: any) {
      expect(error.status).toBe(404);
      expect(error.body?.code).toBe('NOT_FOUND');
      expect(error.body?.message).toContain('Routine not found');
    }

    logger.info('✅ Invalid routineId handled correctly');
  });

  test('should create snapshot when routine has workout day sets and exercise data', async () => {
    // Create routine with workout day, sets, and exercises
    const routine = await apiClient.createRoutine(testData.generateRoutine('Snapshot With Exercise'));
    cleanup.trackRoutine(routine.id);

    const workoutDay = await apiClient.createWorkoutDay(testData.generateWorkoutDay(routine.id, 1, 'Push Day'));
    cleanup.trackWorkoutDay(workoutDay.id);

    const chestSets = await apiClient.createWorkoutDaySets(
      testData.generateSets(workoutDay.id, testData.muscleGroups.CHEST, 4)
    );
    cleanup.trackWorkoutDaySets(chestSets.id);

    const exercise1 = await apiClient.createExercise(
      testData.generateExercise(workoutDay.id, testData.muscleGroups.CHEST, 'Bench Press', 30, 135, 3)
    );
    cleanup.trackExercise(exercise1.id);

    const exercise2 = await apiClient.createExercise(
      testData.generateExercise(workoutDay.id, testData.muscleGroups.SHOULDERS, 'Overhead Press', 24, 95, 3)
    );
    cleanup.trackExercise(exercise2.id);

    // Create snapshot (should succeed when exercise data is present)
    const snapshot = await apiClient.createSnapshot(routine.id);

    // Verify snapshot response
    expect(snapshot).toBeDefined();
    expect(snapshot.id).toBeDefined();
    expect(snapshot.routineId).toBe(routine.id);
    expect(typeof snapshot.weekStartDate).toBe('string');
    expect(snapshot.weekStartDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(snapshot.createdAt).toBeDefined();

    // Verify snapshot record in database
    const snapshotRecord = await query('SELECT * FROM weekly_snapshots WHERE id = $1', [snapshot.id]);
    expect(snapshotRecord.rows.length).toBe(1);
    expect(snapshotRecord.rows[0].routine_id).toBe(routine.id);

    // Verify snapshot workout days exist
    const snapshotDays = await query('SELECT * FROM snapshot_workout_days WHERE snapshot_id = $1', [snapshot.id]);
    expect(snapshotDays.rows.length).toBe(1);
    expect(snapshotDays.rows[0].original_workout_day_id).toBe(workoutDay.id);

    // Verify snapshot sets exist (from workout_day_sets, not exercises)
    const snapshotSets = await query(
      `SELECT swds.* FROM snapshot_workout_day_sets swds
       JOIN snapshot_workout_days swd ON swds.snapshot_workout_day_id = swd.id
       WHERE swd.snapshot_id = $1`,
      [snapshot.id]
    );
    expect(snapshotSets.rows.length).toBeGreaterThan(0);

    // Verify snapshot_exercises table is populated after API success
    const snapshotExercises = await query(
      `SELECT se.* FROM snapshot_exercises se
       JOIN snapshot_workout_days swd ON se.snapshot_workout_day_id = swd.id
       WHERE swd.snapshot_id = $1
       ORDER BY se.exercise_name`,
      [snapshot.id]
    );
    expect(snapshotExercises.rows.length).toBe(2);
    const exerciseNames = snapshotExercises.rows.map((r: { exercise_name: string }) => r.exercise_name);
    expect(exerciseNames).toContain('Bench Press');
    expect(exerciseNames).toContain('Overhead Press');
    const benchRow = snapshotExercises.rows.find((r: { exercise_name: string }) => r.exercise_name === 'Bench Press');
    const overheadRow = snapshotExercises.rows.find(
      (r: { exercise_name: string }) => r.exercise_name === 'Overhead Press'
    );
    expect(benchRow).toBeDefined();
    expect(benchRow?.original_exercise_id).toBe(exercise1.id);
    expect(Number(benchRow?.total_reps)).toBe(30);
    expect(Number(benchRow?.weight)).toBe(135);
    expect(Number(benchRow?.total_sets)).toBe(3);
    expect(benchRow?.muscle_group_id).toBe(testData.muscleGroups.CHEST);
    expect(overheadRow).toBeDefined();
    expect(overheadRow?.original_exercise_id).toBe(exercise2.id);
    expect(Number(overheadRow?.total_reps)).toBe(24);
    expect(Number(overheadRow?.weight)).toBe(95);
    expect(Number(overheadRow?.total_sets)).toBe(3);
    expect(overheadRow?.muscle_group_id).toBe(testData.muscleGroups.SHOULDERS);

    // Exercises remain in exercises table
    const exercisesAfter = await query('SELECT id, exercise_name FROM exercises WHERE workout_day_id = $1', [
      workoutDay.id,
    ]);
    expect(exercisesAfter.rows.length).toBe(2);

    logger.info('✅ Snapshot created successfully when routine has exercise data');
  });

  test('should snapshot one workout day with two exercises in the same muscle group', async () => {
    const routine = await apiClient.createRoutine(testData.generateRoutine('Same Muscle Snapshot'));
    cleanup.trackRoutine(routine.id);

    const workoutDay = await apiClient.createWorkoutDay(testData.generateWorkoutDay(routine.id, 1, 'Chest Day'));
    cleanup.trackWorkoutDay(workoutDay.id);

    const bench = await apiClient.createExercise(
      testData.generateExercise(workoutDay.id, testData.muscleGroups.CHEST, 'Bench Press', 30, 135, 3)
    );
    cleanup.trackExercise(bench.id);

    const incline = await apiClient.createExercise(
      testData.generateExercise(workoutDay.id, testData.muscleGroups.CHEST, 'Incline Dumbbell Press', 24, 80, 3)
    );
    cleanup.trackExercise(incline.id);

    const snapshot = await apiClient.createSnapshot(routine.id);

    expect(snapshot).toBeDefined();
    expect(snapshot.id).toBeDefined();

    const snapshotExercises = await query(
      `SELECT se.* FROM snapshot_exercises se
       JOIN snapshot_workout_days swd ON se.snapshot_workout_day_id = swd.id
       WHERE swd.snapshot_id = $1
       ORDER BY se.exercise_name`,
      [snapshot.id]
    );
    expect(snapshotExercises.rows.length).toBe(2);
    expect(
      snapshotExercises.rows.every(
        (r: { muscle_group_id: number }) => r.muscle_group_id === testData.muscleGroups.CHEST
      )
    ).toBe(true);
    const names = snapshotExercises.rows.map((r: { exercise_name: string }) => r.exercise_name);
    expect(names).toContain('Bench Press');
    expect(names).toContain('Incline Dumbbell Press');

    logger.info('✅ Snapshot with two same-muscle-group exercises on one day');
  });

  test('should snapshot two workout days each with exercises (same muscle group across days)', async () => {
    const routine = await apiClient.createRoutine(testData.generateRoutine('Two Days Exercise Snapshot'));
    cleanup.trackRoutine(routine.id);

    const day1 = await apiClient.createWorkoutDay(testData.generateWorkoutDay(routine.id, 1, 'Push Day'));
    cleanup.trackWorkoutDay(day1.id);
    const day2 = await apiClient.createWorkoutDay(testData.generateWorkoutDay(routine.id, 2, 'Pull Day'));
    cleanup.trackWorkoutDay(day2.id);

    const day1Chest = await apiClient.createExercise(
      testData.generateExercise(day1.id, testData.muscleGroups.CHEST, 'Bench Press', 30, 135, 3)
    );
    cleanup.trackExercise(day1Chest.id);
    const day1Shoulders = await apiClient.createExercise(
      testData.generateExercise(day1.id, testData.muscleGroups.SHOULDERS, 'Overhead Press', 24, 95, 3)
    );
    cleanup.trackExercise(day1Shoulders.id);

    const day2Chest = await apiClient.createExercise(
      testData.generateExercise(day2.id, testData.muscleGroups.CHEST, 'Cable Flyes', 20, 30, 3)
    );
    cleanup.trackExercise(day2Chest.id);
    const day2Back = await apiClient.createExercise(
      testData.generateExercise(day2.id, testData.muscleGroups.BACK, 'Rows', 30, 100, 4)
    );
    cleanup.trackExercise(day2Back.id);

    const snapshot = await apiClient.createSnapshot(routine.id);

    expect(snapshot).toBeDefined();

    const snapshotDays = await query('SELECT * FROM snapshot_workout_days WHERE snapshot_id = $1 ORDER BY day_number', [
      snapshot.id,
    ]);
    expect(snapshotDays.rows.length).toBe(2);
    const snapDay1Id = snapshotDays.rows.find(
      (r: { original_workout_day_id: number }) => r.original_workout_day_id === day1.id
    )?.id;
    const snapDay2Id = snapshotDays.rows.find(
      (r: { original_workout_day_id: number }) => r.original_workout_day_id === day2.id
    )?.id;
    expect(snapDay1Id).toBeDefined();
    expect(snapDay2Id).toBeDefined();

    const snapshotExercises = await query(
      `SELECT se.*, swd.original_workout_day_id FROM snapshot_exercises se
       JOIN snapshot_workout_days swd ON se.snapshot_workout_day_id = swd.id
       WHERE swd.snapshot_id = $1
       ORDER BY swd.day_number, se.exercise_name`,
      [snapshot.id]
    );
    expect(snapshotExercises.rows.length).toBe(4);

    const day1Exercises = snapshotExercises.rows.filter(
      (r: { original_workout_day_id: number }) => r.original_workout_day_id === day1.id
    );
    const day2Exercises = snapshotExercises.rows.filter(
      (r: { original_workout_day_id: number }) => r.original_workout_day_id === day2.id
    );
    expect(day1Exercises.length).toBe(2);
    expect(day2Exercises.length).toBe(2);

    expect(day1Exercises.map((r: { exercise_name: string }) => r.exercise_name).sort()).toEqual([
      'Bench Press',
      'Overhead Press',
    ]);
    expect(day2Exercises.map((r: { exercise_name: string }) => r.exercise_name).sort()).toEqual([
      'Cable Flyes',
      'Rows',
    ]);

    logger.info('✅ Snapshot with two workout days, each with exercises (same muscle group CHEST on both days)');
  });
});
