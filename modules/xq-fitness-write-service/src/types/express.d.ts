import 'express';

declare global {
  namespace Express {
    interface Request {
      validatedBody?: Record<string, unknown>;
    }
  }
}
