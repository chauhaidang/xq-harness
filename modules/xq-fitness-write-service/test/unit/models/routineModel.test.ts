import { RoutineModel } from '../../../src/models/routineModel';
import db from '../../../src/config/database';

jest.mock('../../../src/config/database');

const mockDb = db as jest.Mocked<typeof db>;

describe('RoutineModel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    describe('Happy path', () => {
      it('should create a routine with all fields', async () => {
        const createdAt = new Date();
        const updatedAt = new Date();
        const mockDbRow = {
          id: 1,
          name: 'Full Body Workout',
          description: 'A complete routine',
          is_active: true,
          created_at: createdAt,
          updated_at: updatedAt,
        };

        mockDb.query.mockResolvedValue({ rows: [mockDbRow] } as never);

        const data = {
          name: 'Full Body Workout',
          description: 'A complete routine',
          isActive: true,
        };

        const result = await RoutineModel.create(data);

        expect(mockDb.query).toHaveBeenCalledTimes(1);
        expect(mockDb.query).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO workout_routines'), [
          'Full Body Workout',
          'A complete routine',
          true,
        ]);
        expect(result).toEqual({
          id: 1,
          name: 'Full Body Workout',
          description: 'A complete routine',
          isActive: true,
          createdAt: createdAt,
          updatedAt: updatedAt,
        });
      });

      it('should create a routine with only name', async () => {
        const createdAt = new Date();
        const updatedAt = new Date();
        const mockDbRow = {
          id: 2,
          name: 'Minimal Routine',
          description: null,
          is_active: true,
          created_at: createdAt,
          updated_at: updatedAt,
        };

        mockDb.query.mockResolvedValue({ rows: [mockDbRow] } as never);

        const data = { name: 'Minimal Routine' };

        const result = await RoutineModel.create(data);

        expect(mockDb.query).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO workout_routines'), [
          'Minimal Routine',
          null,
          true,
        ]);
        expect(result).toEqual({
          id: 2,
          name: 'Minimal Routine',
          description: null,
          isActive: true,
          createdAt: createdAt,
          updatedAt: updatedAt,
        });
      });

      it('should default isActive to true when not provided', async () => {
        const mockRoutine = {
          id: 3,
          name: 'Test Routine',
          description: null,
          is_active: true,
        };

        mockDb.query.mockResolvedValue({ rows: [mockRoutine] } as never);

        const data = { name: 'Test Routine' };

        await RoutineModel.create(data);

        expect(mockDb.query).toHaveBeenCalledWith(expect.any(String), expect.arrayContaining([true]));
      });

      it('should handle isActive as false', async () => {
        const mockDbRow = {
          id: 4,
          name: 'Inactive Routine',
          description: null,
          is_active: false,
        };

        mockDb.query.mockResolvedValue({ rows: [mockDbRow] } as never);

        const data = {
          name: 'Inactive Routine',
          isActive: false,
        };

        const result = await RoutineModel.create(data);

        expect(mockDb.query).toHaveBeenCalledWith(expect.any(String), ['Inactive Routine', null, false]);
        expect(result!.isActive).toBe(false);
      });

      it('should convert undefined description to null', async () => {
        const mockRoutine = {
          id: 5,
          name: 'No Description',
          description: null,
          is_active: true,
        };

        mockDb.query.mockResolvedValue({ rows: [mockRoutine] } as never);

        const data = {
          name: 'No Description',
          description: undefined,
        };

        await RoutineModel.create(data);

        expect(mockDb.query).toHaveBeenCalledWith(expect.any(String), expect.arrayContaining([null]));
      });

      it('should use RETURNING clause to return created routine', async () => {
        const mockRoutine = { id: 6, name: 'Test', description: null, is_active: true, created_at: new Date(), updated_at: new Date() };
        mockDb.query.mockResolvedValue({ rows: [mockRoutine] } as never);

        await RoutineModel.create({ name: 'Test' });

        expect(mockDb.query).toHaveBeenCalledWith(expect.stringContaining('RETURNING *'), expect.any(Array));
      });
    });

    describe('Error scenarios', () => {
      it('should throw error when database query fails', async () => {
        const dbError = new Error('Database connection failed');
        mockDb.query.mockRejectedValue(dbError);

        const data = { name: 'Test Routine' };

        await expect(RoutineModel.create(data)).rejects.toThrow('Database connection failed');
      });

      it('should return null when database returns no rows', async () => {
        mockDb.query.mockResolvedValue({ rows: [] } as never);

        const data = { name: 'Test Routine' };

        const result = await RoutineModel.create(data);
        expect(result).toBeNull();
      });

      it('should propagate unique constraint violation error', async () => {
        const dbError = new Error('duplicate key value') as Error & { code?: string };
        dbError.code = '23505';
        mockDb.query.mockRejectedValue(dbError);

        await expect(RoutineModel.create({ name: 'Duplicate' })).rejects.toThrow();
      });
    });
  });

  describe('update', () => {
    describe('Happy path', () => {
      it('should update all fields', async () => {
        const updatedAt = new Date();
        const mockDbRow = {
          id: 1,
          name: 'Updated Name',
          description: 'Updated description',
          is_active: false,
          updated_at: updatedAt,
        };

        mockDb.query.mockResolvedValue({ rows: [mockDbRow] } as never);

        const data = {
          name: 'Updated Name',
          description: 'Updated description',
          isActive: false,
        };

        const result = await RoutineModel.update(1, data);

        expect(mockDb.query).toHaveBeenCalledTimes(1);
        expect(mockDb.query).toHaveBeenCalledWith(
          expect.stringContaining('UPDATE workout_routines'),
          expect.arrayContaining(['Updated Name', 'Updated description', false, 1])
        );
        expect(result).toEqual({
          id: 1,
          name: 'Updated Name',
          description: 'Updated description',
          isActive: false,
          updatedAt: updatedAt,
        });
      });

      it('should update only name', async () => {
        const mockRoutine = {
          id: 1,
          name: 'New Name',
          description: 'Old description',
          is_active: true,
          created_at: new Date(),
          updated_at: new Date(),
        };

        mockDb.query.mockResolvedValue({ rows: [mockRoutine] } as never);

        const data = { name: 'New Name' };

        await RoutineModel.update(1, data);

        expect(mockDb.query).toHaveBeenCalledWith(
          expect.stringContaining('name = $1'),
          expect.arrayContaining(['New Name', 1])
        );
      });

      it('should handle non-existent routine id gracefully', async () => {
        mockDb.query.mockResolvedValue({ rows: [] } as never);

        const data = { name: 'Test' };
        const result = await RoutineModel.update(999, data);

        expect(result).toBeNull();
      });
    });

    describe('Validation and error scenarios', () => {
      it('should throw error when no fields to update', async () => {
        const data = {};

        await expect(RoutineModel.update(1, data as never)).rejects.toThrow('No fields to update');

        expect(mockDb.query).not.toHaveBeenCalled();
      });

      it('should throw error when database query fails', async () => {
        const dbError = new Error('Database error');
        mockDb.query.mockRejectedValue(dbError);

        const data = { name: 'Test' };

        await expect(RoutineModel.update(1, data)).rejects.toThrow('Database error');
      });
    });

    describe('Edge cases', () => {
      it('should handle string id parameter', async () => {
        const mockRoutine = { id: 1, name: 'Test', description: null, is_active: true, created_at: new Date(), updated_at: new Date() };
        mockDb.query.mockResolvedValue({ rows: [mockRoutine] } as never);

        await RoutineModel.update('1', { name: 'Test' });

        expect(mockDb.query).toHaveBeenCalledWith(expect.any(String), expect.arrayContaining(['Test', '1']));
      });
    });
  });

  describe('delete', () => {
    describe('Happy path', () => {
      it('should delete a routine by id', async () => {
        const mockDeleted = { id: 1 };
        mockDb.query.mockResolvedValue({ rows: [mockDeleted] } as never);

        const result = await RoutineModel.delete(1);

        expect(mockDb.query).toHaveBeenCalledTimes(1);
        expect(mockDb.query).toHaveBeenCalledWith('DELETE FROM workout_routines WHERE id = $1 RETURNING id', [1]);
        expect(result).toEqual(mockDeleted);
      });

      it('should return undefined when routine does not exist', async () => {
        mockDb.query.mockResolvedValue({ rows: [] } as never);

        const result = await RoutineModel.delete(999);

        expect(result).toBeUndefined();
      });
    });

    describe('Error scenarios', () => {
      it('should throw error when database query fails', async () => {
        const dbError = new Error('Database error');
        mockDb.query.mockRejectedValue(dbError);

        await expect(RoutineModel.delete(1)).rejects.toThrow('Database error');
      });
    });

    describe('Edge cases', () => {
      it('should handle string id parameter', async () => {
        mockDb.query.mockResolvedValue({ rows: [{ id: 1 }] } as never);

        await RoutineModel.delete('1');

        expect(mockDb.query).toHaveBeenCalledWith(expect.any(String), ['1']);
      });
    });
  });

  describe('exists', () => {
    describe('Happy path', () => {
      it('should return true when routine exists', async () => {
        mockDb.query.mockResolvedValue({ rows: [{ exists: true }] } as never);

        const result = await RoutineModel.exists(1);

        expect(mockDb.query).toHaveBeenCalledTimes(1);
        expect(mockDb.query).toHaveBeenCalledWith('SELECT EXISTS(SELECT 1 FROM workout_routines WHERE id = $1)', [1]);
        expect(result).toBe(true);
      });

      it('should return false when routine does not exist', async () => {
        mockDb.query.mockResolvedValue({ rows: [{ exists: false }] } as never);

        const result = await RoutineModel.exists(999);

        expect(result).toBe(false);
      });
    });

    describe('Error scenarios', () => {
      it('should throw error when database query fails', async () => {
        const dbError = new Error('Database error');
        mockDb.query.mockRejectedValue(dbError);

        await expect(RoutineModel.exists(1)).rejects.toThrow('Database error');
      });
    });
  });
});
