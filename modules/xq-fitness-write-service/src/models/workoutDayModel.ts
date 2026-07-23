import db from '../config/database';
import type { PoolClient } from 'pg';

export interface WorkoutDayResponse {
  id: number;
  routineId: number;
  dayNumber: number;
  dayName: string;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export class WorkoutDayModel {
  static transformRow(row: Record<string, unknown> | null): WorkoutDayResponse | null {
    if (!row) return null;
    return {
      id: row.id as number,
      routineId: row.routine_id as number,
      dayNumber: row.day_number as number,
      dayName: row.day_name as string,
      notes: row.notes as string | null,
      createdAt: row.created_at as Date,
      updatedAt: row.updated_at as Date,
    };
  }

  static async create(data: { routineId: number; dayNumber: number; dayName: string; notes?: string | null }): Promise<WorkoutDayResponse | null> {
    const query = `
      INSERT INTO workout_days (routine_id, day_number, day_name, notes)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;
    const values = [data.routineId, data.dayNumber, data.dayName, data.notes || null];
    const result = await db.query(query, values);
    return this.transformRow(result.rows[0] as Record<string, unknown>);
  }

  static async update(id: string | number, data: { dayNumber?: number; dayName?: string; notes?: string | null }): Promise<WorkoutDayResponse | undefined> {
    const updates: string[] = [];
    const values: unknown[] = [];
    let paramCount = 1;

    if (data.dayNumber !== undefined) {
      updates.push(`day_number = $${paramCount++}`);
      values.push(data.dayNumber);
    }
    if (data.dayName !== undefined) {
      updates.push(`day_name = $${paramCount++}`);
      values.push(data.dayName);
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
      UPDATE workout_days
      SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await db.query(query, values);
    const row = result.rows[0] ? this.transformRow(result.rows[0] as Record<string, unknown>) : null;
    return row ?? undefined;
  }

  static async delete(id: string | number): Promise<Record<string, unknown> | undefined> {
    const query = 'DELETE FROM workout_days WHERE id = $1 RETURNING id';
    const result = await db.query(query, [id]);
    return result.rows[0] as Record<string, unknown> | undefined;
  }

  static async exists(id: string | number): Promise<boolean> {
    const query = 'SELECT EXISTS(SELECT 1 FROM workout_days WHERE id = $1)';
    const result = await db.query(query, [id]);
    return (result?.rows?.[0] as { exists?: boolean })?.exists || false;
  }

  static async findByRoutineId(routineId: number, client: PoolClient | null = null): Promise<WorkoutDayResponse[]> {
    const queryFn = client ? client.query.bind(client) : db.query;
    const query = `
      SELECT * FROM workout_days
      WHERE routine_id = $1
      ORDER BY day_number
    `;
    const result = await queryFn(query, [routineId]);
    return result.rows.map((row) => this.transformRow(row as Record<string, unknown>)!).filter(Boolean);
  }
}
