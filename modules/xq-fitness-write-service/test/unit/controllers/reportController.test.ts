import request from 'supertest';
import express from 'express';
import * as reportController from '../../../src/controllers/reportController';

jest.mock('../../../src/services/reportService', () => ({
  getWeeklyReport: jest.fn(),
}));

import * as reportService from '../../../src/services/reportService';

const app = express();
app.use(express.json());
app.get('/api/v1/routines/:routineId/weekly-report', reportController.getWeeklyReport);

describe('reportController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('returns 400 for invalid routineId', async () => {
    const res = await request(app).get('/api/v1/routines/abc/weekly-report');
    expect(res.status).toBe(400);
  });

  test('returns 404 when routine not found', async () => {
    (reportService.getWeeklyReport as jest.Mock).mockRejectedValue(new Error('Routine not found: 99'));
    const res = await request(app).get('/api/v1/routines/99/weekly-report');
    expect(res.status).toBe(404);
  });

  test('returns 200 with weekly report', async () => {
    (reportService.getWeeklyReport as jest.Mock).mockResolvedValue({
      routineId: 1,
      weekStartDate: '2024-12-02',
      hasSnapshot: false,
      snapshotCreatedAt: null,
      muscleGroupTotals: [],
      exerciseTotals: [],
    });
    const res = await request(app).get('/api/v1/routines/1/weekly-report');
    expect(res.status).toBe(200);
    expect(res.body.routineId).toBe(1);
  });
});
