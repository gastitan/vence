import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from './server.js';
import { prisma } from '../infrastructure/prisma/client.js';

describe('Cards API integration', () => {
  beforeEach(async () => {
    await prisma.bill.deleteMany({});
    await prisma.rule.deleteMany({});
    await prisma.account.deleteMany({ where: { type: 'CREDIT' } });
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
    const nonExistentId = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
    const res = await request(app).delete(`/api/v1/cards/${nonExistentId}`).expect(404);

    expect(res.body).toMatchObject({
      error: {
        code: 'NOT_FOUND',
        message: 'Card not found',
        details: { id: nonExistentId },
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
      id: expect.any(String),
      closingRangeStart: 5,
      closingRangeEnd: 11,
      dueOffsetDays: 8,
      preferredWeekday: 1,
    });
    expect(createResponse.body.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    );

    const createdId = createResponse.body.id as string;

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

