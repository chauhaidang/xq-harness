import db from '../config/database';
import type { PoolClient } from 'pg';

export interface WorkoutDaySetResponse {
  id: number;
  workoutDayId: number;
  muscleGroupId: number;
  numberOfSets: number;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export class WorkoutDaySetModel {
  static transformRow(row: Record<string, unknown> | null): WorkoutDaySetResponse | null {
    if (!row) return null;
    return {
      id: row.id as number,
      workoutDayId: row.workout_day_id as number,
      muscleGroupId: row.muscle_group_id as number,
      numberOfSets: row.number_of_sets as number,
      notes: row.notes as string | null,
      createdAt: row.created_at as Date,
      updatedAt: row.updated_at as Date,
    };
  }

  static async create(data: {
    workoutDayId: number;
    muscleGroupId: number;
    numberOfSets: number;
    notes?: string | null;
  }): Promise<WorkoutDaySetResponse | null> {
    const query = `
      INSERT INTO workout_day_sets (workout_day_id, muscle_group_id, number_of_sets, notes)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;
    const values = [data.workoutDayId, data.muscleGroupId, data.numberOfSets, data.notes || null];
    const result = await db.query(query, values);
    return this.transformRow(result.rows[0] as Record<string, unknown>);
  }

  static async findByWorkoutDayAndMuscleGroup(workoutDayId: number, muscleGroupId: number): Promise<WorkoutDaySetResponse | null> {
    const query = `
      SELECT * FROM workout_day_sets
      WHERE workout_day_id = $1 AND muscle_group_id = $2
      LIMIT 1
    `;
    const result = await db.query(query, [workoutDayId, muscleGroupId]);
    return result.rows.length > 0 ? this.transformRow(result.rows[0] as Record<string, unknown>) : null;
  }

  static async update(id: string | number, data: { numberOfSets?: number; notes?: string | null }): Promise<WorkoutDaySetResponse | null> {
    const updates: string[] = [];
    const values: unknown[] = [];
    let paramCount = 1;

    if (data.numberOfSets !== undefined) {
      updates.push(`number_of_sets = $${paramCount++}`);
      values.push(data.numberOfSets);
    }
    if (data.notes !== undefined) {
      updates.push(`notes = $${paramCount++}`);
      values.push(data.notes);
    }

    if (updates.length === 0) {
      throw new Error('No fields to update');
    }

    values.push(id);
    const query = `
      UPDATE workout_day_sets
      SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await db.query(query, values);
    if (!result.rows || result.rows.length === 0) {
      throw new Error('Workout day set not found');
    }
    return this.transformRow(result.rows[0] as Record<string, unknown>);
  }

  static async delete(id: string | number): Promise<Record<string, unknown> | undefined> {
    const query = 'DELETE FROM workout_day_sets WHERE id = $1 RETURNING id';
    const result = await db.query(query, [id]);
    return result.rows[0] as Record<string, unknown> | undefined;
  }

  static async exists(id: string | number): Promise<boolean> {
    const query = 'SELECT EXISTS(SELECT 1 FROM workout_day_sets WHERE id = $1)';
    const result = await db.query(query, [id]);
    return (result?.rows?.[0] as { exists?: boolean })?.exists || false;
  }

  static async findByRoutineId(routineId: number, client: PoolClient | null = null): Promise<WorkoutDaySetResponse[]> {
    const queryFn = client ? client.query.bind(client) : db.query;
    const query = `
      SELECT wds.* FROM workout_day_sets wds
      JOIN workout_days wd ON wds.workout_day_id = wd.id
      WHERE wd.routine_id = $1
      ORDER BY wd.day_number, wds.muscle_group_id
    `;
    const result = await queryFn(query, [routineId]);
    return result.rows.map((row) => this.transformRow(row as Record<string, unknown>)!).filter(Boolean);
  }

  static async resetSetsByRoutineId(routineId: number, client: PoolClient | null = null): Promise<number | undefined> {
    const queryFn = client ? client.query.bind(client) : db.query;
    const query = `
      UPDATE workout_day_sets
      SET number_of_sets = 0, updated_at = CURRENT_TIMESTAMP
      WHERE workout_day_id IN (
        SELECT id FROM workout_days WHERE routine_id = $1
      )
    `;
    const result = await queryFn(query, [routineId]);
    return result.rowCount ?? undefined;
  }
}
