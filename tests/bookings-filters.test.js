import { describe, expect, test } from 'vitest';
import request from 'supertest';
import app from '../app.js';
import { getDb } from '../src/db/connect.js';

const seed = async () => {
  const classes = ['standard', 'premium', 'first'];
  const records = Array.from({ length: 36 }, (_, index) => ({
    id: `JRFILTER${index}`, scheduleId: 1, tripId: 'alpine-panorama',
    ticketClass: classes[index % 3], selectedDay: 'monday',
    passengers: [{ firstName: 'Filter', lastName: 'Rider', email: 'filter@example.test', phone: '123' }],
    createdAt: new Date(Date.UTC(2026, 10, Math.floor(index / 3) + 1, 12 + index % 3))
  }));
  await getDb().collection('bookings').insertMany(records);
};

describe('booking ticket and date filters', () => {
  test.each(['standard', 'premium', 'first'])('paginates %s results with matching totals', async (ticketClass) => {
    await seed();
    const first = await request(app).get(`/api/bookings?ticketClass=${ticketClass}`);
    const second = await request(app).get(`/api/bookings?ticketClass=${ticketClass}&page=2`);
    expect(first.status).toBe(200);
    expect(first.body.bookings).toHaveLength(10);
    expect(second.body.bookings).toHaveLength(2);
    expect(first.body.pagination).toMatchObject({ page: 1, totalItems: 12, totalPages: 2, hasNextPage: true });
    expect(second.body.pagination).toMatchObject({ page: 2, totalItems: 12, totalPages: 2, hasNextPage: false });
    const all = [...first.body.bookings, ...second.body.bookings];
    expect(all.every((booking) => booking.ticketClass === ticketClass)).toBe(true);
    expect(new Set(all.map((booking) => booking.id)).size).toBe(12);
    expect(first.body.filters).toEqual({ ticketClass, startDate: null, endDate: null });
  });

  test('combines class and both bounds using booking date, with filtered pagination', async () => {
    await seed();
    const query = 'ticketClass=premium&startDate=2026-11-02&endDate=2026-11-12';
    const first = await request(app).get(`/api/bookings?${query}`);
    const second = await request(app).get(`/api/bookings?${query}&page=2`);
    expect(first.body.pagination).toMatchObject({ totalItems: 11, totalPages: 2 });
    expect(first.body.bookings).toHaveLength(10);
    expect(second.body.bookings.map((booking) => booking.id)).toEqual(['JRFILTER4']);
    expect(first.body.filters).toEqual({ ticketClass: 'premium', startDate: '2026-11-02', endDate: '2026-11-12' });
  });

  test('supports either date bound alone and ascending sort', async () => {
    await seed();
    const from = await request(app).get('/api/bookings?startDate=2026-11-10&sort=asc');
    expect(from.body.pagination.totalItems).toBe(9);
    expect(from.body.bookings[0].id).toBe('JRFILTER27');
    const through = await request(app).get('/api/bookings?endDate=2026-11-02');
    expect(through.body.pagination.totalItems).toBe(6);
    expect(through.body.bookings[0].id).toBe('JRFILTER5');
  });

  test('includes both UTC day boundaries and accepts a real leap day', async () => {
    const times = ['2024-02-28T23:59:59.999Z', '2024-02-29T00:00:00.000Z', '2024-02-29T23:59:59.999Z', '2024-03-01T00:00:00.000Z'];
    await getDb().collection('bookings').insertMany(times.map((createdAt, index) => ({
      id: `JRBOUNDARY${index}`, ticketClass: 'standard', createdAt: new Date(createdAt)
    })));
    const response = await request(app).get('/api/bookings?startDate=2024-02-29&endDate=2024-02-29');
    expect(response.status).toBe(200);
    expect(response.body.bookings.map((booking) => booking.id)).toEqual(['JRBOUNDARY2', 'JRBOUNDARY1']);
    expect(response.body.pagination.totalItems).toBe(2);
  });

  test('returns empty matches and out-of-range filtered pages with matching totals', async () => {
    await seed();
    const empty = await request(app).get('/api/bookings?ticketClass=first&endDate=2020-01-01');
    expect(empty.status).toBe(200);
    expect(empty.body.bookings).toEqual([]);
    expect(empty.body.pagination).toMatchObject({ totalItems: 0, totalPages: 0, hasNextPage: false, hasPreviousPage: false });
    const beyond = await request(app).get('/api/bookings?ticketClass=first&page=3');
    expect(beyond.body.bookings).toEqual([]);
    expect(beyond.body.pagination).toMatchObject({ page: 3, totalItems: 12, totalPages: 2 });
  });

  test.each([
    'ticketClass=unknown', 'ticketClass=', 'ticketClass=PREMIUM', 'ticketClass=first&ticketClass=premium',
    'ticketClass[$ne]=standard', 'startDate=', 'endDate=', 'startDate=2026-02-29',
    'startDate=2026-02-30', 'endDate=2026-11-31', 'endDate=2026-13-01',
    'startDate=2026-1-01', 'startDate=invalid', 'startDate=2026-11-01T00:00:00Z',
    'startDate=2026-11-12&endDate=2026-11-01', 'endDate=2026-11-01&endDate=2026-11-02',
    'startDate[$gte]=2026-11-01', 'startDate=2026-11-01&startDate=2026-11-02'
  ])('rejects invalid filters with JSON 400: %s', async (query) => {
    const response = await request(app).get(`/api/bookings?${query}`);
    expect(response.status).toBe(400);
    expect(response.body.error).toEqual(expect.any(String));
    expect(response.headers['content-type']).toContain('application/json');
  });
});
