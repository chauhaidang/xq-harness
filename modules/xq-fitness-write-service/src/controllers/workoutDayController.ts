import type { Request, Response } from 'express';
import { WorkoutDayModel } from '../models/workoutDayModel';
import { RoutineModel } from '../models/routineModel';
import { getParam } from '../utils/params';

interface DbError extends Error {
  code?: string;
}

export class WorkoutDayController {
  static async createWorkoutDay(req: Request, res: Response): Promise<void> {
    try {
      const body = req.validatedBody as { routineId: number; dayNumber: number; dayName: string; notes?: string };
      const routineExists = await RoutineModel.exists(body.routineId);

      if (!routineExists) {
        res.status(404).json({
          code: 'NOT_FOUND',
          message: 'Routine not found',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const workoutDay = await WorkoutDayModel.create(body);
      res.status(201).json(workoutDay);
    } catch (error) {
      const err = error as DbError;
      console.error('Error creating workout day:', error);
      if (err.code === '23505') {
        res.status(400).json({
          code: 'DUPLICATE_ERROR',
          message: 'A workout day with this day number already exists for this routine',
          timestamp: new Date().toISOString(),
        });
        return;
      }
      res.status(500).json({
        code: 'INTERNAL_ERROR',
        message: err.message,
        timestamp: new Date().toISOString(),
      });
    }
  }

  static async updateWorkoutDay(req: Request, res: Response): Promise<void> {
    try {
      const dayId = getParam(req, 'dayId');
      const exists = await WorkoutDayModel.exists(dayId);

      if (!exists) {
        res.status(404).json({
          code: 'NOT_FOUND',
          message: 'Workout day not found',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const workoutDay = await WorkoutDayModel.update(dayId, req.validatedBody as { dayNumber?: number; dayName?: string; notes?: string });
      res.status(200).json(workoutDay);
    } catch (error) {
      const err = error as Error;
      console.error('Error updating workout day:', error);
      res.status(500).json({
        code: 'INTERNAL_ERROR',
        message: err.message,
        timestamp: new Date().toISOString(),
      });
    }
  }

  static async deleteWorkoutDay(req: Request, res: Response): Promise<void> {
    try {
      const dayId = getParam(req, 'dayId');
      const deleted = await WorkoutDayModel.delete(dayId);

      if (!deleted) {
        res.status(404).json({
          code: 'NOT_FOUND',
          message: 'Workout day not found',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      res.status(204).send();
    } catch (error) {
      const err = error as Error;
      console.error('Error deleting workout day:', error);
      res.status(500).json({
        code: 'INTERNAL_ERROR',
        message: err.message,
        timestamp: new Date().toISOString(),
      });
    }
  }
}
