import { ExerciseModel, type ExerciseResponse } from '../models/exerciseModel';
import { WorkoutDayModel } from '../models/workoutDayModel';

export class ExerciseService {
  static async create(data: {
    workoutDayId: number;
    muscleGroupId: number;
    exerciseName: string;
    totalReps?: number;
    weight?: number;
    totalSets?: number;
    notes?: string | null;
  }): Promise<ExerciseResponse | null> {
    const dayExists = await WorkoutDayModel.exists(data.workoutDayId);
    if (!dayExists) {
      throw new Error('Workout day not found');
    }
    return ExerciseModel.create(data);
  }

  static async getById(id: number): Promise<ExerciseResponse> {
    const exercise = await ExerciseModel.findById(id);
    if (!exercise) {
      throw new Error('Exercise not found');
    }
    return exercise;
  }

  static async update(
    id: number,
    data: { exerciseName?: string; totalReps?: number; weight?: number; totalSets?: number; notes?: string | null }
  ): Promise<ExerciseResponse | null> {
    const exists = await ExerciseModel.exists(id);
    if (!exists) {
      throw new Error('Exercise not found');
    }
    return ExerciseModel.update(id, data);
  }

  static async delete(id: number): Promise<void> {
    const exists = await ExerciseModel.exists(id);
    if (!exists) {
      throw new Error('Exercise not found');
    }
    await ExerciseModel.delete(id);
  }
}
