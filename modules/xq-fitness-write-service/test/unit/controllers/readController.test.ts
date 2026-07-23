import request from 'supertest';
import express from 'express';
import * as readController from '../../../src/controllers/readController';

jest.mock('../../../src/services/readService', () => ({
  getAllMuscleGroups: jest.fn(),
  getAllRoutines: jest.fn(),
  getRoutineById: jest.fn(),
  getWorkoutDaysByRoutineId: jest.fn(),
  getExercisesByWorkoutDayId: jest.fn(),
}));

import * as readService from '../../../src/services/readService';

const app = express();
app.use(express.json());
app.get('/api/v1/routines/:routineId', readController.getRoutineById);
app.get('/api/v1/routines/:routineId/days', readController.getWorkoutDays);
app.get('/api/v1/exercises', readController.getExercises);

describe('readController error paths', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('getRoutineById returns 400 for invalid id', async () => {
    const res = await request(app).get('/api/v1/routines/not-a-number');
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('BAD_REQUEST');
  });

  test('getRoutineById returns 404 when not found', async () => {
    (readService.getRoutineById as jest.Mock).mockResolvedValue(null);
    const res = await request(app).get('/api/v1/routines/42');
    expect(res.status).toBe(404);
  });

  test('getWorkoutDays returns 404 when routine has no days', async () => {
    (readService.getWorkoutDaysByRoutineId as jest.Mock).mockResolvedValue([]);
    const res = await request(app).get('/api/v1/routines/42/days');
    expect(res.status).toBe(404);
  });

  test('getExercises returns 400 when workoutDayId missing', async () => {
    const res = await request(app).get('/api/v1/exercises');
    expect(res.status).toBe(400);
    expect(res.body.message).toContain('workoutDayId');
  });
});
