import type { Request, Response } from 'express';
import { RoutineModel } from '../models/routineModel';
import { getParam } from '../utils/params';

export class RoutineController {
  static async createRoutine(req: Request, res: Response): Promise<void> {
    try {
      const routine = await RoutineModel.create(req.validatedBody as { name: string; description?: string; isActive?: boolean });
      res.status(201).json(routine);
    } catch (error) {
      const err = error as Error;
      console.error('Error creating routine:', error);
      res.status(500).json({
        code: 'INTERNAL_ERROR',
        message: err.message,
        timestamp: new Date().toISOString(),
      });
    }
  }

  static async updateRoutine(req: Request, res: Response): Promise<void> {
    try {
      const routineId = getParam(req, 'routineId');
      const exists = await RoutineModel.exists(routineId);

      if (!exists) {
        res.status(404).json({
          code: 'NOT_FOUND',
          message: 'Routine not found',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const routine = await RoutineModel.update(routineId, req.validatedBody as { name?: string; description?: string; isActive?: boolean });
      res.status(200).json(routine);
    } catch (error) {
      const err = error as Error;
      console.error('Error updating routine:', error);
      res.status(500).json({
        code: 'INTERNAL_ERROR',
        message: err.message,
        timestamp: new Date().toISOString(),
      });
    }
  }

  static async deleteRoutine(req: Request, res: Response): Promise<void> {
    try {
      const routineId = getParam(req, 'routineId');
      const deleted = await RoutineModel.delete(routineId);

      if (!deleted) {
        res.status(404).json({
          code: 'NOT_FOUND',
          message: 'Routine not found',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      res.status(204).send();
    } catch (error) {
      const err = error as Error;
      console.error('Error deleting routine:', error);
      res.status(500).json({
        code: 'INTERNAL_ERROR',
        message: err.message,
        timestamp: new Date().toISOString(),
      });
    }
  }
}
