import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from './server.js';
import { db } from '../infrastructure/db.js';

describe('Cards API integration', () => {
  beforeEach(() => {
    db.exec('DELETE FROM cards');
  });

  it('create with invalid payload returns 400 with structured error', async () => {
    const res = await request(app)
      .post('/api/v1/cards')
      .send({ closingRangeStart: 'not-a-number', closingRangeEnd: 11, dueOffsetDays: 8 })
      .expect(400);

    expect(res.body).toMatchObject({
      error: {
        code: 'VALIDATION_ERROR',
        message: expect.any(String),
        details: expect.anything(),
      },
    });
  });

  it('delete with invalid id returns 400 with structured error', async () => {
    const res = await request(app).delete('/api/v1/cards/not-a-number').expect(400);

    expect(res.body).toMatchObject({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid id',
        details: expect.anything(),
      },
    });
  });

  it('delete non-existent card returns 404 with structured error', async () => {
    const res = await request(app).delete('/api/v1/cards/99999').expect(404);

    expect(res.body).toMatchObject({
      error: {
        code: 'NOT_FOUND',
        message: 'Card not found',
        details: { id: 99999 },
      },
    });
  });

  it('creates, lists and deletes a card', async () => {
    const createResponse = await request(app)
      .post('/api/v1/cards')
      .send({
        closingRangeStart: 5,
        closingRangeEnd: 11,
        dueOffsetDays: 8,
        preferredWeekday: 1,
      })
      .expect(201);

    expect(createResponse.body).toMatchObject({
      id: expect.any(Number),
      closingRangeStart: 5,
      closingRangeEnd: 11,
      dueOffsetDays: 8,
      preferredWeekday: 1,
    });

    const createdId = createResponse.body.id as number;

    const listResponse = await request(app).get('/api/v1/cards').expect(200);
    expect(Array.isArray(listResponse.body)).toBe(true);
    expect(listResponse.body).toHaveLength(1);
    expect(listResponse.body[0]).toMatchObject({
      id: createdId,
      closingRangeStart: 5,
      closingRangeEnd: 11,
      dueOffsetDays: 8,
      preferredWeekday: 1,
    });

    await request(app).delete(`/api/v1/cards/${createdId}`).expect(200);

    const listAfterDelete = await request(app).get('/api/v1/cards').expect(200);
    expect(Array.isArray(listAfterDelete.body)).toBe(true);
    expect(listAfterDelete.body).toHaveLength(0);
  });
});

