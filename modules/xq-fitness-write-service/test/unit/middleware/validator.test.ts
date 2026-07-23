import Joi from 'joi';
import { validate } from '../../../src/middleware/validator';

describe('Validation Middleware', () => {
  let mockRequest: { body: Record<string, unknown>; validatedBody?: Record<string, unknown> };
  let mockResponse: { status: jest.Mock; json: jest.Mock };
  let nextFunction: jest.Mock;

  beforeEach(() => {
    mockRequest = {
      body: {},
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    nextFunction = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Happy path', () => {
    it('should call next() when validation succeeds', () => {
      const schema = Joi.object({
        name: Joi.string().required(),
      });
      mockRequest.body = { name: 'Test Name' };

      const middleware = validate(schema);
      middleware(mockRequest as never, mockResponse as never, nextFunction);

      expect(nextFunction).toHaveBeenCalledTimes(1);
      expect(mockResponse.status).not.toHaveBeenCalled();
      expect(mockResponse.json).not.toHaveBeenCalled();
    });

    it('should set validatedBody on request object', () => {
      const schema = Joi.object({
        name: Joi.string().required(),
        value: Joi.number().default(10),
      });
      mockRequest.body = { name: 'Test' };

      const middleware = validate(schema);
      middleware(mockRequest as never, mockResponse as never, nextFunction);

      expect(mockRequest.validatedBody).toBeDefined();
      expect(mockRequest.validatedBody!.name).toBe('Test');
      expect(mockRequest.validatedBody!.value).toBe(10);
    });

    it('should handle complex nested validation', () => {
      const schema = Joi.object({
        user: Joi.object({
          name: Joi.string().required(),
          age: Joi.number().min(18),
        }),
      });
      mockRequest.body = {
        user: {
          name: 'John',
          age: 25,
        },
      };

      const middleware = validate(schema);
      middleware(mockRequest as never, mockResponse as never, nextFunction);

      expect(nextFunction).toHaveBeenCalledTimes(1);
      expect(mockRequest.validatedBody).toEqual(mockRequest.body);
    });

    it('should strip unknown properties from validated body', () => {
      const schema = Joi.object({
        name: Joi.string().required(),
      });
      mockRequest.body = {
        name: 'Test',
        unknownField: 'should be removed',
      };

      const middleware = validate(schema);
      middleware(mockRequest as never, mockResponse as never, nextFunction);

      expect(nextFunction).toHaveBeenCalledTimes(1);
      expect(mockRequest.validatedBody!.name).toBe('Test');
      expect(mockRequest.validatedBody).not.toHaveProperty('unknownField');
    });

    it('should apply default values from schema', () => {
      const schema = Joi.object({
        name: Joi.string().required(),
        isActive: Joi.boolean().default(true),
      });
      mockRequest.body = { name: 'Test' };

      const middleware = validate(schema);
      middleware(mockRequest as never, mockResponse as never, nextFunction);

      expect(mockRequest.validatedBody!.isActive).toBe(true);
    });
  });

  describe('Validation errors', () => {
    it('should return 400 when validation fails', () => {
      const schema = Joi.object({
        name: Joi.string().required(),
      });
      mockRequest.body = {};

      const middleware = validate(schema);
      middleware(mockRequest as never, mockResponse as never, nextFunction);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should return error with code VALIDATION_ERROR', () => {
      const schema = Joi.object({
        name: Joi.string().required(),
      });
      mockRequest.body = {};

      const middleware = validate(schema);
      middleware(mockRequest as never, mockResponse as never, nextFunction);

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 'VALIDATION_ERROR',
        })
      );
    });

    it('should return error with message', () => {
      const schema = Joi.object({
        name: Joi.string().required(),
      });
      mockRequest.body = {};

      const middleware = validate(schema);
      middleware(mockRequest as never, mockResponse as never, nextFunction);

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Invalid request parameters',
        })
      );
    });

    it('should include timestamp in error response', () => {
      const schema = Joi.object({
        name: Joi.string().required(),
      });
      mockRequest.body = {};

      const middleware = validate(schema);
      middleware(mockRequest as never, mockResponse as never, nextFunction);

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          timestamp: expect.any(String),
        })
      );
    });

    it('should include validation details for single error', () => {
      const schema = Joi.object({
        name: Joi.string().required(),
      });
      mockRequest.body = {};

      const middleware = validate(schema);
      middleware(mockRequest as never, mockResponse as never, nextFunction);

      const jsonCall = mockResponse.json.mock.calls[0][0];
      expect(jsonCall.details).toBeDefined();
      expect(Array.isArray(jsonCall.details)).toBe(true);
      expect(jsonCall.details.length).toBeGreaterThan(0);
      expect(jsonCall.details[0]).toContain('"name" is required');
    });

    it('should include all validation errors when multiple fields are invalid', () => {
      const schema = Joi.object({
        name: Joi.string().required(),
        age: Joi.number().required(),
        email: Joi.string().email().required(),
      });
      mockRequest.body = {};

      const middleware = validate(schema);
      middleware(mockRequest as never, mockResponse as never, nextFunction);

      const jsonCall = mockResponse.json.mock.calls[0][0];
      expect(jsonCall.details.length).toBe(3);
    });

    it('should return detailed error messages for invalid types', () => {
      const schema = Joi.object({
        age: Joi.number().required(),
      });
      mockRequest.body = { age: 'not a number' };

      const middleware = validate(schema);
      middleware(mockRequest as never, mockResponse as never, nextFunction);

      const jsonCall = mockResponse.json.mock.calls[0][0];
      expect(jsonCall.details[0]).toContain('"age"');
    });

    it('should validate string length constraints', () => {
      const schema = Joi.object({
        name: Joi.string().min(5).max(10).required(),
      });
      mockRequest.body = { name: 'abc' };

      const middleware = validate(schema);
      middleware(mockRequest as never, mockResponse as never, nextFunction);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      const jsonCall = mockResponse.json.mock.calls[0][0];
      expect(jsonCall.details[0]).toContain('"name"');
    });

    it('should validate number range constraints', () => {
      const schema = Joi.object({
        count: Joi.number().min(1).max(100).required(),
      });
      mockRequest.body = { count: 0 };

      const middleware = validate(schema);
      middleware(mockRequest as never, mockResponse as never, nextFunction);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
    });

    it('should not set validatedBody when validation fails', () => {
      const schema = Joi.object({
        name: Joi.string().required(),
      });
      mockRequest.body = {};

      const middleware = validate(schema);
      middleware(mockRequest as never, mockResponse as never, nextFunction);

      expect(mockRequest.validatedBody).toBeUndefined();
    });
  });

  describe('Edge cases', () => {
    it('should handle empty body object', () => {
      const schema = Joi.object({
        name: Joi.string().required(),
      });
      mockRequest.body = {};

      const middleware = validate(schema);
      middleware(mockRequest as never, mockResponse as never, nextFunction);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
    });

    it('should handle null body', () => {
      const schema = Joi.object({
        name: Joi.string().required(),
      });
      mockRequest.body = null as never;

      const middleware = validate(schema);
      middleware(mockRequest as never, mockResponse as never, nextFunction);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
    });

    it('should handle schema with no required fields', () => {
      const schema = Joi.object({
        name: Joi.string(),
        age: Joi.number(),
      });
      mockRequest.body = {};

      const middleware = validate(schema);
      middleware(mockRequest as never, mockResponse as never, nextFunction);

      expect(nextFunction).toHaveBeenCalledTimes(1);
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should handle schema that requires at least one field', () => {
      const schema = Joi.object({
        name: Joi.string(),
        description: Joi.string(),
      }).min(1);
      mockRequest.body = {};

      const middleware = validate(schema);
      middleware(mockRequest as never, mockResponse as never, nextFunction);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      const jsonCall = mockResponse.json.mock.calls[0][0];
      expect(jsonCall.details[0]).toContain('at least 1');
    });

    it('should handle optional fields with allow(null)', () => {
      const schema = Joi.object({
        name: Joi.string().required(),
        description: Joi.string().allow(null, ''),
      });
      mockRequest.body = {
        name: 'Test',
        description: null,
      };

      const middleware = validate(schema);
      middleware(mockRequest as never, mockResponse as never, nextFunction);

      expect(nextFunction).toHaveBeenCalledTimes(1);
      expect(mockRequest.validatedBody!.description).toBeNull();
    });

    it('should handle boolean fields correctly', () => {
      const schema = Joi.object({
        isActive: Joi.boolean().required(),
      });
      mockRequest.body = { isActive: false };

      const middleware = validate(schema);
      middleware(mockRequest as never, mockResponse as never, nextFunction);

      expect(nextFunction).toHaveBeenCalledTimes(1);
      expect(mockRequest.validatedBody!.isActive).toBe(false);
    });

    it('should validate array fields', () => {
      const schema = Joi.object({
        items: Joi.array().items(Joi.string()).required(),
      });
      mockRequest.body = { items: ['item1', 'item2'] };

      const middleware = validate(schema);
      middleware(mockRequest as never, mockResponse as never, nextFunction);

      expect(nextFunction).toHaveBeenCalledTimes(1);
      expect(mockRequest.validatedBody!.items).toEqual(['item1', 'item2']);
    });

    it('should reject invalid array items', () => {
      const schema = Joi.object({
        items: Joi.array().items(Joi.number()).required(),
      });
      mockRequest.body = { items: [1, 2, 'invalid'] };

      const middleware = validate(schema);
      middleware(mockRequest as never, mockResponse as never, nextFunction);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
    });

    it('should preserve the order of validatedBody fields', () => {
      const schema = Joi.object({
        first: Joi.string(),
        second: Joi.string(),
        third: Joi.string(),
      });
      mockRequest.body = {
        first: 'a',
        second: 'b',
        third: 'c',
      };

      const middleware = validate(schema);
      middleware(mockRequest as never, mockResponse as never, nextFunction);

      const keys = Object.keys(mockRequest.validatedBody!);
      expect(keys).toEqual(['first', 'second', 'third']);
    });

    it('should handle custom error messages if schema defines them', () => {
      const schema = Joi.object({
        name: Joi.string().required().messages({ 'any.required': 'Name is mandatory' }),
      });
      mockRequest.body = {};

      const middleware = validate(schema);
      middleware(mockRequest as never, mockResponse as never, nextFunction);

      const jsonCall = mockResponse.json.mock.calls[0][0];
      expect(jsonCall.details[0]).toContain('Name is mandatory');
    });
  });

  describe('Integration with actual schemas', () => {
    it('should work with createRoutineSchema structure', () => {
      const schema = Joi.object({
        name: Joi.string().min(1).max(200).required(),
        description: Joi.string().max(1000).allow(null, ''),
        isActive: Joi.boolean().default(true),
      });
      mockRequest.body = {
        name: 'Test Routine',
        description: 'A test description',
      };

      const middleware = validate(schema);
      middleware(mockRequest as never, mockResponse as never, nextFunction);

      expect(nextFunction).toHaveBeenCalledTimes(1);
      expect(mockRequest.validatedBody!.name).toBe('Test Routine');
      expect(mockRequest.validatedBody!.isActive).toBe(true);
    });

    it('should work with updateRoutineSchema structure', () => {
      const schema = Joi.object({
        name: Joi.string().min(1).max(200),
        description: Joi.string().max(1000).allow(null, ''),
        isActive: Joi.boolean(),
      }).min(1);
      mockRequest.body = {
        name: 'Updated Name',
      };

      const middleware = validate(schema);
      middleware(mockRequest as never, mockResponse as never, nextFunction);

      expect(nextFunction).toHaveBeenCalledTimes(1);
    });

    it('should reject updateRoutineSchema with no fields', () => {
      const schema = Joi.object({
        name: Joi.string(),
        description: Joi.string(),
      }).min(1);
      mockRequest.body = {};

      const middleware = validate(schema);
      middleware(mockRequest as never, mockResponse as never, nextFunction);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
    });
  });
});
