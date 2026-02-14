import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from './server.js';

describe('POST /calculate', () => {
  it('returns calculated date for FIXED_DAY rule when reference date is before the fixed day', async () => {
    const response = await request(app)
      .post('/calculate')
      .send({
        rule: { type: 'FIXED_DAY', dayOfMonth: 20 },
        referenceDate: '2025-01-10',
      })
      .expect(200);

    expect(response.body).toEqual({
      calculatedDate: '2025-01-20',
      isEstimated: false,
      confidence: 1.0,
    });
  });

  it('returns calculated date in next month when reference date is after the fixed day', async () => {
    const response = await request(app)
      .post('/calculate')
      .send({
        rule: { type: 'FIXED_DAY', dayOfMonth: 5 },
        referenceDate: '2025-01-10',
      })
      .expect(200);

    expect(response.body).toEqual({
      calculatedDate: '2025-02-05',
      isEstimated: false,
      confidence: 1.0,
    });
  });
});
