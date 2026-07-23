/**
 * API Client wrapper for Write Service
 * Provides typed methods for common API operations using the generated write client
 */

import {
  Configuration,
  MuscleGroupsApi,
  RoutinesApi,
  WorkoutDaysApi,
  WorkoutDaySetsApi,
  ExercisesApi,
  SnapshotsApi,
  ReportsApi,
  RoutineResponse,
  WorkoutDayResponse,
  WorkoutDaySetResponse,
  ExerciseResponse,
  WeeklySnapshotResponse,
  MuscleGroup,
  WorkoutRoutine,
  WorkoutRoutineDetail,
  WorkoutDayDetail,
  WeeklyReportResponse,
  Exercise,
} from 'xq-fitness-write-client';
import { logger } from '@chauhaidang/xq-harness-common-kit';

export class ApiClient {
  private muscleGroupsApi: MuscleGroupsApi;
  private routinesApi: RoutinesApi;
  private workoutDaysApi: WorkoutDaysApi;
  private workoutDaySetsApi: WorkoutDaySetsApi;
  private exercisesApi: ExercisesApi;
  private snapshotsApi: SnapshotsApi;
  private reportsApi: ReportsApi;

  constructor(baseUrl: string) {
    const config = new Configuration({
      basePath: baseUrl,
    });

    this.muscleGroupsApi = new MuscleGroupsApi(config);
    this.routinesApi = new RoutinesApi(config);
    this.workoutDaysApi = new WorkoutDaysApi(config);
    this.workoutDaySetsApi = new WorkoutDaySetsApi(config);
    this.exercisesApi = new ExercisesApi(config);
    this.snapshotsApi = new SnapshotsApi(config);
    this.reportsApi = new ReportsApi(config);
  }

  /**
   * Extract error details from API error response
   * Handles AxiosError from generated axios client
   */
  private extractErrorDetails(error: any): { status?: number; message: string; body?: any } {
    let status: number | undefined;
    let body: any;

    // Handle AxiosError from generated axios client
    // Axios errors have error.response.status and error.response.data (already parsed JSON)
    if (error.response && typeof error.response.status === 'number') {
      status = error.response.status;
      body = error.response.data; // Axios automatically parses JSON responses
    } else {
      // Fallback to other error formats
      status = error.status || error.statusCode;
      body = error.body || error.data;
    }

    const message = error.message || 'Unknown error';

    return { status, message, body };
  }

  /**
   * Handle API errors with detailed logging
   */
  private handleError(operation: string, error: any): never {
    const { status, message, body } = this.extractErrorDetails(error);

    logger.error(`❌ Failed to ${operation}`);
    logger.error(`Error status: ${status || 'unknown'}`);
    logger.error(`Error message: ${message}`);
    if (body) {
      logger.error(`Error body: ${JSON.stringify(body, null, 2)}`);
    }

    // Create a more informative error message
    const errorMessage = body?.message || body?.code || message;
    const enhancedError = new Error(`Failed to ${operation}: ${errorMessage}${status ? ` (HTTP ${status})` : ''}`);

    // Preserve original error details
    (enhancedError as any).status = status;
    (enhancedError as any).body = body;
    (enhancedError as any).originalError = error;

    throw enhancedError;
  }

  /**
   * Create a routine
   */
  async createRoutine(data: { name: string; description?: string; isActive: boolean }): Promise<RoutineResponse> {
    try {
      const result = await this.routinesApi.createRoutine(data);
      logger.info(`✅ Created routine: ${result.data.id} - ${result.data.name}`);
      return result.data;
    } catch (error) {
      return await this.handleError(`create routine "${data.name}"`, error);
    }
  }

  /**
   * Update a routine
   */
  async updateRoutine(
    id: number,
    data: Partial<{ name: string; description?: string; isActive: boolean }>
  ): Promise<RoutineResponse> {
    try {
      const result = await this.routinesApi.updateRoutine(id, data);
      return result.data;
    } catch (error) {
      return await this.handleError(`update routine ${id}`, error);
    }
  }

  /**
   * Delete a routine
   */
  async deleteRoutine(id: number): Promise<void> {
    try {
      await this.routinesApi.deleteRoutine(id);
    } catch (error) {
      return await this.handleError(`delete routine ${id}`, error);
    }
  }

  /**
   * Create a workout day
   */
  async createWorkoutDay(data: { routineId: number; dayNumber: number; dayName: string }): Promise<WorkoutDayResponse> {
    try {
      const result = await this.workoutDaysApi.createWorkoutDay(data);
      logger.info(`✅ Created workout day: ${result.data.id} - ${result.data.dayName} (Day ${result.data.dayNumber})`);
      return result.data;
    } catch (error) {
      return await this.handleError(`create workout day "${data.dayName}" for routine ${data.routineId}`, error);
    }
  }

  /**
   * Update a workout day
   */
  async updateWorkoutDay(
    id: number,
    data: Partial<{ dayNumber: number; dayName: string }>
  ): Promise<WorkoutDayResponse> {
    try {
      const result = await this.workoutDaysApi.updateWorkoutDay(id, data);
      return result.data;
    } catch (error) {
      return await this.handleError(`update workout day ${id}`, error);
    }
  }

  /**
   * Delete a workout day
   */
  async deleteWorkoutDay(id: number): Promise<void> {
    try {
      await this.workoutDaysApi.deleteWorkoutDay(id);
    } catch (error) {
      return await this.handleError(`delete workout day ${id}`, error);
    }
  }

