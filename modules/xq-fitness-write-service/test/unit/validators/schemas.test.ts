import {
  createRoutineSchema,
  updateRoutineSchema,
  createWorkoutDaySchema,
  updateWorkoutDaySchema,
  createWorkoutDaySetSchema,
  updateWorkoutDaySetSchema,
} from '../../../src/validators/schemas';

describe('Validation Schemas', () => {
  describe('createRoutineSchema', () => {
    describe('Happy path', () => {
      it('should validate a complete routine with all fields', () => {
        const validData = {
          name: 'Full Body Workout',
          description: 'A complete full body routine',
          isActive: true,
        };

        const { error, value } = createRoutineSchema.validate(validData);

        expect(error).toBeUndefined();
        expect(value).toEqual(validData);
      });

      it('should validate routine with only required fields', () => {
        const validData = {
          name: 'Minimal Routine',
        };

        const { error, value } = createRoutineSchema.validate(validData);

        expect(error).toBeUndefined();
        expect(value.name).toBe('Minimal Routine');
        expect(value.isActive).toBe(true); // default value
      });

      it('should accept null description', () => {
        const validData = {
          name: 'Routine',
          description: null,
        };

        const { error } = createRoutineSchema.validate(validData);

        expect(error).toBeUndefined();
      });

      it('should accept empty string description', () => {
        const validData = {
          name: 'Routine',
          description: '',
        };

        const { error } = createRoutineSchema.validate(validData);

        expect(error).toBeUndefined();
      });

      it('should handle isActive as false', () => {
        const validData = {
          name: 'Inactive Routine',
          isActive: false,
        };

        const { error, value } = createRoutineSchema.validate(validData);

        expect(error).toBeUndefined();
        expect(value.isActive).toBe(false);
      });
    });

    describe('Validation errors', () => {
      it('should fail when name is missing', () => {
        const invalidData = {
          description: 'No name provided',
        };

        const { error } = createRoutineSchema.validate(invalidData);

        expect(error).toBeDefined();
        expect(error!.details[0].message).toContain('"name" is required');
      });

      it('should fail when name is empty string', () => {
        const invalidData = {
          name: '',
        };

        const { error } = createRoutineSchema.validate(invalidData);

        expect(error).toBeDefined();
        expect(error!.details[0].message).toContain('"name"');
      });

      it('should fail when name exceeds 200 characters', () => {
        const invalidData = {
          name: 'a'.repeat(201),
        };

        const { error } = createRoutineSchema.validate(invalidData);

        expect(error).toBeDefined();
        expect(error!.details[0].message).toContain('"name"');
      });

      it('should fail when description exceeds 1000 characters', () => {
        const invalidData = {
          name: 'Valid Name',
          description: 'a'.repeat(1001),
        };

        const { error } = createRoutineSchema.validate(invalidData);

        expect(error).toBeDefined();
        expect(error!.details[0].message).toContain('"description"');
      });

      it('should fail when isActive is not a boolean', () => {
        const invalidData = {
          name: 'Valid Name',
          isActive: 'yes',
        };

        const { error } = createRoutineSchema.validate(invalidData);

        expect(error).toBeDefined();
        expect(error!.details[0].message).toContain('"isActive"');
      });
    });

    describe('Edge cases', () => {
      it('should accept name with exactly 200 characters', () => {
        const validData = {
          name: 'a'.repeat(200),
        };

        const { error } = createRoutineSchema.validate(validData);

        expect(error).toBeUndefined();
      });

      it('should accept description with exactly 1000 characters', () => {
        const validData = {
          name: 'Valid Name',
          description: 'a'.repeat(1000),
        };

        const { error } = createRoutineSchema.validate(validData);

        expect(error).toBeUndefined();
      });

      it('should strip unknown properties', () => {
        const invalidData = {
          name: 'Valid Name',
          unknownField: 'should be stripped',
        };

        const { error, value } = createRoutineSchema.validate(invalidData, { stripUnknown: true });

        expect(error).toBeUndefined();
        expect(value).not.toHaveProperty('unknownField');
      });
    });
  });

  describe('updateRoutineSchema', () => {
    describe('Happy path', () => {
      it('should validate update with all fields', () => {
        const validData = {
          name: 'Updated Routine',
          description: 'Updated description',
          isActive: false,
        };

        const { error, value } = updateRoutineSchema.validate(validData);

        expect(error).toBeUndefined();
        expect(value).toEqual(validData);
      });

      it('should validate update with only name', () => {
        const validData = {
          name: 'New Name',
        };

        const { error } = updateRoutineSchema.validate(validData);

        expect(error).toBeUndefined();
      });

      it('should validate update with only description', () => {
        const validData = {
          description: 'New description',
        };

        const { error } = updateRoutineSchema.validate(validData);

        expect(error).toBeUndefined();
      });

      it('should validate update with only isActive', () => {
        const validData = {
          isActive: true,
        };

        const { error } = updateRoutineSchema.validate(validData);

        expect(error).toBeUndefined();
      });

      it('should accept null description for update', () => {
        const validData = {
          description: null,
        };

        const { error } = updateRoutineSchema.validate(validData);

        expect(error).toBeUndefined();
      });
    });

    describe('Validation errors', () => {
      it('should fail when no fields are provided', () => {
        const invalidData = {};

        const { error } = updateRoutineSchema.validate(invalidData);

        expect(error).toBeDefined();
        expect(error!.details[0].message).toContain('at least 1');
      });

      it('should fail when name is too long', () => {
        const invalidData = {
          name: 'a'.repeat(201),
        };

        const { error } = updateRoutineSchema.validate(invalidData);

        expect(error).toBeDefined();
      });

      it('should fail when description is too long', () => {
        const invalidData = {
          description: 'a'.repeat(1001),
        };

        const { error } = updateRoutineSchema.validate(invalidData);

        expect(error).toBeDefined();
      });

      it('should fail when name is empty string', () => {
        const invalidData = {
          name: '',
        };

        const { error } = updateRoutineSchema.validate(invalidData);

        expect(error).toBeDefined();
      });
    });
  });

  describe('createWorkoutDaySchema', () => {
    describe('Happy path', () => {
      it('should validate a complete workout day with all fields', () => {
        const validData = {
          routineId: 1,
          dayNumber: 1,
          dayName: 'Push Day',
          notes: 'Focus on chest and triceps',
        };

        const { error, value } = createWorkoutDaySchema.validate(validData);

        expect(error).toBeUndefined();
        expect(value).toEqual(validData);
      });

      it('should validate workout day with only required fields', () => {
        const validData = {
          routineId: 5,
          dayNumber: 2,
          dayName: 'Pull Day',
        };

        const { error } = createWorkoutDaySchema.validate(validData);

        expect(error).toBeUndefined();
      });

      it('should accept null notes', () => {
        const validData = {
          routineId: 1,
          dayNumber: 1,
          dayName: 'Leg Day',
          notes: null,
        };

        const { error } = createWorkoutDaySchema.validate(validData);

        expect(error).toBeUndefined();
      });

      it('should accept empty string notes', () => {
        const validData = {
          routineId: 1,
          dayNumber: 1,
          dayName: 'Rest Day',
          notes: '',
        };

        const { error } = createWorkoutDaySchema.validate(validData);

        expect(error).toBeUndefined();
      });
    });

    describe('Validation errors', () => {
      it('should fail when routineId is missing', () => {
        const invalidData = {
          dayNumber: 1,
          dayName: 'Push Day',
        };

        const { error } = createWorkoutDaySchema.validate(invalidData);

        expect(error).toBeDefined();
        expect(error!.details[0].message).toContain('"routineId" is required');
      });

      it('should fail when dayNumber is missing', () => {
        const invalidData = {
          routineId: 1,
          dayName: 'Push Day',
        };

        const { error } = createWorkoutDaySchema.validate(invalidData);

        expect(error).toBeDefined();
        expect(error!.details[0].message).toContain('"dayNumber" is required');
      });

      it('should fail when dayName is missing', () => {
        const invalidData = {
          routineId: 1,
          dayNumber: 1,
        };

        const { error } = createWorkoutDaySchema.validate(invalidData);

        expect(error).toBeDefined();
        expect(error!.details[0].message).toContain('"dayName" is required');
      });

      it('should fail when routineId is not a positive integer', () => {
        const invalidData = {
          routineId: -1,
          dayNumber: 1,
          dayName: 'Push Day',
        };

        const { error } = createWorkoutDaySchema.validate(invalidData);

        expect(error).toBeDefined();
        expect(error!.details[0].message).toContain('"routineId"');
      });

      it('should fail when routineId is zero', () => {
        const invalidData = {
          routineId: 0,
          dayNumber: 1,
          dayName: 'Push Day',
        };

        const { error } = createWorkoutDaySchema.validate(invalidData);

        expect(error).toBeDefined();
      });

      it('should fail when dayNumber is less than 1', () => {
        const invalidData = {
          routineId: 1,
          dayNumber: 0,
          dayName: 'Push Day',
        };

        const { error } = createWorkoutDaySchema.validate(invalidData);

        expect(error).toBeDefined();
        expect(error!.details[0].message).toContain('"dayNumber"');
      });

      it('should fail when dayName is empty', () => {
        const invalidData = {
          routineId: 1,
          dayNumber: 1,
          dayName: '',
        };

        const { error } = createWorkoutDaySchema.validate(invalidData);

        expect(error).toBeDefined();
      });

      it('should fail when dayName exceeds 100 characters', () => {
        const invalidData = {
          routineId: 1,
          dayNumber: 1,
          dayName: 'a'.repeat(101),
        };

        const { error } = createWorkoutDaySchema.validate(invalidData);

        expect(error).toBeDefined();
      });

      it('should fail when notes exceed 1000 characters', () => {
        const invalidData = {
          routineId: 1,
          dayNumber: 1,
          dayName: 'Push Day',
          notes: 'a'.repeat(1001),
        };

        const { error } = createWorkoutDaySchema.validate(invalidData);

        expect(error).toBeDefined();
      });

      it('should fail when routineId is a decimal', () => {
        const invalidData = {
          routineId: 1.5,
          dayNumber: 1,
          dayName: 'Push Day',
        };

        const { error } = createWorkoutDaySchema.validate(invalidData);

        expect(error).toBeDefined();
      });
    });

    describe('Edge cases', () => {
      it('should accept dayName with exactly 100 characters', () => {
        const validData = {
          routineId: 1,
          dayNumber: 1,
          dayName: 'a'.repeat(100),
        };

        const { error } = createWorkoutDaySchema.validate(validData);

        expect(error).toBeUndefined();
      });

      it('should accept notes with exactly 1000 characters', () => {
        const validData = {
          routineId: 1,
          dayNumber: 1,
          dayName: 'Push Day',
          notes: 'a'.repeat(1000),
        };

        const { error } = createWorkoutDaySchema.validate(validData);

        expect(error).toBeUndefined();
      });
    });
  });

  describe('updateWorkoutDaySchema', () => {
    describe('Happy path', () => {
      it('should validate update with all fields', () => {
        const validData = {
          dayNumber: 3,
          dayName: 'Updated Day',
          notes: 'Updated notes',
        };

        const { error, value } = updateWorkoutDaySchema.validate(validData);

        expect(error).toBeUndefined();
        expect(value).toEqual(validData);
      });

      it('should validate update with only dayNumber', () => {
        const validData = {
          dayNumber: 2,
        };

        const { error } = updateWorkoutDaySchema.validate(validData);

        expect(error).toBeUndefined();
      });

      it('should validate update with only dayName', () => {
        const validData = {
          dayName: 'New Name',
        };

        const { error } = updateWorkoutDaySchema.validate(validData);

        expect(error).toBeUndefined();
      });

      it('should validate update with only notes', () => {
        const validData = {
          notes: 'Updated notes',
        };

        const { error } = updateWorkoutDaySchema.validate(validData);

        expect(error).toBeUndefined();
      });

      it('should accept null notes for update', () => {
        const validData = {
          notes: null,
        };

        const { error } = updateWorkoutDaySchema.validate(validData);

        expect(error).toBeUndefined();
      });
    });

    describe('Validation errors', () => {
      it('should fail when no fields are provided', () => {
        const invalidData = {};

        const { error } = updateWorkoutDaySchema.validate(invalidData);

        expect(error).toBeDefined();
        expect(error!.details[0].message).toContain('at least 1');
      });

      it('should fail when dayNumber is less than 1', () => {
        const invalidData = {
          dayNumber: 0,
        };

        const { error } = updateWorkoutDaySchema.validate(invalidData);

        expect(error).toBeDefined();
      });

      it('should fail when dayName is empty string', () => {
        const invalidData = {
          dayName: '',
        };

        const { error } = updateWorkoutDaySchema.validate(invalidData);

        expect(error).toBeDefined();
      });

      it('should fail when dayName is too long', () => {
        const invalidData = {
          dayName: 'a'.repeat(101),
        };

        const { error } = updateWorkoutDaySchema.validate(invalidData);

        expect(error).toBeDefined();
      });

      it('should fail when notes are too long', () => {
        const invalidData = {
          notes: 'a'.repeat(1001),
        };

        const { error } = updateWorkoutDaySchema.validate(invalidData);

        expect(error).toBeDefined();
      });
    });
  });

  describe('createWorkoutDaySetSchema', () => {
    describe('Happy path', () => {
      it('should validate a complete workout day set with all fields', () => {
        const validData = {
          workoutDayId: 1,
          muscleGroupId: 2,
          numberOfSets: 4,
          notes: 'Heavy weight focus',
        };

        const { error, value } = createWorkoutDaySetSchema.validate(validData);

        expect(error).toBeUndefined();
        expect(value).toEqual(validData);
      });

      it('should validate workout day set with only required fields', () => {
        const validData = {
          workoutDayId: 3,
          muscleGroupId: 5,
          numberOfSets: 3,
        };

        const { error } = createWorkoutDaySetSchema.validate(validData);

        expect(error).toBeUndefined();
      });

      it('should accept null notes', () => {
        const validData = {
          workoutDayId: 1,
          muscleGroupId: 2,
          numberOfSets: 5,
          notes: null,
        };

        const { error } = createWorkoutDaySetSchema.validate(validData);

        expect(error).toBeUndefined();
      });

      it('should accept empty string notes', () => {
        const validData = {
          workoutDayId: 1,
          muscleGroupId: 2,
          numberOfSets: 5,
          notes: '',
        };

        const { error } = createWorkoutDaySetSchema.validate(validData);

        expect(error).toBeUndefined();
      });
    });

    describe('Validation errors', () => {
      it('should fail when workoutDayId is missing', () => {
        const invalidData = {
          muscleGroupId: 2,
          numberOfSets: 4,
        };

        const { error } = createWorkoutDaySetSchema.validate(invalidData);

        expect(error).toBeDefined();
        expect(error!.details[0].message).toContain('"workoutDayId" is required');
      });

      it('should fail when muscleGroupId is missing', () => {
        const invalidData = {
          workoutDayId: 1,
          numberOfSets: 4,
        };

        const { error } = createWorkoutDaySetSchema.validate(invalidData);

        expect(error).toBeDefined();
        expect(error!.details[0].message).toContain('"muscleGroupId" is required');
      });

      it('should fail when numberOfSets is missing', () => {
        const invalidData = {
          workoutDayId: 1,
          muscleGroupId: 2,
        };

        const { error } = createWorkoutDaySetSchema.validate(invalidData);

        expect(error).toBeDefined();
        expect(error!.details[0].message).toContain('"numberOfSets" is required');
      });

      it('should fail when workoutDayId is not a positive integer', () => {
        const invalidData = {
          workoutDayId: -1,
          muscleGroupId: 2,
          numberOfSets: 4,
        };

        const { error } = createWorkoutDaySetSchema.validate(invalidData);

        expect(error).toBeDefined();
      });

      it('should fail when muscleGroupId is zero', () => {
        const invalidData = {
          workoutDayId: 1,
          muscleGroupId: 0,
          numberOfSets: 4,
        };

        const { error } = createWorkoutDaySetSchema.validate(invalidData);

        expect(error).toBeDefined();
      });

      it('should fail when numberOfSets is less than 1', () => {
        const invalidData = {
          workoutDayId: 1,
          muscleGroupId: 2,
          numberOfSets: 0,
        };

        const { error } = createWorkoutDaySetSchema.validate(invalidData);

        expect(error).toBeDefined();
        expect(error!.details[0].message).toContain('"numberOfSets"');
      });

      it('should fail when notes exceed 1000 characters', () => {
        const invalidData = {
          workoutDayId: 1,
          muscleGroupId: 2,
          numberOfSets: 4,
          notes: 'a'.repeat(1001),
        };

        const { error } = createWorkoutDaySetSchema.validate(invalidData);

        expect(error).toBeDefined();
      });

      it('should fail when workoutDayId is a decimal', () => {
        const invalidData = {
          workoutDayId: 1.5,
          muscleGroupId: 2,
          numberOfSets: 4,
        };

        const { error } = createWorkoutDaySetSchema.validate(invalidData);

        expect(error).toBeDefined();
      });
    });

    describe('Edge cases', () => {
      it('should accept numberOfSets equal to 1', () => {
        const validData = {
          workoutDayId: 1,
          muscleGroupId: 2,
          numberOfSets: 1,
        };

        const { error } = createWorkoutDaySetSchema.validate(validData);

        expect(error).toBeUndefined();
      });

      it('should accept notes with exactly 1000 characters', () => {
        const validData = {
          workoutDayId: 1,
          muscleGroupId: 2,
          numberOfSets: 4,
          notes: 'a'.repeat(1000),
        };

        const { error } = createWorkoutDaySetSchema.validate(validData);

        expect(error).toBeUndefined();
      });

      it('should accept very large positive integers for IDs', () => {
        const validData = {
          workoutDayId: 999999,
          muscleGroupId: 888888,
          numberOfSets: 10,
        };

        const { error } = createWorkoutDaySetSchema.validate(validData);

        expect(error).toBeUndefined();
      });
    });
  });

  describe('updateWorkoutDaySetSchema', () => {
    describe('Happy path', () => {
      it('should validate update with all fields', () => {
        const validData = {
          numberOfSets: 5,
          notes: 'Increased volume',
        };

        const { error, value } = updateWorkoutDaySetSchema.validate(validData);

        expect(error).toBeUndefined();
        expect(value).toEqual(validData);
      });

      it('should validate update with only numberOfSets', () => {
        const validData = {
          numberOfSets: 3,
        };

        const { error } = updateWorkoutDaySetSchema.validate(validData);

        expect(error).toBeUndefined();
      });

      it('should validate update with only notes', () => {
        const validData = {
          notes: 'Focus on form',
        };

        const { error } = updateWorkoutDaySetSchema.validate(validData);

        expect(error).toBeUndefined();
      });

      it('should accept null notes for update', () => {
        const validData = {
          notes: null,
        };

        const { error } = updateWorkoutDaySetSchema.validate(validData);

        expect(error).toBeUndefined();
      });
    });

    describe('Validation errors', () => {
      it('should fail when no fields are provided', () => {
        const invalidData = {};

        const { error } = updateWorkoutDaySetSchema.validate(invalidData);

        expect(error).toBeDefined();
        expect(error!.details[0].message).toContain('at least 1');
      });

      it('should fail when numberOfSets is less than 1', () => {
        const invalidData = {
          numberOfSets: 0,
        };

        const { error } = updateWorkoutDaySetSchema.validate(invalidData);

        expect(error).toBeDefined();
      });

      it('should fail when numberOfSets is negative', () => {
        const invalidData = {
          numberOfSets: -5,
        };

        const { error } = updateWorkoutDaySetSchema.validate(invalidData);

        expect(error).toBeDefined();
      });

      it('should fail when notes exceed 1000 characters', () => {
        const invalidData = {
          notes: 'a'.repeat(1001),
        };

        const { error } = updateWorkoutDaySetSchema.validate(invalidData);

        expect(error).toBeDefined();
      });

      it('should fail when numberOfSets is a decimal', () => {
        const invalidData = {
          numberOfSets: 3.5,
        };

        const { error } = updateWorkoutDaySetSchema.validate(invalidData);

        expect(error).toBeDefined();
      });
    });

    describe('Edge cases', () => {
      it('should accept numberOfSets equal to 1', () => {
        const validData = {
          numberOfSets: 1,
        };

        const { error } = updateWorkoutDaySetSchema.validate(validData);

        expect(error).toBeUndefined();
      });

      it('should accept notes with exactly 1000 characters', () => {
        const validData = {
          notes: 'a'.repeat(1000),
        };

        const { error } = updateWorkoutDaySetSchema.validate(validData);

        expect(error).toBeUndefined();
      });
    });
  });
});
