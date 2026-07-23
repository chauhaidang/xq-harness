import { ExerciseService } from '../../../src/services/exerciseService';
import { ExerciseModel } from '../../../src/models/exerciseModel';
import { WorkoutDayModel } from '../../../src/models/workoutDayModel';

jest.mock('../../../src/models/exerciseModel');
jest.mock('../../../src/models/workoutDayModel');

const mockWorkoutDayModel = WorkoutDayModel as jest.Mocked<typeof WorkoutDayModel>;
const mockExerciseModel = ExerciseModel as jest.Mocked<typeof ExerciseModel>;

describe('ExerciseService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should call WorkoutDayModel.exists and ExerciseModel.create and return created exercise when workout day exists', async () => {
      const input = {
        workoutDayId: 1,
        muscleGroupId: 3,
        exerciseName: 'Bench Press',
        totalReps: 30,
        weight: 135,
        totalSets: 3,
        notes: 'Focus on form',
      };
      const created = {
        id: 1,
        workoutDayId: 1,
        muscleGroupId: 3,
        exerciseName: 'Bench Press',
        totalReps: 30,
        weight: 135,
        totalSets: 3,
        notes: 'Focus on form',
        createdAt: '2025-01-27T10:00:00Z',
        updatedAt: '2025-01-27T10:00:00Z',
      };

      mockWorkoutDayModel.exists.mockResolvedValue(true);
      mockExerciseModel.create.mockResolvedValue(created as never);

      const result = await ExerciseService.create(input);

      expect(mockWorkoutDayModel.exists).toHaveBeenCalledWith(1);
      expect(mockExerciseModel.create).toHaveBeenCalledWith(input);
      expect(result).toEqual(created);
    });

    it('should throw "Workout day not found" and not call ExerciseModel.create when workout day does not exist', async () => {
      mockWorkoutDayModel.exists.mockResolvedValue(false);

      await expect(
        ExerciseService.create({
          workoutDayId: 999,
          muscleGroupId: 1,
          exerciseName: 'Squat',
          totalReps: 10,
          weight: 185,
          totalSets: 3,
        })
      ).rejects.toThrow('Workout day not found');

      expect(mockExerciseModel.create).not.toHaveBeenCalled();
    });
  });

  describe('getById', () => {
    it('should call ExerciseModel.findById and return exercise when found', async () => {
      const exercise = {
        id: 1,
        workoutDayId: 1,
        muscleGroupId: 3,
        exerciseName: 'Bench Press',
        totalReps: 30,
        weight: 135,
        totalSets: 3,
        notes: null,
        createdAt: '2025-01-27T10:00:00Z',
        updatedAt: '2025-01-27T10:00:00Z',
      };

      mockExerciseModel.findById.mockResolvedValue(exercise as never);

      const result = await ExerciseService.getById(1);

      expect(mockExerciseModel.findById).toHaveBeenCalledWith(1);
      expect(result).toEqual(exercise);
    });

    it('should throw "Exercise not found" when ExerciseModel.findById returns null', async () => {
      mockExerciseModel.findById.mockResolvedValue(null as never);

      await expect(ExerciseService.getById(999)).rejects.toThrow('Exercise not found');
    });
  });

  describe('update', () => {
    it('should call ExerciseModel.exists and ExerciseModel.update and return updated exercise when found', async () => {
      const updateData = { totalReps: 35, weight: 140 };
      const updated = {
        id: 1,
        workoutDayId: 1,
        muscleGroupId: 3,
        exerciseName: 'Bench Press',
        totalReps: 35,
        weight: 140,
        totalSets: 3,
        notes: null,
        createdAt: '2025-01-27T10:00:00Z',
        updatedAt: '2025-01-27T10:15:00Z',
      };

      mockExerciseModel.exists.mockResolvedValue(true);
      mockExerciseModel.update.mockResolvedValue(updated as never);

      const result = await ExerciseService.update(1, updateData);

      expect(mockExerciseModel.exists).toHaveBeenCalledWith(1);
      expect(mockExerciseModel.update).toHaveBeenCalledWith(1, updateData);
      expect(result).toEqual(updated);
    });

    it('should throw "Exercise not found" and not call ExerciseModel.update when exercise does not exist', async () => {
      mockExerciseModel.exists.mockResolvedValue(false);

      await expect(ExerciseService.update(999, { totalReps: 35 })).rejects.toThrow('Exercise not found');
      expect(mockExerciseModel.update).not.toHaveBeenCalled();
    });
  });

  describe('delete', () => {
    it('should call ExerciseModel.exists and ExerciseModel.delete when exercise found', async () => {
      mockExerciseModel.exists.mockResolvedValue(true);
      mockExerciseModel.delete.mockResolvedValue(undefined as never);

      await ExerciseService.delete(1);

      expect(mockExerciseModel.exists).toHaveBeenCalledWith(1);
      expect(mockExerciseModel.delete).toHaveBeenCalledWith(1);
    });

    it('should throw "Exercise not found" and not call ExerciseModel.delete when exercise does not exist', async () => {
      mockExerciseModel.exists.mockResolvedValue(false);

      await expect(ExerciseService.delete(999)).rejects.toThrow('Exercise not found');
      expect(mockExerciseModel.delete).not.toHaveBeenCalled();
    });
  });
});
