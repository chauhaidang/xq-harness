import type { Request, Response } from 'express';
import { WorkoutDaySetModel } from '../models/workoutDaySetModel';
import { WorkoutDayModel } from '../models/workoutDayModel';
import { getParam } from '../utils/params';

interface DbError extends Error {
  code?: string;
}

export class WorkoutDaySetController {
  static async createWorkoutDaySet(req: Request, res: Response): Promise<void> {
    try {
      const body = req.validatedBody as { workoutDayId: number; muscleGroupId: number; numberOfSets: number; notes?: string };
      const dayExists = await WorkoutDayModel.exists(body.workoutDayId);

      if (!dayExists) {
        res.status(404).json({
          code: 'NOT_FOUND',
          message: 'Workout day not found',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const existingSet = await WorkoutDaySetModel.findByWorkoutDayAndMuscleGroup(body.workoutDayId, body.muscleGroupId);

      if (existingSet) {
        const updatedSet = await WorkoutDaySetModel.update(existingSet.id, body);
        res.status(200).json(updatedSet);
        return;
      }

      const workoutDaySet = await WorkoutDaySetModel.create(body);
      res.status(201).json(workoutDaySet);
    } catch (error) {
      const err = error as DbError;
      console.error('Error creating workout day set:', error);
      if (err.code === '23505') {
        res.status(400).json({
          code: 'DUPLICATE_ERROR',
          message: 'This muscle group already has a set configuration for this workout day',
          timestamp: new Date().toISOString(),
        });
        return;
      }
      if (err.code === '23503') {
        res.status(404).json({
          code: 'NOT_FOUND',
          message: 'Muscle group not found',
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

  static async updateWorkoutDaySet(req: Request, res: Response): Promise<void> {
    try {
      const setId = getParam(req, 'setId');
      const { workoutDayId, muscleGroupId } = req.query;

      let actualSetId: string | number = setId;

      if (workoutDayId || muscleGroupId) {
        if (!workoutDayId || !muscleGroupId) {
          res.status(400).json({
            code: 'VALIDATION_ERROR',
            message: 'Both workoutDayId and muscleGroupId query parameters must be provided together',
            timestamp: new Date().toISOString(),
          });
          return;
        }

        const workoutDaySet = await WorkoutDaySetModel.findByWorkoutDayAndMuscleGroup(
          parseInt(workoutDayId as string, 10),
          parseInt(muscleGroupId as string, 10)
        );

        if (!workoutDaySet) {
          res.status(404).json({
            code: 'NOT_FOUND',
            message: 'Workout day set not found for the given workout day and muscle group',
            timestamp: new Date().toISOString(),
          });
          return;
        }

        actualSetId = workoutDaySet.id;
      } else {
        const exists = await WorkoutDaySetModel.exists(setId);

        if (!exists) {
          res.status(404).json({
            code: 'NOT_FOUND',
            message: 'Workout day set not found',
            timestamp: new Date().toISOString(),
          });
          return;
        }
      }

      const workoutDaySet = await WorkoutDaySetModel.update(actualSetId, req.validatedBody as { numberOfSets?: number; notes?: string });
      res.status(200).json(workoutDaySet);
    } catch (error) {
      const err = error as Error;
      console.error('Error updating workout day set:', error);
      res.status(500).json({
        code: 'INTERNAL_ERROR',
        message: err.message,
        timestamp: new Date().toISOString(),
      });
    }
  }

  static async deleteWorkoutDaySet(req: Request, res: Response): Promise<void> {
    try {
      const setId = getParam(req, 'setId');
      const deleted = await WorkoutDaySetModel.delete(setId);

      if (!deleted) {
        res.status(404).json({
          code: 'NOT_FOUND',
          message: 'Workout day set not found',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      res.status(204).send();
    } catch (error) {
      const err = error as Error;
      console.error('Error deleting workout day set:', error);
      res.status(500).json({
        code: 'INTERNAL_ERROR',
        message: err.message,
        timestamp: new Date().toISOString(),
      });
    }
  }
}
