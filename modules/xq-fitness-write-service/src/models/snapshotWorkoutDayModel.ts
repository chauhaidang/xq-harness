import db from '../config/database';
import type { PoolClient } from 'pg';

export interface SnapshotWorkoutDayResponse {
  id: number;
  snapshotId: number;
  originalWorkoutDayId: number;
  dayNumber: number;
  dayName: string;
  notes: string | null;
  createdAt: Date;
}

export class SnapshotWorkoutDayModel {
  static transformRow(row: Record<string, unknown> | null): SnapshotWorkoutDayResponse | null {
    if (!row) return null;
    return {
      id: row.id as number,
      snapshotId: row.snapshot_id as number,
      originalWorkoutDayId: row.original_workout_day_id as number,
      dayNumber: row.day_number as number,
      dayName: row.day_name as string,
      notes: row.notes as string | null,
      createdAt: row.created_at as Date,
    };
  }

  static async create(
    data: { snapshotId: number; originalWorkoutDayId: number; dayNumber: number; dayName: string; notes?: string | null },
    client: PoolClient | null = null
  ): Promise<SnapshotWorkoutDayResponse | null> {
    const queryFn = client ? client.query.bind(client) : db.query;
    const query = `
      INSERT INTO snapshot_workout_days (snapshot_id, original_workout_day_id, day_number, day_name, notes)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;
    const values = [data.snapshotId, data.originalWorkoutDayId, data.dayNumber, data.dayName, data.notes || null];
    const result = await queryFn(query, values);
    return this.transformRow(result.rows[0] as Record<string, unknown>);
  }

  static async bulkCreate(
    days: Array<{ snapshotId: number; originalWorkoutDayId: number; dayNumber: number; dayName: string; notes?: string | null }>,
    client: PoolClient | null = null
  ): Promise<SnapshotWorkoutDayResponse[]> {
    if (!days || days.length === 0) return [];

    const queryFn = client ? client.query.bind(client) : db.query;
    const values: unknown[] = [];
    const placeholders: string[] = [];

    days.forEach((day, index) => {
      const offset = index * 5;
      placeholders.push(`($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5})`);
      values.push(day.snapshotId, day.originalWorkoutDayId, day.dayNumber, day.dayName, day.notes || null);
    });

    const query = `
      INSERT INTO snapshot_workout_days (snapshot_id, original_workout_day_id, day_number, day_name, notes)
      VALUES ${placeholders.join(', ')}
      RETURNING *
    `;

    const result = await queryFn(query, values);
    return result.rows.map((row) => this.transformRow(row as Record<string, unknown>)!).filter(Boolean);
  }
}
