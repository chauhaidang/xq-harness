import type { Request, Response } from 'express';
import { ExerciseService } from '../services/exerciseService';
import { getParam } from '../utils/params';

interface DbError extends Error {
  code?: string;
}

export class ExerciseController {
  static async createExercise(req: Request, res: Response): Promise<void> {
    try {
      const exercise = await ExerciseService.create(req.validatedBody as Parameters<typeof ExerciseService.create>[0]);
      res.status(201).json(exercise);
    } catch (error) {
      const err = error as DbError;
      if (err.message === 'Workout day not found') {
        res.status(404).json({
          code: 'NOT_FOUND',
          message: 'Workout day not found',
          timestamp: new Date().toISOString(),
        });
        return;
      }
      if (err.code === '23503') {
        res.status(404).json({
          code: 'NOT_FOUND',
          message: 'Workout day or muscle group not found',
          timestamp: new Date().toISOString(),
        });
        return;
      }
      console.error('Error creating exercise:', error);
      res.status(500).json({
        code: 'INTERNAL_ERROR',
        message: err.message,
        timestamp: new Date().toISOString(),
      });
    }
  }

  static async getExercise(req: Request, res: Response): Promise<void> {
    try {
      const exerciseId = getParam(req, 'exerciseId');
      const exercise = await ExerciseService.getById(parseInt(exerciseId, 10));
      res.status(200).json(exercise);
    } catch (error) {
      const err = error as Error;
      if (err.message === 'Exercise not found') {
        res.status(404).json({
          code: 'NOT_FOUND',
          message: 'Exercise not found',
          timestamp: new Date().toISOString(),
        });
        return;
      }
      console.error('Error getting exercise:', error);
      res.status(500).json({
        code: 'INTERNAL_ERROR',
        message: err.message,
        timestamp: new Date().toISOString(),
      });
    }
  }

  static async updateExercise(req: Request, res: Response): Promise<void> {
    try {
      const exerciseId = getParam(req, 'exerciseId');
      const exercise = await ExerciseService.update(parseInt(exerciseId, 10), req.validatedBody as Parameters<typeof ExerciseService.update>[1]);
      res.status(200).json(exercise);
    } catch (error) {
      const err = error as Error;
      if (err.message === 'Exercise not found') {
        res.status(404).json({
          code: 'NOT_FOUND',
          message: 'Exercise not found',
          timestamp: new Date().toISOString(),
        });
        return;
      }
      if (err.message === 'No fields to update') {
        res.status(400).json({
          code: 'VALIDATION_ERROR',
          message: 'At least one field must be provided for update',
          timestamp: new Date().toISOString(),
        });
        return;
      }
      console.error('Error updating exercise:', error);
      res.status(500).json({
        code: 'INTERNAL_ERROR',
        message: err.message,
        timestamp: new Date().toISOString(),
      });
    }
  }

  static async deleteExercise(req: Request, res: Response): Promise<void> {
    try {
      const exerciseId = getParam(req, 'exerciseId');
      await ExerciseService.delete(parseInt(exerciseId, 10));
      res.status(204).send();
    } catch (error) {
      const err = error as Error;
      if (err.message === 'Exercise not found') {
        res.status(404).json({
          code: 'NOT_FOUND',
          message: 'Exercise not found',
          timestamp: new Date().toISOString(),
        });
        return;
      }
      console.error('Error deleting exercise:', error);
      res.status(500).json({
        code: 'INTERNAL_ERROR',
        message: err.message,
        timestamp: new Date().toISOString(),
      });
    }
  }
}
