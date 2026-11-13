import { readFile } from 'node:fs/promises';
import { describe, expect, test, vi } from 'vitest';
import { JSDOM } from 'jsdom';
import request from 'supertest';
import app from '../app.js';

const clientScript = await readFile(new URL('../public/js/bookings.js', import.meta.url), 'utf8');

const renderPage = async (fetchResponse) => {
  const response = await request(app).get('/bookings-admin');
  const dom = new JSDOM(response.text, {
    url: 'http://localhost/bookings-admin',
    runScripts: 'outside-only'
  });
  const fetch = vi.fn(async () => fetchResponse);
  dom.window.fetch = fetch;
  const loading = dom.window.document.getElementById('bookings-loading');
  expect(loading.hidden).toBe(false);
  await dom.window.eval(clientScript);
  expect(fetch).toHaveBeenCalledWith('/api/bookings');
  expect(loading.hidden).toBe(true);
  return dom;
};

describe('bookings admin client rendering', () => {
  test('shows the empty state after loading an empty API response', async () => {
    const dom = await renderPage({ ok: true, json: async () => ({ bookings: [] }) });
    const document = dom.window.document;
    expect(document.getElementById('bookings-empty').hidden).toBe(false);
    expect(document.getElementById('bookings-error').hidden).toBe(true);
    expect(document.getElementById('bookings-list').children).toHaveLength(0);
    dom.window.close();
  });

  test('renders references and multiple passengers as safe text', async () => {
    const dom = await renderPage({ ok: true, json: async () => ({ bookings: [{
      id: 'JRTEST', tripId: 'alpine-panorama', scheduleId: 1,
      ticketClass: 'premium', selectedDay: 'monday', createdAt: '2026-11-13T08:00:00Z',
      passengers: [
        { firstName: '<img src=x onerror=alert(1)>', lastName: 'Tanaka', email: 'aki@example.com', phone: '123' },
        { firstName: 'Hana', lastName: 'Sato', email: 'hana@example.com', phone: '456' }
      ]
    }] }) });
    const document = dom.window.document;
    const card = document.querySelector('#bookings-list .booking-admin-card');
    expect(card.querySelector('a').getAttribute('href')).toBe('/trips/confirmation/JRTEST');
    expect(card.textContent).toContain('alpine-panorama');
    expect(card.textContent).toContain('<img src=x onerror=alert(1)> Tanaka');
    expect(card.querySelectorAll('li')).toHaveLength(2);
    expect(card.querySelector('img')).toBeNull();
    expect(document.getElementById('bookings-empty').hidden).toBe(true);
    expect(document.getElementById('bookings-error').hidden).toBe(true);
    dom.window.close();
  });

  test('shows a useful error when the API returns 500', async () => {
    const dom = await renderPage({ ok: false, status: 500 });
    const error = dom.window.document.getElementById('bookings-error');
    expect(error.hidden).toBe(false);
    expect(error.textContent).toContain('Unable to load bookings');
    expect(dom.window.document.getElementById('bookings-empty').hidden).toBe(true);
    dom.window.close();
  });

  test('shows an error when the API payload is malformed', async () => {
    const dom = await renderPage({ ok: true, json: async () => ({ bookings: null }) });
    expect(dom.window.document.getElementById('bookings-error').hidden).toBe(false);
    dom.window.close();
  });
});
