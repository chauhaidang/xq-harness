import db from '../config/database';

export interface RoutineResponse {
  id: number;
  name: string;
  description: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class RoutineModel {
  static transformRow(row: Record<string, unknown> | null): RoutineResponse | null {
    if (!row) return null;
    return {
      id: row.id as number,
      name: row.name as string,
      description: row.description as string | null,
      isActive: row.is_active as boolean,
      createdAt: row.created_at as Date,
      updatedAt: row.updated_at as Date,
    };
  }

  static async create(data: { name: string; description?: string | null; isActive?: boolean }): Promise<RoutineResponse | null> {
    const query = `
      INSERT INTO workout_routines (name, description, is_active)
      VALUES ($1, $2, $3)
      RETURNING *
    `;
    const values = [data.name, data.description || null, data.isActive !== false];
    const result = await db.query(query, values);
    return this.transformRow(result.rows[0] as Record<string, unknown>);
  }

  static async update(id: string | number, data: { name?: string; description?: string | null; isActive?: boolean }): Promise<RoutineResponse | null> {
    const updates: string[] = [];
    const values: unknown[] = [];
    let paramCount = 1;

    if (data.name !== undefined) {
      updates.push(`name = $${paramCount++}`);
      values.push(data.name);
    }
    if (data.description !== undefined) {
      updates.push(`description = $${paramCount++}`);
      values.push(data.description);
    }
    if (data.isActive !== undefined) {
      updates.push(`is_active = $${paramCount++}`);
      values.push(data.isActive);
    }

    if (updates.length === 0) {
      throw new Error('No fields to update');
    }

    values.push(id);
    const query = `
      UPDATE workout_routines
      SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await db.query(query, values);
    return this.transformRow(result.rows[0] as Record<string, unknown>);
  }

  static async delete(id: string | number): Promise<Record<string, unknown> | undefined> {
    const query = 'DELETE FROM workout_routines WHERE id = $1 RETURNING id';
    const result = await db.query(query, [id]);
    return result.rows[0] as Record<string, unknown> | undefined;
  }

  static async exists(id: string | number): Promise<boolean> {
    const query = 'SELECT EXISTS(SELECT 1 FROM workout_routines WHERE id = $1)';
    const result = await db.query(query, [id]);
    return (result?.rows?.[0] as { exists?: boolean })?.exists || false;
  }
}