  /**
   * Create workout day sets
   */
  async createWorkoutDaySets(data: {
    workoutDayId: number;
    muscleGroupId: number;
    numberOfSets: number;
  }): Promise<WorkoutDaySetResponse> {
    try {
      const result = await this.workoutDaySetsApi.createWorkoutDaySet(data);
      logger.info(
        `✅ Created workout day sets: ${result.data.id} (muscle group ${data.muscleGroupId}, ${data.numberOfSets} sets)`
      );
      return result.data;
    } catch (error) {
      return await this.handleError(
        `create workout day sets for workout day ${data.workoutDayId} (muscle group ${data.muscleGroupId})`,
        error
      );
    }
  }

  /**
   * Update workout day sets by setId
   */
  async updateWorkoutDaySets(
    id: number,
    data: Partial<{ numberOfSets: number; notes?: string }>
  ): Promise<WorkoutDaySetResponse> {
    try {
      const result = await this.workoutDaySetsApi.updateWorkoutDaySet(id, data);
      logger.info(
        `✅ Updated workout day sets: ${result.data.id} - workoutDayId: ${result.data.workoutDayId}, muscleGroupId: ${result.data.muscleGroupId}`
      );
      return result.data;
    } catch (error) {
      return await this.handleError(`update workout day sets ${id}`, error);
    }
  }

  /**
   * Update workout day sets by workoutDayId and muscleGroupId (query parameters)
   * This method allows updating when you only know the workout day and muscle group IDs
   */
  async updateWorkoutDaySetsByQuery(
    workoutDayId: number,
    muscleGroupId: number,
    data: Partial<{ numberOfSets: number; notes?: string }>
  ): Promise<WorkoutDaySetResponse> {
    try {
      // Use setId=0 (or any value) since query params take precedence
      const result = await this.workoutDaySetsApi.updateWorkoutDaySet(0, data, workoutDayId, muscleGroupId);
      logger.info(
        `✅ Updated workout day sets via query params (workoutDayId: ${workoutDayId}, muscleGroupId: ${muscleGroupId})`
      );
      return result.data;
    } catch (error) {
      return await this.handleError(
        `update workout day sets by query (workoutDayId: ${workoutDayId}, muscleGroupId: ${muscleGroupId})`,
        error
      );
    }
  }

  /**
   * Delete workout day sets
   */
  async deleteWorkoutDaySets(id: number): Promise<void> {
    try {
      await this.workoutDaySetsApi.deleteWorkoutDaySet(id);
    } catch (error) {
      return await this.handleError(`delete workout day sets ${id}`, error);
    }
  }

  /**
   * Create a weekly snapshot for a routine
   */
  async createSnapshot(routineId: number): Promise<WeeklySnapshotResponse> {
    try {
      const result = await this.snapshotsApi.createWeeklySnapshot(routineId);
      logger.info(`✅ Created snapshot: ${result.data.id} for routine ${routineId}, week ${result.data.weekStartDate}`);
      return result.data;
    } catch (error) {
      return this.handleError(`create snapshot for routine ${routineId}`, error);
    }
  }

  /**
   * Create an exercise (generated client from API contract)
   */
  async createExercise(data: {
    workoutDayId: number;
    muscleGroupId: number;
    exerciseName: string;
    totalReps: number;
    weight: number;
    totalSets: number;
    notes?: string;
  }): Promise<ExerciseResponse> {
    try {
      const result = await this.exercisesApi.createExercise(data);
      logger.info(`✅ Created exercise: ${result.data.id} - ${result.data.exerciseName}`);
      return result.data;
    } catch (error) {
      return await this.handleError(
        `create exercise "${data.exerciseName}" for workout day ${data.workoutDayId}`,
        error
      );
    }
  }

  /**
   * Get exercise by ID (generated client)
   */
  async getExercise(id: number): Promise<ExerciseResponse> {
    try {
      const result = await this.exercisesApi.getExercise(id);
      return result.data;
    } catch (error) {
      return await this.handleError(`get exercise ${id}`, error);
    }
  }

  /**
   * Update exercise (generated client)
   */
  async updateExercise(
    id: number,
    data: Partial<{ exerciseName: string; totalReps: number; weight: number; totalSets: number; notes: string }>
  ): Promise<ExerciseResponse> {
    try {
      const result = await this.exercisesApi.updateExercise(id, data);
      logger.info(`✅ Updated exercise: ${result.data.id}`);
      return result.data;
    } catch (error) {
      return await this.handleError(`update exercise ${id}`, error);
    }
  }

  /**
   * Delete exercise (generated client)
   */
  async deleteExercise(id: number): Promise<void> {
    try {
      await this.exercisesApi.deleteExercise(id);
    } catch (error) {
      return await this.handleError(`delete exercise ${id}`, error);
    }
  }

  async getMuscleGroups(): Promise<MuscleGroup[]> {
    const res = await this.muscleGroupsApi.getMuscleGroups();
    return res.data;
  }

  async getRoutines(isActive?: boolean): Promise<WorkoutRoutine[]> {
    const res = await this.routinesApi.getRoutines(isActive);
    return res.data;
  }

  async getRoutineById(routineId: number): Promise<WorkoutRoutineDetail> {
    const res = await this.routinesApi.getRoutineById(routineId);
    return res.data;
  }

  async getWorkoutDays(routineId: number): Promise<WorkoutDayDetail[]> {
    const res = await this.workoutDaysApi.getWorkoutDays(routineId);
    return res.data;
  }

  async getWeeklyReport(routineId: number, weekStartDate?: string): Promise<WeeklyReportResponse> {
    const res = await this.reportsApi.getWeeklyReport(routineId, weekStartDate);
    return res.data;
  }

  async getExercises(workoutDayId: number, muscleGroupId?: number): Promise<Exercise[]> {
    const res = await this.exercisesApi.getExercises(workoutDayId, muscleGroupId);
    return res.data;
  }
}
