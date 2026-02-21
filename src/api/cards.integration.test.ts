import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from './server.js';
import { db } from '../infrastructure/db.js';

describe('Cards API integration', () => {
  beforeEach(() => {
    db.exec('DELETE FROM cards');
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

