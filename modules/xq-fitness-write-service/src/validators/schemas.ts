import Joi from 'joi';

export const createRoutineSchema = Joi.object({
  name: Joi.string().min(1).max(200).required(),
  description: Joi.string().max(1000).allow(null, ''),
  isActive: Joi.boolean().default(true),
});

export const updateRoutineSchema = Joi.object({
  name: Joi.string().min(1).max(200),
  description: Joi.string().max(1000).allow(null, ''),
  isActive: Joi.boolean(),
}).min(1);

export const createWorkoutDaySchema = Joi.object({
  routineId: Joi.number().integer().positive().required(),
  dayNumber: Joi.number().integer().min(1).required(),
  dayName: Joi.string().min(1).max(100).required(),
  notes: Joi.string().max(1000).allow(null, ''),
});

export const updateWorkoutDaySchema = Joi.object({
  dayNumber: Joi.number().integer().min(1),
  dayName: Joi.string().min(1).max(100),
  notes: Joi.string().max(1000).allow(null, ''),
}).min(1);

export const createWorkoutDaySetSchema = Joi.object({
  workoutDayId: Joi.number().integer().positive().required(),
  muscleGroupId: Joi.number().integer().positive().required(),
  numberOfSets: Joi.number().integer().min(1).required(),
  notes: Joi.string().max(1000).allow(null, ''),
});

export const updateWorkoutDaySetSchema = Joi.object({
  numberOfSets: Joi.number().integer().min(1),
  notes: Joi.string().max(1000).allow(null, ''),
}).min(1);

export const createSnapshotSchema = Joi.object({
  routineId: Joi.number().integer().positive().required(),
});

export const createExerciseSchema = Joi.object({
  workoutDayId: Joi.number().integer().positive().required(),
  muscleGroupId: Joi.number().integer().positive().required(),
  exerciseName: Joi.string().min(1).max(200).required(),
  totalReps: Joi.number().integer().min(0).required(),
  weight: Joi.number().min(0).required(),
  totalSets: Joi.number().integer().min(0).required(),
  notes: Joi.string().max(1000).allow(null, ''),
});

export const updateExerciseSchema = Joi.object({
  exerciseName: Joi.string().min(1).max(200),
  totalReps: Joi.number().integer().min(0),
  weight: Joi.number().min(0),
  totalSets: Joi.number().integer().min(0),
  notes: Joi.string().max(1000).allow(null, ''),
}).min(1);
