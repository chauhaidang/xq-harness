import db from '../config/database';
import type { PoolClient } from 'pg';

export interface ExerciseResponse {
  id: number;
  workoutDayId: number;
  muscleGroupId: number;
  exerciseName: string;
  totalReps: number;
  weight: number;
  totalSets: number;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export class ExerciseModel {
  static transformRow(row: Record<string, unknown> | null): ExerciseResponse | null {
    if (!row) return null;
    return {
      id: row.id as number,
      workoutDayId: row.workout_day_id as number,
      muscleGroupId: row.muscle_group_id as number,
      exerciseName: row.exercise_name as string,
      totalReps: row.total_reps as number,
      weight: parseFloat(String(row.weight)),
      totalSets: row.total_sets as number,
      notes: row.notes as string | null,
      createdAt: row.created_at as Date,
      updatedAt: row.updated_at as Date,
    };
  }

  static async create(data: {
    workoutDayId: number;
    muscleGroupId: number;
    exerciseName: string;
    totalReps?: number;
    weight?: number;
    totalSets?: number;
    notes?: string | null;
  }): Promise<ExerciseResponse | null> {
    const query = `
      INSERT INTO exercises (workout_day_id, muscle_group_id, exercise_name, total_reps, weight, total_sets, notes)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;
    const values = [
      data.workoutDayId,
      data.muscleGroupId,
      data.exerciseName,
      data.totalReps ?? 0,
      data.weight ?? 0,
      data.totalSets ?? 0,
      data.notes || null,
    ];
    const result = await db.query(query, values);
    return this.transformRow(result.rows[0] as Record<string, unknown>);
  }

  static async findById(id: number): Promise<ExerciseResponse | null> {
    const query = 'SELECT * FROM exercises WHERE id = $1';
    const result = await db.query(query, [id]);
    return result.rows.length > 0 ? this.transformRow(result.rows[0] as Record<string, unknown>) : null;
  }

  static async findByWorkoutDayIds(workoutDayIds: number[], client: PoolClient | null = null): Promise<ExerciseResponse[]> {
    if (!workoutDayIds || workoutDayIds.length === 0) return [];
    const query = 'SELECT * FROM exercises WHERE workout_day_id = ANY($1::int[]) ORDER BY id';
    const result = client ? await client.query(query, [workoutDayIds]) : await db.query(query, [workoutDayIds]);
    return result.rows.map((row) => this.transformRow(row as Record<string, unknown>)!).filter(Boolean);
  }

  static async update(
    id: string | number,
    data: { exerciseName?: string; totalReps?: number; weight?: number; totalSets?: number; notes?: string | null }
  ): Promise<ExerciseResponse | null> {
    const updates: string[] = [];
    const values: unknown[] = [];
    let paramCount = 1;

    if (data.exerciseName !== undefined) {
      updates.push(`exercise_name = $${paramCount++}`);
      values.push(data.exerciseName);
    }
    if (data.totalReps !== undefined) {
      updates.push(`total_reps = $${paramCount++}`);
      values.push(data.totalReps);
    }
    if (data.weight !== undefined) {
      updates.push(`weight = $${paramCount++}`);
      values.push(data.weight);
    }
    if (data.totalSets !== undefined) {
      updates.push(`total_sets = $${paramCount++}`);
      values.push(data.totalSets);
    }
    if (data.notes !== undefined) {
      updates.push(`notes = $${paramCount++}`);
      values.push(data.notes);
    }

    if (updates.length === 0) {
      throw new Error('No fields to update');
    }

    values.push(id);
    const updateQuery = `
      UPDATE exercises
      SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await db.query(updateQuery, values);
    if (!result.rows || result.rows.length === 0) {
      throw new Error('Exercise not found');
    }
    return this.transformRow(result.rows[0] as Record<string, unknown>);
  }

  static async delete(id: string | number): Promise<Record<string, unknown> | undefined> {
    const query = 'DELETE FROM exercises WHERE id = $1 RETURNING id';
    const result = await db.query(query, [id]);
    return result.rows[0] as Record<string, unknown> | undefined;
  }

  static async exists(id: string | number): Promise<boolean> {
    const query = 'SELECT EXISTS(SELECT 1 FROM exercises WHERE id = $1)';
    const result = await db.query(query, [id]);
    return (result?.rows?.[0] as { exists?: boolean })?.exists || false;
  }
}
