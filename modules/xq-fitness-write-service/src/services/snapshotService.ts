import db from '../config/database';
import { WeeklySnapshotModel, type WeeklySnapshotResponse } from '../models/weeklySnapshotModel';
import { SnapshotWorkoutDayModel } from '../models/snapshotWorkoutDayModel';
import { SnapshotWorkoutDaySetModel } from '../models/snapshotWorkoutDaySetModel';
import { SnapshotExerciseModel } from '../models/snapshotExerciseModel';
import { WorkoutDayModel } from '../models/workoutDayModel';
import { WorkoutDaySetModel } from '../models/workoutDaySetModel';
import { ExerciseModel } from '../models/exerciseModel';
import { RoutineModel } from '../models/routineModel';

export class SnapshotService {
  static calculateWeekStartDate(): string {
    const now = new Date();
    const utcNow = new Date(
      Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        now.getUTCDate(),
        now.getUTCHours(),
        now.getUTCMinutes(),
        now.getUTCSeconds()
      )
    );

    const dayOfWeek = utcNow.getUTCDay();
    const isoDayOfWeek = dayOfWeek === 0 ? 7 : dayOfWeek;
    const daysToSubtract = isoDayOfWeek - 1;

    const monday = new Date(utcNow);
    monday.setUTCDate(utcNow.getUTCDate() - daysToSubtract);
    monday.setUTCHours(0, 0, 0, 0);

    const year = monday.getUTCFullYear();
    const month = String(monday.getUTCMonth() + 1).padStart(2, '0');
    const day = String(monday.getUTCDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }

  static async createSnapshot(routineId: number): Promise<WeeklySnapshotResponse | null> {
    const routineExists = await RoutineModel.exists(routineId);
    if (!routineExists) {
      throw new Error('Routine not found');
    }

    const weekStartDate = this.calculateWeekStartDate();
    const client = await db.getClient();

    try {
      await client.query('BEGIN');

      const workoutDays = await WorkoutDayModel.findByRoutineId(routineId, client);
      const workoutDaySets = await WorkoutDaySetModel.findByRoutineId(routineId, client);

      await WeeklySnapshotModel.deleteByRoutineAndWeek(routineId, weekStartDate, client);

      const snapshot = await WeeklySnapshotModel.create({ routineId, weekStartDate }, client);
      if (!snapshot) throw new Error('Failed to create snapshot');

      const snapshotDaysData = workoutDays.map((day) => ({
        snapshotId: snapshot.id,
        originalWorkoutDayId: day.id,
        dayNumber: day.dayNumber,
        dayName: day.dayName,
        notes: day.notes,
      }));

      const snapshotDays = await SnapshotWorkoutDayModel.bulkCreate(snapshotDaysData, client);

      const dayIdMap = new Map<number, number>();
      snapshotDays.forEach((snapshotDay) => {
        dayIdMap.set(snapshotDay.originalWorkoutDayId, snapshotDay.id);
      });

      const snapshotSetsData = workoutDaySets
        .filter((set) => set.numberOfSets > 0)
        .map((set) => {
          const snapshotWorkoutDayId = dayIdMap.get(set.workoutDayId);
          if (snapshotWorkoutDayId == null) return null;
          return {
            snapshotWorkoutDayId,
            originalWorkoutDaySetId: set.id,
            muscleGroupId: set.muscleGroupId,
            numberOfSets: set.numberOfSets,
            notes: set.notes,
          };
        })
        .filter((s): s is NonNullable<typeof s> => s != null);

      if (snapshotSetsData.length > 0) {
        await SnapshotWorkoutDaySetModel.bulkCreate(snapshotSetsData, client);
      }

      const workoutDayIds = workoutDays.map((day) => day.id);
      const exercises = await ExerciseModel.findByWorkoutDayIds(workoutDayIds, client);
      if (exercises.length > 0) {
        const snapshotExercisesData = exercises
          .map((ex) => {
            const snapshotWorkoutDayId = dayIdMap.get(ex.workoutDayId);
            if (snapshotWorkoutDayId == null) return null;
            return {
              snapshotWorkoutDayId,
              originalExerciseId: ex.id,
              exerciseName: ex.exerciseName,
              muscleGroupId: ex.muscleGroupId,
              totalReps: ex.totalReps,
              weight: ex.weight,
              totalSets: ex.totalSets,
              notes: ex.notes,
            };
          })
          .filter((ex): ex is NonNullable<typeof ex> => ex != null);
        if (snapshotExercisesData.length > 0) {
          await SnapshotExerciseModel.bulkCreate(snapshotExercisesData, client);
        }
      }

      await client.query('COMMIT');

      console.log(`✅ Snapshot created for routine ${routineId}, week ${weekStartDate}`);

      return snapshot;
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error creating snapshot:', error);
      throw error;
    } finally {
      client.release();
    }
  }
}
