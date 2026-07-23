import db from '../config/database';
import type { PoolClient } from 'pg';

export interface WeeklySnapshotResponse {
  id: number;
  routineId: number;
  weekStartDate: string;
  createdAt: Date;
  updatedAt: Date;
}

export class WeeklySnapshotModel {
  static transformRow(row: Record<string, unknown> | null): WeeklySnapshotResponse | null {
    if (!row) return null;

    let weekStartDate: string = row.week_start_date as string;
    const val = row.week_start_date;
    if (val instanceof Date) {
      const year = val.getFullYear();
      const month = String(val.getMonth() + 1).padStart(2, '0');
      const day = String(val.getDate()).padStart(2, '0');
      weekStartDate = `${year}-${month}-${day}`;
    } else if (typeof val === 'string') {
      weekStartDate = val.substring(0, 10);
    }

    return {
      id: row.id as number,
      routineId: row.routine_id as number,
      weekStartDate,
      createdAt: row.created_at as Date,
      updatedAt: row.updated_at as Date,
    };
  }

  static async create(data: { routineId: number; weekStartDate: string }, client: PoolClient | null = null): Promise<WeeklySnapshotResponse | null> {
    const queryFn = client ? client.query.bind(client) : db.query;
    const query = `
      INSERT INTO weekly_snapshots (routine_id, week_start_date)
      VALUES ($1, $2)
      RETURNING *
    `;
    const values = [data.routineId, data.weekStartDate];
    const result = await queryFn(query, values);
    return this.transformRow(result.rows[0] as Record<string, unknown>);
  }

  static async findByRoutineAndWeek(
    routineId: number,
    weekStartDate: string,
    client: PoolClient | null = null
  ): Promise<WeeklySnapshotResponse | null> {
    const queryFn = client ? client.query.bind(client) : db.query;
    const query = `
      SELECT * FROM weekly_snapshots
      WHERE routine_id = $1 AND week_start_date = $2
      LIMIT 1
    `;
    const result = await queryFn(query, [routineId, weekStartDate]);
    return result.rows.length > 0 ? this.transformRow(result.rows[0] as Record<string, unknown>) : null;
  }

  static async deleteByRoutineAndWeek(
    routineId: number,
    weekStartDate: string,
    client: PoolClient | null = null
  ): Promise<number | null> {
    const queryFn = client ? client.query.bind(client) : db.query;
    const query = `
      DELETE FROM weekly_snapshots
      WHERE routine_id = $1 AND week_start_date = $2
      RETURNING id
    `;
    const result = await queryFn(query, [routineId, weekStartDate]);
    return result.rows.length > 0 ? (result.rows[0] as { id: number }).id : null;
  }
}
