/**
 * Structured API error contract and error classes.
 * All API errors are returned in the format: { error: { code, message, details? } }
 */

export interface ErrorResponseBody {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export class ApiError extends Error {
  readonly statusCode: number;
  readonly errorCode: string;
  readonly details?: unknown;

  constructor(
    message: string,
    statusCode: number,
    errorCode: string,
    details?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.details = details;
    Object.setPrototypeOf(this, new.target.prototype);
  }

  toResponseBody(): ErrorResponseBody {
    const body: ErrorResponseBody = {
      error: {
        code: this.errorCode,
        message: this.message,
      },
    };
    if (this.details !== undefined) {
      body.error.details = this.details;
    }
    return body;
  }
}

export class ValidationError extends ApiError {
  constructor(message: string, details?: unknown) {
    super(message, 400, 'VALIDATION_ERROR', details);
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends ApiError {
  constructor(message: string, details?: unknown) {
    super(message, 404, 'NOT_FOUND', details);
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends ApiError {
  constructor(message: string, details?: unknown) {
    super(message, 409, 'CONFLICT', details);
    this.name = 'ConflictError';
  }
}

export class InternalServerError extends ApiError {
  constructor(message: string, details?: unknown) {
    super(message, 500, 'INTERNAL_SERVER_ERROR', details);
    this.name = 'InternalServerError';
  }
}

export function isApiError(err: unknown): err is ApiError {
  return err instanceof ApiError;
}
