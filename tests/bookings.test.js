import { afterEach, describe, expect, test, vi } from 'vitest';
import request from 'supertest';
import app from '../app.js';
import Booking from '../src/models/schemas/bookings.js';
import { createBooking, getBookingById } from '../src/models/bookings.js';
import { getDb } from '../src/db/connect.js';
import { migrateBookings } from '../src/db/migrate-bookings.js';

const passenger = {
  firstName: 'Aki', lastName: 'Tanaka', email: 'aki@example.com', phone: '+81 90 1234 5678'
};
const bookingDetails = {
  scheduleId: 1, tripId: 'alpine-panorama', ticketClass: 'premium',
  selectedDay: 'monday', passengers: [passenger]
};

afterEach(() => vi.restoreAllMocks());

describe('booking model and form flow', () => {
  test('creates and retrieves a booking in the renamed collection', async () => {
    const booking = await createBooking(bookingDetails);
    expect(booking.id).toMatch(/^JR[0-9A-F]{16}$/);
    expect(booking.createdAt).toBeInstanceOf(Date);
    expect(await getBookingById(booking.id)).toMatchObject(bookingDetails);
    expect(await getDb().collection('bookings').countDocuments()).toBe(1);
    expect(await getDb().listCollections({ name: 'confirmations' }).hasNext()).toBe(false);
  });

  test('renders the existing booking form with calculated prices', async () => {
    const response = await request(app).get('/trips/booking/1');
    expect(response.status).toBe(200);
    expect(response.text).toContain('name="scheduleId" value="1"');
    expect(response.text).toContain('data-price="27000"');
  });

  test('accepts two URL-encoded passengers and renders their confirmation', async () => {
    const response = await request(app).post('/trips/book').type('form').send({
      scheduleId: '1', ticketClass: 'premium', selectedDay: 'monday',
      'passengers[0][firstName]': passenger.firstName,
      'passengers[0][lastName]': passenger.lastName,
      'passengers[0][email]': passenger.email,
      'passengers[0][phone]': passenger.phone,
      'passengers[1][firstName]': 'Hana',
      'passengers[1][lastName]': 'Sato',
      'passengers[1][email]': 'hana@example.com',
      'passengers[1][phone]': '+81 80 1234 5678'
    });
    expect(response.status).toBe(302);
    expect(response.headers.location).toMatch(/^\/trips\/confirmation\/JR/);
    const confirmation = await request(app).get(response.headers.location);
    expect(confirmation.status).toBe(200);
    expect(confirmation.text).toContain('Aki Tanaka');
    expect(confirmation.text).toContain('Hana Sato');
    const stored = await Booking.findOne({}).lean();
    expect(stored.passengers).toHaveLength(2);
  });

  test('ignores client-owned references, timestamps, extra fields, and trip IDs', async () => {
    const response = await request(app).post('/trips/book').send({
      ...bookingDetails, id: 'OVERRIDE', tripId: 'forged-trip',
      createdAt: '2000-01-01', arbitrary: 'extra',
      passengers: [{ ...passenger, _id: 'forged-id', arbitrary: 'extra' }]
    });
    expect(response.status).toBe(302);
    const booking = await Booking.findOne({}).lean();
    expect(booking.id).not.toBe('OVERRIDE');
    expect(booking.tripId).toBe('alpine-panorama');
    expect(booking.createdAt.getFullYear()).not.toBe(2000);
    expect(booking).not.toHaveProperty('arbitrary');
    expect(booking.passengers[0]).not.toHaveProperty('_id');
    expect(booking.passengers[0]).not.toHaveProperty('arbitrary');
  });

  test.each([
    ['empty passengers', { passengers: [] }],
    ['missing passengers', { passengers: undefined }],
    ['too many passengers', { passengers: Array(9).fill(passenger) }],
    ['missing name', { passengers: [{ ...passenger, firstName: ' ' }] }],
    ['invalid email', { passengers: [{ ...passenger, email: 'bad-address' }] }],
    ['missing phone', { passengers: [{ ...passenger, phone: '' }] }],
    ['null passenger', { passengers: [null] }],
    ['unknown class', { ticketClass: 'unknown' }],
    ['unavailable day', { selectedDay: 'sunday' }],
    ['query operator as class', { ticketClass: { $ne: null } }],
    ['query operator as schedule', { scheduleId: { $ne: null } }]
  ])('rejects %s without writing a booking', async (label, fields) => {
    const response = await request(app).post('/trips/book').send({ ...bookingDetails, ...fields });
    expect(response.status).toBe(400);
    expect(response.body.error).toBeTruthy();
    expect(await Booking.countDocuments()).toBe(0);
  });

  test.each(['unknown', '999', '4', '0', '1.5'])('returns 404 for unavailable schedule %s', async (id) => {
    expect((await request(app).get(`/trips/booking/${id}`)).status).toBe(404);
    const response = await request(app).post('/trips/book').send({ ...bookingDetails, scheduleId: id });
    expect(response.status).toBe(404);
    expect(await Booking.countDocuments()).toBe(0);
  });

  test('returns 404 for an unknown booking reference', async () => {
    const response = await request(app).get('/trips/confirmation/missing');
    expect(response.status).toBe(404);
  });
});

describe('bookings API and admin page', () => {
  test('returns an empty JSON array when no bookings exist', async () => {
    const response = await request(app).get('/api/bookings');
    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toContain('application/json');
    expect(response.body).toEqual({ bookings: [] });
  });

  test('returns stored bookings and passenger details', async () => {
    const booking = await createBooking(bookingDetails);
    const response = await request(app).get('/api/bookings');
    expect(response.status).toBe(200);
    expect(response.body.bookings).toEqual([
      expect.objectContaining({ ...bookingDetails, id: booking.id })
    ]);
  });

  test('returns a generic JSON 500 when the query fails', async () => {
    vi.spyOn(Booking, 'find').mockImplementation(() => { throw new Error('private database error'); });
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const response = await request(app).get('/api/bookings');
    expect(response.status).toBe(500);
    expect(response.body).toEqual({ error: 'Failed to fetch bookings' });
  });

  test('renders an admin shell without injecting bookings on the server', async () => {
    const booking = await createBooking(bookingDetails);
    const response = await request(app).get('/bookings-admin');
    expect(response.status).toBe(200);
    expect(response.text).toContain('id="bookings-list"');
    expect(response.text).toContain('/js/bookings.js');
    expect(response.text).not.toContain(booking.id);
    expect(response.text).not.toContain(passenger.email);
  });
});

describe('legacy collection migration', () => {
  test('renames existing documents and is safe to rerun', async () => {
    const db = getDb();
    await db.collection('bookings').drop();
    await db.collection('confirmations').insertOne({ id: 'JRLEGACY', passengers: [passenger] });
    expect(await migrateBookings(db)).toBe(true);
    expect(await getBookingById('JRLEGACY')).toMatchObject({ id: 'JRLEGACY', passengers: [passenger] });
    expect(await migrateBookings(db)).toBe(false);
    expect(await db.listCollections({ name: 'confirmations' }).hasNext()).toBe(false);
  });

  test('refuses to overwrite either collection when both exist', async () => {
    const db = getDb();
    await db.collection('confirmations').insertOne({ id: 'JRLEGACY' });
    await expect(migrateBookings(db)).rejects.toThrow('Both confirmations and bookings exist');
    expect(await db.collection('confirmations').countDocuments()).toBe(1);
    expect(await db.collection('bookings').countDocuments()).toBe(0);
  });
});
