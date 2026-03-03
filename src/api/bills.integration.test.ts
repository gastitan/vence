/**
 * Integration tests for Bill API. Use test.db via npm test.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from './server.js';
import { prisma } from '../infrastructure/prisma/client.js';

describe('Bills API integration', () => {
  beforeEach(async () => {
    await prisma.dueInstance.deleteMany({});
    await prisma.bill.deleteMany({});
    await prisma.rule.deleteMany({});
    await prisma.account.deleteMany({});
  });

  it('creating bill creates 3 due instances', async () => {
    const accountRes = await request(app)
      .post('/api/v1/accounts')
      .send({ name: 'Personal', type: 'SERVICE' })
      .expect(201);
    const accountId = accountRes.body.id as string;

    const createRes = await request(app)
      .post('/api/v1/bills')
      .send({
        accountId,
        name: 'Netflix',
        amount: 25.5,
        currency: 'USD',
        rule: { type: 'FIXED_DAY', fixedDay: 15 },
      })
      .expect(201);

    expect(createRes.body).toMatchObject({
      id: expect.any(String),
      accountId,
      name: 'Netflix',
      amount: 25.5,
      currency: 'USD',
      rule: { type: 'FIXED_DAY', fixedDay: 15 },
      createdDueInstances: 3,
    });
    expect(createRes.body.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    );

    const getRes = await request(app)
      .get(`/api/v1/bills/${createRes.body.id}`)
      .expect(200);
    expect(getRes.body.nextPendingDueInstance).toBeDefined();
    expect(getRes.body.totalPendingAmount).toBe(25.5 * 3);
  });

  it('creating bill twice does not interfere', async () => {
    const accountRes = await request(app)
      .post('/api/v1/accounts')
      .send({ name: 'Personal', type: 'SERVICE' })
      .expect(201);
    const accountId = accountRes.body.id as string;

    const first = await request(app)
      .post('/api/v1/bills')
      .send({
        accountId,
        name: 'Netflix',
        amount: 25.5,
        currency: 'USD',
        rule: { type: 'FIXED_DAY', fixedDay: 15 },
      })
      .expect(201);

    const second = await request(app)
      .post('/api/v1/bills')
      .send({
        accountId,
        name: 'Spotify',
        amount: 9.99,
        currency: 'USD',
        rule: { type: 'FIXED_DAY', fixedDay: 20 },
      })
      .expect(201);

    expect(first.body.id).not.toBe(second.body.id);
    expect(first.body.createdDueInstances).toBe(3);
    expect(second.body.createdDueInstances).toBe(3);

    const listRes = await request(app)
      .get(`/api/v1/bills?accountId=${accountId}`)
      .expect(200);
    expect(listRes.body).toHaveLength(2);
  });

  it('soft delete hides bill from list', async () => {
    const accountRes = await request(app)
      .post('/api/v1/accounts')
      .send({ name: 'Personal', type: 'SERVICE' })
      .expect(201);
    const accountId = accountRes.body.id as string;

    const createRes = await request(app)
      .post('/api/v1/bills')
      .send({
        accountId,
        name: 'Netflix',
        amount: 25.5,
        currency: 'USD',
        rule: { type: 'FIXED_DAY', fixedDay: 15 },
      })
      .expect(201);
    const billId = createRes.body.id as string;

    let listRes = await request(app)
      .get(`/api/v1/bills?accountId=${accountId}`)
      .expect(200);
    expect(listRes.body).toHaveLength(1);

    await request(app).delete(`/api/v1/bills/${billId}`).expect(204);

    listRes = await request(app)
      .get(`/api/v1/bills?accountId=${accountId}`)
      .expect(200);
    expect(listRes.body).toHaveLength(0);

    await request(app).get(`/api/v1/bills/${billId}`).expect(404);
  });

  it('nextDueDate is correct', async () => {
    const accountRes = await request(app)
      .post('/api/v1/accounts')
      .send({ name: 'Personal', type: 'SERVICE' })
      .expect(201);
    const accountId = accountRes.body.id as string;

    await request(app)
      .post('/api/v1/bills')
      .send({
        accountId,
        name: 'Netflix',
        amount: 25.5,
        currency: 'USD',
        rule: { type: 'FIXED_DAY', fixedDay: 15 },
      })
      .expect(201);

    const listRes = await request(app)
      .get(`/api/v1/bills?accountId=${accountId}`)
      .expect(200);
    expect(listRes.body).toHaveLength(1);
    expect(listRes.body[0].nextDueDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(listRes.body[0].rule).toEqual({ type: 'FIXED_DAY', fixedDay: 15 });
  });

  it('total pending is correct', async () => {
    const accountRes = await request(app)
      .post('/api/v1/accounts')
      .send({ name: 'Personal', type: 'SERVICE' })
      .expect(201);
    const accountId = accountRes.body.id as string;

    const createRes = await request(app)
      .post('/api/v1/bills')
      .send({
        accountId,
        name: 'Netflix',
        amount: 25.5,
        currency: 'USD',
        rule: { type: 'FIXED_DAY', fixedDay: 15 },
      })
      .expect(201);

    const getRes = await request(app)
      .get(`/api/v1/bills/${createRes.body.id}`)
      .expect(200);
    expect(getRes.body.totalPendingAmount).toBe(25.5 * 3);
    expect(getRes.body.nextPendingDueInstance).toBeDefined();
    expect(getRes.body.nextPendingDueInstance.estimatedAmount).toBe(25.5);
  });

  it('invalid body returns 400', async () => {
    const accountRes = await request(app)
      .post('/api/v1/accounts')
      .send({ name: 'Personal', type: 'SERVICE' })
      .expect(201);
    const accountId = accountRes.body.id as string;

    await request(app)
      .post('/api/v1/bills')
      .send({
        accountId,
        name: '',
        amount: -1,
        currency: 'US',
        rule: { type: 'FIXED_DAY', fixedDay: 32 },
      })
      .expect(400);
  });

  it('list without accountId returns 400', async () => {
    await request(app).get('/api/v1/bills').expect(400);
  });

  it('get non-existent bill returns 404', async () => {
    const id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
    await request(app).get(`/api/v1/bills/${id}`).expect(404);
  });

  it('delete non-existent bill returns 404', async () => {
    const id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
    await request(app).delete(`/api/v1/bills/${id}`).expect(404);
  });
});
