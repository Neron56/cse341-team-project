
import {
  afterAll,
  beforeAll,
  describe,
  expect,
  test,
  inject,
} from 'vitest';
import mongoose from 'mongoose';
import request from 'supertest';
import app from '../app.js';

const connectionString = inject('MONGODB_TEST_URI');

beforeAll(async () => {
  await mongoose.connect(connectionString, {
    dbName: 'kizuna-rail-test',
  });
});

afterAll(async () => {
  await mongoose.disconnect();
});

describe('GET /api/trips', () => {
  test('returns a successful JSON response', async () => {
    const response = await request(app).get('/api/trips');

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toContain('application/json');
    expect(response.body).toBeInstanceOf(Array);
  });

  test('returns all six starter trips', async () => {
    const response = await request(app).get('/api/trips');

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(6);

    expect(response.body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'alpine-panorama',
          name: 'Alpine Panorama Express',
        }),
      ])
    );
  });
});

describe('GET /api/trips/:id', () => {
  test('returns one trip by ID', async () => {
    const response = await request(app).get(
      '/api/trips/alpine-panorama'
    );

    expect(response.status).toBe(200);
    expect(response.body.name).toBe('Alpine Panorama Express');
  });

  test('returns 404 when a trip does not exist', async () => {
    const response = await request(app).get(
      '/api/trips/nonexistent-trip'
    );

    expect(response.status).toBe(404);
    expect(response.body.error).toBe('Trip not found');
  });
});
