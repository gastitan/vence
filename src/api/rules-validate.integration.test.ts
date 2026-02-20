import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from './server.js';

describe('POST /rules/validate', () => {
  it('valid RangeRule returns 200 and valid true', async () => {
    const res = await request(app)
      .post('/rules/validate')
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

  it('invalid RangeRule (start > end) returns 400 with errors', async () => {
    const res = await request(app)
      .post('/rules/validate')
      .send({
        rule: {
          type: 'RANGE',
          closingRangeStart: 20,
          closingRangeEnd: 10,
          dueOffsetDays: 5,
        },
      })
      .expect(400);

    expect(res.body.valid).toBe(false);
    expect(Array.isArray(res.body.errors)).toBe(true);
    expect(res.body.errors).toContain(
      'closingRangeStart must be less than or equal to closingRangeEnd'
    );
  });
});

describe('GET /health', () => {
  it('returns 200 and status ok', async () => {
    const res = await request(app).get('/health').expect(200);
    expect(res.body).toEqual({ status: 'ok' });
  });
});
