import { afterEach, describe, expect, test, vi } from 'vitest';
import { ObjectId } from 'mongodb';
import request from 'supertest';
import app from '../app.js';
import { getDb } from '../src/db/connect.js';
import Booking from '../src/models/schemas/bookings.js';

const seed = async (count = 25, sameDate = false) => {
  const documents = Array.from({ length: count }, (_, index) => ({
    _id: new ObjectId((index + 1).toString(16).padStart(24, '0')),
    id: `JRPAGE${index}`, scheduleId: 1, tripId: 'alpine-panorama',
    ticketClass: 'premium', selectedDay: 'monday',
    passengers: [{ firstName: 'Test', lastName: 'Rider', email: 'test@example.test', phone: '123' }],
    createdAt: new Date(Date.UTC(2026, 10, 1, sameDate ? 0 : index))
  }));
  await getDb().collection('bookings').insertMany(documents);
};

afterEach(() => vi.restoreAllMocks());

describe('paginated bookings API', () => {
  test('defaults to 10 newest records and returns complete metadata', async () => {
    await seed();
    const response = await request(app).get('/api/bookings');
    expect(response.status).toBe(200);
    expect(response.body.bookings).toHaveLength(10);
    expect(response.body.bookings.map((booking) => booking.id)).toEqual(
      Array.from({ length: 10 }, (_, index) => `JRPAGE${24 - index}`)
    );
    expect(response.body.pagination).toEqual({ page: 1, limit: 10, totalItems: 25, totalPages: 3, hasPreviousPage: false, hasNextPage: true });
    expect(response.body.sort).toEqual({ by: 'createdAt', order: 'desc' });
    expect(response.body.filters).toEqual({});
    expect(response.headers['cache-control']).toBe('no-store');
  });

  test('steps through nonoverlapping pages of 10, 10, and 5 records', async () => {
    await seed();
    const pages = [];
    for (const page of [1, 2, 3]) {
      const response = await request(app).get(`/api/bookings?page=${page}`);
      expect(response.status).toBe(200);
      pages.push(response.body);
    }
    expect(pages.map((page) => page.bookings.length)).toEqual([10, 10, 5]);
    expect(new Set(pages.flatMap((page) => page.bookings.map((booking) => booking.id))).size).toBe(25);
    expect(pages[2].pagination).toMatchObject({ page: 3, hasPreviousPage: true, hasNextPage: false });
  });

  test('supports a bounded custom limit and ascending booking dates', async () => {
    await seed();
    const response = await request(app).get('/api/bookings?page=2&limit=4&sort=asc');
    expect(response.status).toBe(200);
    expect(response.body.bookings.map((booking) => booking.id)).toEqual(['JRPAGE4', 'JRPAGE5', 'JRPAGE6', 'JRPAGE7']);
    expect(response.body.pagination).toMatchObject({ page: 2, limit: 4, totalPages: 7, totalItems: 25 });
    expect(response.body.sort.order).toBe('asc');
  });

  test('uses a stable ID tie-breaker when booking dates match', async () => {
    await seed(25, true);
    const first = await request(app).get('/api/bookings');
    const second = await request(app).get('/api/bookings?page=2');
    expect(first.body.bookings[0].id).toBe('JRPAGE24');
    expect(second.body.bookings[0].id).toBe('JRPAGE14');
    expect(new Set([...first.body.bookings, ...second.body.bookings].map((booking) => booking.id)).size).toBe(20);
  });

  test('returns zero totals for an empty database and preserves out-of-range pages', async () => {
    const empty = await request(app).get('/api/bookings');
    expect(empty.body.pagination).toEqual({ page: 1, limit: 10, totalItems: 0, totalPages: 0, hasPreviousPage: false, hasNextPage: false });
    await seed(2);
    const response = await request(app).get('/api/bookings?page=9');
    expect(response.status).toBe(200);
    expect(response.body.bookings).toEqual([]);
    expect(response.body.pagination).toMatchObject({ page: 9, totalItems: 2, totalPages: 1, hasNextPage: false });
  });

  test.each([
    'page=0', 'page=-1', 'page=1.5', 'page=1e2', 'page=', 'page=01', 'page=9007199254740992',
    'page=9007199254740991&limit=100', 'page=1&page=2', 'page[$gt]=0',
    'limit=0', 'limit=101', 'limit=1.5', 'limit=', 'limit=10&limit=20',
    'sort=name', 'sort=', 'sort=asc&sort=desc', 'unknown=value'
  ])('rejects an invalid query with JSON 400: %s', async (query) => {
    const response = await request(app).get(`/api/bookings?${query}`);
    expect(response.status).toBe(400);
    expect(response.headers['content-type']).toContain('application/json');
    expect(response.body.error).toEqual(expect.any(String));
  });

  test('handles a count failure without exposing database details', async () => {
    vi.spyOn(Booking, 'countDocuments').mockImplementation(() => { throw new Error('private index error'); });
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const response = await request(app).get('/api/bookings');
    expect(response.status).toBe(500);
    expect(response.body).toEqual({ error: 'Failed to fetch bookings' });
  });

  test('serves the canonical page and legacy alias as API-driven shells', async () => {
    for (const path of ['/bookings', '/bookings-admin']) {
      const response = await request(app).get(path);
      expect(response.status).toBe(200);
      expect(response.text).toContain('id="bookings-next"');
      expect(response.text).toContain('/js/bookings.js');
    }
  });
});
