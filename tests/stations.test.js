import { afterEach, describe, expect, test, vi } from 'vitest';
import mongoose from 'mongoose';
import request from 'supertest';
import app from '../app.js';
import Station from '../src/models/schemas/stations.js';
import { getAllStations, getStationById } from '../src/models/stations.js';
import { getDb } from '../src/db/connect.js';
import stations from '../src/db/seeds/stations.json' with { type: 'json' };

const nagoya = Object.fromEntries(
  ['id', 'name', 'prefecture', 'region', 'facilities', 'description'].map((field) => [field, stations[0][field]])
);

afterEach(() => vi.restoreAllMocks());

describe('station schema and models', () => {
  test('all starter records validate without saving', async () => {
    for (const record of stations) {
      await expect(new Station(record).validate()).resolves.toBeUndefined();
    }
    expect(Station.schema.options.autoCreate).toBe(false);
    expect(Station.schema.options.autoIndex).toBe(false);
  });

  test('trims fields and supplies optional defaults', () => {
    const station = new Station({ id: ' nagoya ', name: ' Nagoya ', prefecture: ' Aichi ', region: ' central ' });
    expect(station.toObject()).toMatchObject({
      id: 'nagoya', name: 'Nagoya', prefecture: 'Aichi', region: 'central', facilities: [], description: ''
    });
    const detailed = new Station({ ...stations[0], facilities: [' restroom '], description: ' Description ' });
    expect(detailed.facilities[0]).toBe('restroom');
    expect(detailed.description).toBe('Description');
  });

  test.each(['id', 'name', 'prefecture', 'region'])('requires %s', async (field) => {
    const station = new Station({ ...stations[0], [field]: ' ' });
    await expect(station.validate()).rejects.toHaveProperty(`errors.${field}`);
  });

  test('uses the configured database shared with native readers', () => {
    expect(mongoose.connection.db).toBe(getDb());
    expect(getDb().databaseName).toBe('kizuna-rail-test');
  });

  test('returns sorted plain objects and null for a missing public ID', async () => {
    const results = await getAllStations();
    expect(results).toHaveLength(12);
    expect(results.map((station) => station.name)).toEqual(stations.map((station) => station.name).sort());
    expect(Object.getPrototypeOf(results[0])).toBe(Object.prototype);
    expect(await getStationById('nagoya')).toEqual(nagoya);
    expect(await getStationById('missing-station')).toBeNull();
  });
});

describe('stations API and documentation', () => {
  test('lists only public fields and finds a station by public ID', async () => {
    await getDb().collection('stations').updateOne({ id: 'nagoya' }, { $set: { internalNote: 'private', __v: 2 } });
    const list = await request(app).get('/api/stations');
    expect(list.status).toBe(200);
    expect(list.headers['content-type']).toContain('application/json');
    expect(list.body.stations).toHaveLength(12);
    for (const station of list.body.stations) {
      expect(Object.keys(station).sort()).toEqual(['description', 'facilities', 'id', 'name', 'prefecture', 'region']);
    }
    const detail = await request(app).get('/api/stations/nagoya');
    expect(detail.status).toBe(200);
    expect(detail.body).toEqual({ station: nagoya });
  });

  test('returns an empty list when no stations exist', async () => {
    await getDb().collection('stations').deleteMany({});
    const response = await request(app).get('/api/stations');
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ stations: [] });
  });

  test.each(['missing-station', 'not a station', '{"$ne":null}'])('treats %s as a literal unmatched string', async (id) => {
    const response = await request(app).get(`/api/stations/${encodeURIComponent(id)}`);
    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: 'Station not found' });
  });

  test.each([
    ['find', '/api/stations', 'Failed to fetch stations'],
    ['findOne', '/api/stations/nagoya', 'Failed to fetch station']
  ])('returns generic JSON when %s fails', async (method, url, message) => {
    vi.spyOn(Station, method).mockImplementation(() => { throw new Error('private database details'); });
    const response = await request(app).get(url);
    expect(response.status).toBe(500);
    expect(response.body).toEqual({ error: message });
  });

  test('serves Swagger UI and documents both station contracts', async () => {
    const ui = await request(app).get('/api-docs/');
    expect(ui.status).toBe(200);
    expect(ui.text).toContain('swagger-ui');
    const response = await request(app).get('/api-docs.json');
    expect(response.status).toBe(200);
    expect(response.body.openapi).toBe('3.0.0');
    expect(Object.keys(response.body.paths['/api/stations'].get.responses).sort()).toEqual(['200', '500']);
    expect(Object.keys(response.body.paths['/api/stations/{id}'].get.responses).sort()).toEqual(['200', '404', '500']);
    expect(response.body.paths['/api/stations/{id}'].get.parameters[0]).toMatchObject({ name: 'id', in: 'path', required: true });
    expect(response.body.components.schemas.Station.properties).toHaveProperty('facilities');
  });
});

describe('existing trip and booking flow', () => {
  test('keeps trip content, schedules, form, submission, and confirmation working', async () => {
    const trip = await request(app).get('/trips/alpine-panorama');
    expect(trip.status).toBe(200);
    expect(trip.text).toContain('Alpine Panorama Express');
    expect(trip.text).toContain('/trips/booking/1');
    expect(trip.text).toContain('Available Schedules');
    expect((await request(app).get('/trips')).status).toBe(200);
    const form = await request(app).get('/trips/booking/1');
    expect(form.status).toBe(200);
    expect(form.text).toContain('data-price="27000"');
    const booking = await request(app).post('/trips/book').type('form').send({
      scheduleId: '1', tripId: 'alpine-panorama', ticketClass: 'premium', selectedDay: 'monday',
      'passengers[0][firstName]': 'Aki', 'passengers[0][lastName]': 'Tanaka',
      'passengers[0][email]': 'aki@example.com', 'passengers[0][phone]': '123'
    });
    expect(booking.status).toBe(302);
    const confirmation = await request(app).get(booking.headers.location);
    expect(confirmation.status).toBe(200);
    expect(confirmation.text).toContain('Aki Tanaka');
  });
});
