import type { Request } from 'express';

/** Safely get a route param as string (Express types params as string | string[]) */
export function getParam(req: Request, name: string): string {
  const v = req.params[name];
  return Array.isArray(v) ? (v[0] ?? '') : (v ?? '');
}
