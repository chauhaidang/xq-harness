import db from '../config/database';
import type { PoolClient } from 'pg';

export interface SnapshotExerciseResponse {
  id: number;
  snapshotWorkoutDayId: number;
  originalExerciseId: number;
  exerciseName: string;
  muscleGroupId: number;
  totalReps: number;
  weight: number;
  totalSets: number;
  notes: string | null;
  createdAt: Date;
}

export class SnapshotExerciseModel {
  static transformRow(row: Record<string, unknown> | null): SnapshotExerciseResponse | null {
    if (!row) return null;
    return {
      id: row.id as number,
      snapshotWorkoutDayId: row.snapshot_workout_day_id as number,
      originalExerciseId: row.original_exercise_id as number,
      exerciseName: row.exercise_name as string,
      muscleGroupId: row.muscle_group_id as number,
      totalReps: row.total_reps as number,
      weight: parseFloat(String(row.weight)),
      totalSets: row.total_sets as number,
      notes: row.notes as string | null,
      createdAt: row.created_at as Date,
    };
  }

  static async bulkCreate(
    exercises: Array<{
      snapshotWorkoutDayId: number;
      originalExerciseId: number;
      exerciseName: string;
      muscleGroupId: number;
      totalReps?: number;
      weight?: number;
      totalSets?: number;
      notes?: string | null;
    }>,
    client: PoolClient | null = null
  ): Promise<SnapshotExerciseResponse[]> {
    if (!exercises || exercises.length === 0) return [];

    const queryFn = client ? client.query.bind(client) : db.query;
    const values: unknown[] = [];
    const placeholders: string[] = [];

    exercises.forEach((ex, index) => {
      const offset = index * 8;
      placeholders.push(
        `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, $${offset + 6}, $${offset + 7}, $${offset + 8})`
      );
      values.push(
        ex.snapshotWorkoutDayId,
        ex.originalExerciseId,
        ex.exerciseName,
        ex.muscleGroupId,
        ex.totalReps ?? 0,
        ex.weight ?? 0,
        ex.totalSets ?? 0,
        ex.notes ?? null
      );
    });

    const query = `
      INSERT INTO snapshot_exercises (snapshot_workout_day_id, original_exercise_id, exercise_name, muscle_group_id, total_reps, weight, total_sets, notes)
      VALUES ${placeholders.join(', ')}
      RETURNING *
    `;
    const result = await queryFn(query, values);
    return result.rows.map((row) => this.transformRow(row as Record<string, unknown>)!).filter(Boolean);
  }
}
