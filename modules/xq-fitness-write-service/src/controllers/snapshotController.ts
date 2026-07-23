import type { Request, Response } from 'express';
import Joi from 'joi';
import { SnapshotService } from '../services/snapshotService';
import { RoutineModel } from '../models/routineModel';
import { getParam } from '../utils/params';

interface DbError extends Error {
  code?: string;
}

export class SnapshotController {
  static async createSnapshot(req: Request, res: Response): Promise<void> {
    try {
      const routineId = getParam(req, 'routineId');

      const routineIdSchema = Joi.number().integer().positive().required();
      const { error, value } = routineIdSchema.validate(parseInt(routineId, 10));

      if (error) {
        res.status(400).json({
          code: 'VALIDATION_ERROR',
          message: 'Invalid routineId parameter',
          timestamp: new Date().toISOString(),
          details: error.details.map((d) => d.message),
        });
        return;
      }

      const validatedRoutineId = value as number;

      const routineExists = await RoutineModel.exists(validatedRoutineId);
      if (!routineExists) {
        res.status(404).json({
          code: 'NOT_FOUND',
          message: 'Routine not found',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const snapshot = await SnapshotService.createSnapshot(validatedRoutineId);

      res.status(201).json(snapshot);
    } catch (error) {
      const err = error as DbError;
      console.error('Error creating snapshot:', error);

      if (err.message === 'Routine not found') {
        res.status(404).json({
          code: 'NOT_FOUND',
          message: err.message,
          timestamp: new Date().toISOString(),
        });
        return;
      }

      if (err.code && err.code.startsWith('23')) {
        res.status(400).json({
          code: 'VALIDATION_ERROR',
          message: 'Invalid snapshot data',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      res.status(500).json({
        code: 'INTERNAL_ERROR',
        message: err.message || 'Failed to create snapshot',
        timestamp: new Date().toISOString(),
      });
    }
  }
}
