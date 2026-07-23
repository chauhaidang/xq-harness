import express from 'express';
import { validate } from '../middleware/validator';
import * as schemas from '../validators/schemas';
import * as readController from '../controllers/readController';
import * as reportController from '../controllers/reportController';
import { RoutineController } from '../controllers/routineController';
import { WorkoutDayController } from '../controllers/workoutDayController';
import { WorkoutDaySetController } from '../controllers/workoutDaySetController';
import { ExerciseController } from '../controllers/exerciseController';
import { SnapshotController } from '../controllers/snapshotController';

const router = express.Router();

// Read routes
router.get('/muscle-groups', readController.getMuscleGroups);
router.get('/routines', readController.getRoutines);
router.get('/routines/:routineId', readController.getRoutineById);
router.get('/routines/:routineId/days', readController.getWorkoutDays);
router.get('/routines/:routineId/weekly-report', reportController.getWeeklyReport);
router.get('/exercises', readController.getExercises);

// Write routes
router.post('/routines', validate(schemas.createRoutineSchema), RoutineController.createRoutine);
router.put('/routines/:routineId', validate(schemas.updateRoutineSchema), RoutineController.updateRoutine);
router.delete('/routines/:routineId', RoutineController.deleteRoutine);

router.post('/workout-days', validate(schemas.createWorkoutDaySchema), WorkoutDayController.createWorkoutDay);
router.put('/workout-days/:dayId', validate(schemas.updateWorkoutDaySchema), WorkoutDayController.updateWorkoutDay);
router.delete('/workout-days/:dayId', WorkoutDayController.deleteWorkoutDay);

router.post(
  '/workout-day-sets',
  validate(schemas.createWorkoutDaySetSchema),
  WorkoutDaySetController.createWorkoutDaySet
);
router.put(
  '/workout-day-sets/:setId',
  validate(schemas.updateWorkoutDaySetSchema),
  WorkoutDaySetController.updateWorkoutDaySet
);
router.delete('/workout-day-sets/:setId', WorkoutDaySetController.deleteWorkoutDaySet);

router.post('/exercises', validate(schemas.createExerciseSchema), ExerciseController.createExercise);
router.get('/exercises/:exerciseId', ExerciseController.getExercise);
router.put('/exercises/:exerciseId', validate(schemas.updateExerciseSchema), ExerciseController.updateExercise);
router.delete('/exercises/:exerciseId', ExerciseController.deleteExercise);

router.post('/routines/:routineId/snapshots', SnapshotController.createSnapshot);

export default router;
