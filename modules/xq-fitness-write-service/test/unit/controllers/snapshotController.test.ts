import { SnapshotController } from '../../../src/controllers/snapshotController';
import { SnapshotService } from '../../../src/services/snapshotService';
import { RoutineModel } from '../../../src/models/routineModel';

jest.mock('../../../src/services/snapshotService');
jest.mock('../../../src/models/routineModel');

const mockRoutineModel = RoutineModel as jest.Mocked<typeof RoutineModel>;
const mockSnapshotService = SnapshotService as jest.Mocked<typeof SnapshotService>;

describe('SnapshotController', () => {
  let req: { params: Record<string, string> };
  let res: { status: jest.Mock; json: jest.Mock };
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    req = {
      params: {},
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  describe('createSnapshot', () => {
    describe('Happy path', () => {
      it('should create snapshot successfully', async () => {
        req.params.routineId = '10';

        const mockSnapshot = {
          id: 1,
          routineId: 10,
          weekStartDate: '2024-12-02',
          createdAt: new Date('2024-12-02T10:00:00Z'),
        };

        mockRoutineModel.exists.mockResolvedValue(true);
        mockSnapshotService.createSnapshot.mockResolvedValue(mockSnapshot as never);

        await SnapshotController.createSnapshot(req as never, res as never);

        expect(mockRoutineModel.exists).toHaveBeenCalledWith(10);
        expect(mockSnapshotService.createSnapshot).toHaveBeenCalledWith(10);
        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json).toHaveBeenCalledWith(mockSnapshot);
      });

      it('should handle string routineId and convert to integer', async () => {
        req.params.routineId = '5';

        const mockSnapshot = {
          id: 1,
          routineId: 5,
          weekStartDate: '2024-12-02',
          createdAt: new Date(),
        };

        mockRoutineModel.exists.mockResolvedValue(true);
        mockSnapshotService.createSnapshot.mockResolvedValue(mockSnapshot as never);

        await SnapshotController.createSnapshot(req as never, res as never);

        expect(mockRoutineModel.exists).toHaveBeenCalledWith(5);
        expect(mockSnapshotService.createSnapshot).toHaveBeenCalledWith(5);
        expect(res.status).toHaveBeenCalledWith(201);
      });
    });

    describe('Validation errors', () => {
      it('should return 400 for invalid routineId (non-numeric)', async () => {
        req.params.routineId = 'invalid';

        await SnapshotController.createSnapshot(req as never, res as never);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
          code: 'VALIDATION_ERROR',
          message: 'Invalid routineId parameter',
          timestamp: expect.any(String),
          details: expect.any(Array),
        });
        expect(mockSnapshotService.createSnapshot).not.toHaveBeenCalled();
      });

      it('should return 400 for invalid routineId (negative)', async () => {
        req.params.routineId = '-1';

        await SnapshotController.createSnapshot(req as never, res as never);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
          code: 'VALIDATION_ERROR',
          message: 'Invalid routineId parameter',
          timestamp: expect.any(String),
          details: expect.any(Array),
        });
      });

      it('should return 400 for invalid routineId (zero)', async () => {
        req.params.routineId = '0';

        await SnapshotController.createSnapshot(req as never, res as never);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
          code: 'VALIDATION_ERROR',
          message: 'Invalid routineId parameter',
          timestamp: expect.any(String),
          details: expect.any(Array),
        });
      });
    });

    describe('Routine not found', () => {
      it('should return 404 when routine does not exist', async () => {
        req.params.routineId = '999';

        mockRoutineModel.exists.mockResolvedValue(false);

        await SnapshotController.createSnapshot(req as never, res as never);

        expect(mockRoutineModel.exists).toHaveBeenCalledWith(999);
        expect(mockSnapshotService.createSnapshot).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({
          code: 'NOT_FOUND',
          message: 'Routine not found',
          timestamp: expect.any(String),
        });
      });

      it('should return 404 when service throws Routine not found error', async () => {
        req.params.routineId = '10';

        mockRoutineModel.exists.mockResolvedValue(true);
        mockSnapshotService.createSnapshot.mockRejectedValue(new Error('Routine not found'));

        await SnapshotController.createSnapshot(req as never, res as never);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({
          code: 'NOT_FOUND',
          message: 'Routine not found',
          timestamp: expect.any(String),
        });
      });
    });

    describe('Database errors', () => {
      it('should return 400 for PostgreSQL constraint violation (23xx codes)', async () => {
        req.params.routineId = '10';

        const error = new Error('Constraint violation') as Error & { code?: string };
        error.code = '23505';

        mockRoutineModel.exists.mockResolvedValue(true);
        mockSnapshotService.createSnapshot.mockRejectedValue(error);

        await SnapshotController.createSnapshot(req as never, res as never);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
          code: 'VALIDATION_ERROR',
          message: 'Invalid snapshot data',
          timestamp: expect.any(String),
        });
      });
    });

    describe('Generic errors', () => {
      it('should return 500 for generic database errors', async () => {
        req.params.routineId = '10';

        const error = new Error('Database connection failed');

        mockRoutineModel.exists.mockResolvedValue(true);
        mockSnapshotService.createSnapshot.mockRejectedValue(error);

        await SnapshotController.createSnapshot(req as never, res as never);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({
          code: 'INTERNAL_ERROR',
          message: 'Database connection failed',
          timestamp: expect.any(String),
        });
      });

      it('should return 500 with default message when error has no message', async () => {
        req.params.routineId = '10';

        const error = new Error();

        mockRoutineModel.exists.mockResolvedValue(true);
        mockSnapshotService.createSnapshot.mockRejectedValue(error);

        await SnapshotController.createSnapshot(req as never, res as never);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({
          code: 'INTERNAL_ERROR',
          message: 'Failed to create snapshot',
          timestamp: expect.any(String),
        });
      });
    });
  });
});
