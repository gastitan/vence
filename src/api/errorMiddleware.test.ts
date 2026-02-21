import { describe, it, expect, afterEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import { errorMiddleware } from './errorMiddleware.js';
import { ValidationError, NotFoundError } from './errors.js';

function createApp(throwInRoute: () => void) {
  const app = express();
  app.use(express.json());
  app.post('/throw', () => {
    throwInRoute();
  });
  app.use(errorMiddleware);
  return app;
}

describe('errorMiddleware', () => {
  const env = process.env.NODE_ENV;

  afterEach(() => {
    process.env.NODE_ENV = env;
  });

  it('maps ValidationError to 400 and structured body', async () => {
    const app = createApp(() => {
      throw new ValidationError('Bad input', { field: 'x' });
    });
    const res = await request(app).post('/throw').expect(400);
    expect(res.body).toEqual({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Bad input',
        details: { field: 'x' },
      },
    });
  });

  it('maps NotFoundError to 404 and structured body', async () => {
    const app = createApp(() => {
      throw new NotFoundError('Resource missing', { id: 42 });
    });
    const res = await request(app).post('/throw').expect(404);
    expect(res.body).toEqual({
      error: {
        code: 'NOT_FOUND',
        message: 'Resource missing',
        details: { id: 42 },
      },
    });
  });

  it('maps unknown Error to 500 with structured body', async () => {
    process.env.NODE_ENV = 'development';
    const app = createApp(() => {
      throw new Error('Something broke');
    });
    const res = await request(app).post('/throw').expect(500);
    expect(res.body.error.code).toBe('INTERNAL_SERVER_ERROR');
    expect(res.body.error.message).toBe('Something broke');
    expect(res.body.error.details).toBeDefined();
    expect((res.body.error.details as { stack?: string }).stack).toBeDefined();
  });

  it('does not leak stack in production for unknown errors', async () => {
    process.env.NODE_ENV = 'production';
    const app = createApp(() => {
      throw new Error('Secret internal detail');
    });
    const res = await request(app).post('/throw').expect(500);
    expect(res.body).toMatchObject({
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An unexpected error occurred',
      },
    });
    expect(res.body.error.details).toBeUndefined();
  });
});
