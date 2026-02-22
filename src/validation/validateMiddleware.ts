import type { Request, Response, NextFunction } from 'express';
import type { ZodSchema, ZodError, ZodIssue } from 'zod';

function formatZodDetails(error: ZodError): unknown {
  return error.issues.map((e: ZodIssue) => ({
    path: e.path.length > 0 ? e.path.map(String).join('.') : undefined,
    message: e.message,
  }));
}

/**
 * Express middleware: validates req.body with the given Zod schema.
 * - On success: replaces req.body with the parsed (and transformed) data.
 * - On failure: sends 400 with structured error and does not call next().
 */
export function validate<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (result.success) {
      req.body = result.data;
      next();
      return;
    }
    res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid request body',
        details: formatZodDetails(result.error),
      },
    });
  };
}
