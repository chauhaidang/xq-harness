import db from '../config/database';
import type { PoolClient } from 'pg';

export interface SnapshotWorkoutDaySetResponse {
  id: number;
  snapshotWorkoutDayId: number;
  originalWorkoutDaySetId: number;
  muscleGroupId: number;
  numberOfSets: number;
  notes: string | null;
  createdAt: Date;
}

export class SnapshotWorkoutDaySetModel {
  static transformRow(row: Record<string, unknown> | null): SnapshotWorkoutDaySetResponse | null {
    if (!row) return null;
    return {
      id: row.id as number,
      snapshotWorkoutDayId: row.snapshot_workout_day_id as number,
      originalWorkoutDaySetId: row.original_workout_day_set_id as number,
      muscleGroupId: row.muscle_group_id as number,
      numberOfSets: row.number_of_sets as number,
      notes: row.notes as string | null,
      createdAt: row.created_at as Date,
    };
  }

  static async create(
    data: {
      snapshotWorkoutDayId: number;
      originalWorkoutDaySetId: number;
      muscleGroupId: number;
      numberOfSets: number;
      notes?: string | null;
    },
    client: PoolClient | null = null
  ): Promise<SnapshotWorkoutDaySetResponse | null> {
    const queryFn = client ? client.query.bind(client) : db.query;
    const query = `
      INSERT INTO snapshot_workout_day_sets (snapshot_workout_day_id, original_workout_day_set_id, muscle_group_id, number_of_sets, notes)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;
    const values = [
      data.snapshotWorkoutDayId,
      data.originalWorkoutDaySetId,
      data.muscleGroupId,
      data.numberOfSets,
      data.notes || null,
    ];
    const result = await queryFn(query, values);
    return this.transformRow(result.rows[0] as Record<string, unknown>);
  }

  static async bulkCreate(
    sets: Array<{
      snapshotWorkoutDayId: number;
      originalWorkoutDaySetId: number;
      muscleGroupId: number;
      numberOfSets: number;
      notes?: string | null;
    }>,
    client: PoolClient | null = null
  ): Promise<SnapshotWorkoutDaySetResponse[]> {
    if (!sets || sets.length === 0) return [];

    const queryFn = client ? client.query.bind(client) : db.query;
    const values: unknown[] = [];
    const placeholders: string[] = [];

    sets.forEach((set, index) => {
      const offset = index * 5;
      placeholders.push(`($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5})`);
      values.push(
        set.snapshotWorkoutDayId,
        set.originalWorkoutDaySetId,
        set.muscleGroupId,
        set.numberOfSets,
        set.notes || null
      );
    });

    const query = `
      INSERT INTO snapshot_workout_day_sets (snapshot_workout_day_id, original_workout_day_set_id, muscle_group_id, number_of_sets, notes)
      VALUES ${placeholders.join(', ')}
      RETURNING *
    `;

    const result = await queryFn(query, values);
    return result.rows.map((row) => this.transformRow(row as Record<string, unknown>)!).filter(Boolean);
  }
}
