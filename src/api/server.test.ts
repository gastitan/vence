import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from './server.js';

describe('POST /api/v1/calculate', () => {
  it('returns calculated date for FIXED_DAY rule when reference date is before the fixed day', async () => {
    const response = await request(app)
      .post('/api/v1/calculate')
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
      .post('/api/v1/calculate')
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

describe('POST /api/v1/preview', () => {
  it('returns next 3 due dates for FIXED_DAY rule (day 20) starting from 2025-01-01', async () => {
    const response = await request(app)
      .post('/api/v1/preview')
      .send({
        rule: { type: 'FIXED_DAY', dayOfMonth: 20 },
        from: '2025-01-01',
        months: 3,
      })
      .expect(200);

    expect(response.body.results).toHaveLength(3);
    expect(response.body.results).toEqual([
      { calculatedDate: '2025-01-20', isEstimated: false, confidence: 1.0 },
      { calculatedDate: '2025-02-20', isEstimated: false, confidence: 1.0 },
      { calculatedDate: '2025-03-20', isEstimated: false, confidence: 1.0 },
    ]);
    const dates = response.body.results.map((r: { calculatedDate: string }) => r.calculatedDate);
    const sorted = [...dates].sort();
    expect(dates).toEqual(sorted);
  });

  it('returns sequential due dates with clamping for day 31 starting in February', async () => {
    const response = await request(app)
      .post('/api/v1/preview')
      .send({
        rule: { type: 'FIXED_DAY', dayOfMonth: 31 },
        from: '2025-02-15',
        months: 3,
      })
      .expect(200);

    expect(response.body.results).toHaveLength(3);
    expect(response.body.results[0]).toMatchObject({
      calculatedDate: '2025-02-28',
      isEstimated: true,
    });
    expect(response.body.results[1]).toMatchObject({
      calculatedDate: '2025-03-31',
      isEstimated: false,
    });
    expect(response.body.results[2]).toMatchObject({
      calculatedDate: '2025-04-30',
      isEstimated: true,
    });
    const dates = response.body.results.map((r: { calculatedDate: string }) => r.calculatedDate);
    const sorted = [...dates].sort();
    expect(dates).toEqual(sorted);
  });
});

describe('POST /api/v1/simulate-card', () => {
  it('returns 3 months of closing/due pairs for range 5-11, offset 8', async () => {
    const response = await request(app)
      .post('/api/v1/simulate-card')
      .send({
        closingRangeStart: 5,
        closingRangeEnd: 11,
        dueOffsetDays: 8,
        from: '2025-01-01',
        months: 3,
      })
      .expect(200);

    expect(response.body.cardRule).toEqual({
      closingRangeStart: 5,
      closingRangeEnd: 11,
      dueOffsetDays: 8,
    });
    expect(response.body.results).toHaveLength(3);
    expect(response.body.results).toEqual([
      {
        closingDate: '2025-01-05',
        dueDate: '2025-01-13',
        isEstimated: false,
        confidence: 1,
      },
      {
        closingDate: '2025-02-05',
        dueDate: '2025-02-13',
        isEstimated: false,
        confidence: 1,
      },
      {
        closingDate: '2025-03-05',
        dueDate: '2025-03-13',
        isEstimated: false,
        confidence: 1,
      },
    ]);
    const dueDates = response.body.results.map((r: { dueDate: string }) => r.dueDate);
    expect(dueDates).toEqual([...dueDates].sort());
  });
});
