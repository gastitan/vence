import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from './server.js';

describe('POST /api/v1/rules/validate', () => {
  it('valid RangeRule returns 200 and valid true', async () => {
    const res = await request(app)
      .post('/api/v1/rules/validate')
      .send({
        rule: {
          type: 'RANGE',
          closingRangeStart: 5,
          closingRangeEnd: 11,
          dueOffsetDays: 8,
          preferredWeekday: 1,
        },
      })
      .expect(200);

    expect(res.body).toEqual({ valid: true });
  });

  it('valid FIXED_DAY rule with day alias returns 200 and valid true', async () => {
    const res = await request(app)
      .post('/api/v1/rules/validate')
      .send({ rule: { type: 'FIXED_DAY', day: 15 } })
      .expect(200);

    expect(res.body).toEqual({ valid: true });
  });

  it('invalid RangeRule (start > end) returns 400 with structured error', async () => {
    const res = await request(app)
      .post('/api/v1/rules/validate')
      .send({
        rule: {
          type: 'RANGE',
          closingRangeStart: 20,
          closingRangeEnd: 10,
          dueOffsetDays: 5,
        },
      })
      .expect(400);

    expect(res.body).toMatchObject({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid request body',
        details: expect.any(Array),
      },
    });
    const refineMessage = 'closingRangeStart must be less than or equal to closingRangeEnd';
    const hasRefineError = (res.body.error.details as Array<{ message?: string }>).some(
      (d) => d.message === refineMessage
    );
    expect(hasRefineError).toBe(true);
  });
});

describe('GET /api/v1/health', () => {
  it('returns 200 and status ok', async () => {
    const res = await request(app).get('/api/v1/health').expect(200);
    expect(res.body).toEqual({ status: 'ok' });
  });
});
