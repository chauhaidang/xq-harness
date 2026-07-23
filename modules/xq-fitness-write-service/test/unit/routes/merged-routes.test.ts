import request from 'supertest';
import express from 'express';
import routes from '../../../src/routes';

jest.mock('../../../src/services/readService', () => ({
  getAllMuscleGroups: jest.fn().mockResolvedValue([]),
  getAllRoutines: jest.fn().mockResolvedValue([]),
  getRoutineById: jest.fn().mockResolvedValue(null),
  getWorkoutDaysByRoutineId: jest.fn().mockResolvedValue([]),
  getExercisesByWorkoutDayId: jest.fn().mockResolvedValue([]),
}));

jest.mock('../../../src/services/reportService', () => ({
  getWeeklyReport: jest.fn(),
}));

jest.mock('../../../src/controllers/routineController', () => ({
  RoutineController: {
    createRoutine: jest.fn((_req: express.Request, res: express.Response) => res.status(201).json({ id: 1 })),
    updateRoutine: jest.fn((_req: express.Request, res: express.Response) => res.status(200).json({ id: 1 })),
    deleteRoutine: jest.fn((_req: express.Request, res: express.Response) => res.sendStatus(204)),
  },
}));

jest.mock('../../../src/controllers/exerciseController', () => ({
  ExerciseController: {
    createExercise: jest.fn((_req: express.Request, res: express.Response) => res.status(201).json({ id: 1 })),
    getExercise: jest.fn((_req: express.Request, res: express.Response) => res.status(200).json({ id: 1 })),
    updateExercise: jest.fn((_req: express.Request, res: express.Response) => res.status(200).json({ id: 1 })),
    deleteExercise: jest.fn((_req: express.Request, res: express.Response) => res.sendStatus(204)),
  },
}));

const app = express();
app.use(express.json());
app.use('/api/v1', routes);

describe('merged routes', () => {
  test('GET /exercises list is registered before GET /exercises/:id', async () => {
    const listRes = await request(app).get('/api/v1/exercises');
    expect(listRes.status).toBe(400);

    const byIdRes = await request(app).get('/api/v1/exercises/1');
    expect(byIdRes.status).toBe(200);
  });

  test('GET /muscle-groups is available', async () => {
    const res = await request(app).get('/api/v1/muscle-groups');
    expect(res.status).toBe(200);
  });
});
