import { readFile } from 'node:fs/promises';
import { describe, expect, test, vi } from 'vitest';
import { JSDOM } from 'jsdom';
import request from 'supertest';
import app from '../app.js';

const clientScript = await readFile(new URL('../public/js/bookings.js', import.meta.url), 'utf8');

const metadata = (page = 1, totalItems = 1) => ({
  page, limit: 10, totalItems, totalPages: Math.ceil(totalItems / 10),
  hasPreviousPage: totalItems > 0 && page > 1, hasNextPage: page < Math.ceil(totalItems / 10)
});
const result = (bookings = [], page = 1, totalItems = bookings.length) => ({ bookings, pagination: metadata(page, totalItems) });
const ok = (body) => ({ ok: true, json: async () => body });

const renderPage = async (fetchResponse) => {
  const response = await request(app).get('/bookings-admin');
  const dom = new JSDOM(response.text, {
    url: 'http://localhost/bookings-admin',
    runScripts: 'outside-only'
  });
  const fetch = typeof fetchResponse === 'function' ? fetchResponse : vi.fn(async () => fetchResponse);
  dom.window.fetch = fetch;
  const loading = dom.window.document.getElementById('bookings-loading');
  expect(loading.hidden).toBe(false);
  await dom.window.eval(clientScript);
  expect(fetch.mock.calls[0][0]).toBe('/api/bookings?page=1&limit=10&sort=desc');
  expect(loading.hidden).toBe(true);
  return dom;
};

describe('bookings admin client rendering', () => {
  test('shows the empty state after loading an empty API response', async () => {
    const dom = await renderPage(ok(result()));
    const document = dom.window.document;
    expect(document.getElementById('bookings-empty').hidden).toBe(false);
    expect(document.getElementById('bookings-error').hidden).toBe(true);
    expect(document.getElementById('bookings-list').children).toHaveLength(0);
    dom.window.close();
  });

  test('renders references and multiple passengers as safe text', async () => {
    const dom = await renderPage(ok(result([{
      id: 'JRTEST', tripId: 'alpine-panorama', scheduleId: 1,
      ticketClass: 'premium', selectedDay: 'monday', createdAt: '2026-11-13T08:00:00Z',
      passengers: [
        { firstName: '<img src=x onerror=alert(1)>', lastName: 'Tanaka', email: 'aki@example.com', phone: '123' },
        { firstName: 'Hana', lastName: 'Sato', email: 'hana@example.com', phone: '456' }
      ]
    }])));
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

  test('uses API metadata for Next and Previous without navigation', async () => {
    const fetch = vi.fn()
      .mockResolvedValueOnce(ok(result([], 1, 25)))
      .mockResolvedValueOnce(ok(result([], 2, 25)))
      .mockResolvedValueOnce(ok(result([], 1, 25)));
    const dom = await renderPage(fetch);
    const document = dom.window.document;
    expect(document.getElementById('bookings-previous').disabled).toBe(true);
    expect(document.getElementById('bookings-next').disabled).toBe(false);
    document.getElementById('bookings-next').click();
    await vi.waitFor(() => expect(document.getElementById('bookings-page').textContent).toBe('Page 2 of 3'));
    expect(fetch.mock.calls[1][0]).toBe('/api/bookings?page=2&limit=10&sort=desc');
    document.getElementById('bookings-previous').click();
    await vi.waitFor(() => expect(document.getElementById('bookings-page').textContent).toBe('Page 1 of 3'));
    expect(dom.window.location.pathname).toBe('/bookings-admin');
    dom.window.close();
  });

  test('disables both controls for an empty result', async () => {
    const dom = await renderPage(ok(result()));
    const document = dom.window.document;
    expect(document.getElementById('bookings-previous').disabled).toBe(true);
    expect(document.getElementById('bookings-next').disabled).toBe(true);
    expect(document.getElementById('bookings-summary').textContent).toBe('Showing 0-0 of 0 bookings');
    dom.window.close();
  });

  test('keeps the successful page after a failure and retries the requested page', async () => {
    const fetch = vi.fn()
      .mockResolvedValueOnce(ok(result([], 1, 25)))
      .mockResolvedValueOnce({ ok: false, status: 500 })
      .mockResolvedValueOnce(ok(result([], 2, 25)));
    const dom = await renderPage(fetch);
    const document = dom.window.document;
    document.getElementById('bookings-next').click();
    await vi.waitFor(() => expect(document.getElementById('bookings-retry').hidden).toBe(false));
    expect(document.getElementById('bookings-page').textContent).toBe('Page 1 of 3');
    document.getElementById('bookings-retry').click();
    await vi.waitFor(() => expect(document.getElementById('bookings-page').textContent).toBe('Page 2 of 3'));
    expect(fetch.mock.calls[2][0]).toBe('/api/bookings?page=2&limit=10&sort=desc');
    dom.window.close();
  });

  test('recovers to the final page when concurrent deletion removes a page', async () => {
    const fetch = vi.fn()
      .mockResolvedValueOnce(ok(result([], 1, 25)))
      .mockResolvedValueOnce(ok(result([], 2, 0)))
      .mockResolvedValueOnce(ok(result()));
    const dom = await renderPage(fetch);
    dom.window.document.getElementById('bookings-next').click();
    await vi.waitFor(() => expect(dom.window.document.getElementById('bookings-page').textContent).toBe('No pages'));
    expect(fetch.mock.calls[2][0]).toBe('/api/bookings?page=1&limit=10&sort=desc');
    dom.window.close();
  });
});
