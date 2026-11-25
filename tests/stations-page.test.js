import { readFile } from 'node:fs/promises';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { JSDOM } from 'jsdom';
import request from 'supertest';
import app from '../app.js';
import stations from '../src/db/seeds/stations.json' with { type: 'json' };

const script = await readFile(new URL('../public/js/stations.js', import.meta.url), 'utf8');
const windows = [];

afterEach(() => {
  for (const window of windows.splice(0)) window.close();
});

const renderPage = async (fetch) => {
  const response = await request(app).get('/trips/alpine-panorama');
  expect(response.status).toBe(200);
  const dom = new JSDOM(response.text, {
    url: 'http://localhost/trips/alpine-panorama',
    runScripts: 'outside-only'
  });
  windows.push(dom.window);
  dom.window.fetch = fetch;
  dom.window.eval(script);
  return dom.window;
};

const waitForPanel = async (panel) => {
  await vi.waitFor(() => expect(panel.getAttribute('aria-busy')).toBe('false'));
};

const success = (station = stations[0]) => ({ ok: true, status: 200, json: async () => ({ station }) });

describe('station details on the trip page', () => {
  test('fetches both real API endpoints independently and preserves page navigation', async () => {
    const fetch = vi.fn(async (url) => {
      const response = await request(app).get(url);
      return { ok: response.status === 200, status: response.status, json: async () => response.body };
    });
    const window = await renderPage(fetch);
    const document = window.document;
    const buttons = document.querySelectorAll('button[data-station-id]');
    const start = document.getElementById('start-station-details');
    const end = document.getElementById('end-station-details');
    expect(fetch).not.toHaveBeenCalled();
    expect(start.hidden).toBe(true);
    expect(end.hidden).toBe(true);

    buttons[0].click();
    expect(buttons[0].getAttribute('aria-expanded')).toBe('true');
    expect(start.hidden).toBe(false);
    expect(start.textContent).toBe('Loading station details...');
    await waitForPanel(start);
    expect(start.textContent).toContain('Nagoya Station');
    expect(start.textContent).toContain('Aichi');
    expect(end.hidden).toBe(true);

    buttons[1].click();
    await waitForPanel(end);
    expect(end.textContent).toContain('Toyama Station');
    expect(fetch.mock.calls.map(([url]) => url)).toEqual(['/api/stations/nagoya', '/api/stations/toyama']);
    buttons[0].click();
    expect(start.hidden).toBe(true);
    expect(buttons[0].getAttribute('aria-expanded')).toBe('false');
    expect(end.hidden).toBe(false);
    buttons[0].click();
    expect(start.textContent).toContain('Nagoya Station');
    expect(fetch).toHaveBeenCalledTimes(2);
    expect(window.location.pathname).toBe('/trips/alpine-panorama');
    expect(document.querySelector('a[href="/trips/booking/1"]')).not.toBeNull();
  });

  test('encodes the public ID and renders API values as literal text', async () => {
    const fetch = vi.fn(async () => success({ ...stations[0], name: '<img src=x onerror=alert(1)>', facilities: ['<script>bad()</script>'] }));
    const window = await renderPage(fetch);
    const button = window.document.querySelector('button[data-station-id]');
    button.dataset.stationId = 'station /?';
    button.click();
    const panel = window.document.getElementById('start-station-details');
    await waitForPanel(panel);
    expect(fetch).toHaveBeenCalledWith('/api/stations/station%20%2F%3F');
    expect(panel.textContent).toContain('<img src=x onerror=alert(1)>');
    expect(panel.textContent).toContain('<script>bad()</script>');
    expect(panel.querySelector('img, script')).toBeNull();
  });

  test('shows a missing-station message for 404', async () => {
    const window = await renderPage(vi.fn(async () => ({ ok: false, status: 404 })));
    window.document.querySelector('button[data-station-id]').click();
    const panel = window.document.getElementById('start-station-details');
    await waitForPanel(panel);
    expect(panel.textContent).toBe('Station details are not available.');
  });

  test.each(['HTTP error', 'network rejection', 'malformed JSON', 'invalid station'])('offers retry after %s', async (failure) => {
    const fetch = vi.fn().mockImplementationOnce(async () => {
      if (failure === 'network rejection') throw new Error('offline');
      if (failure === 'HTTP error') return { ok: false, status: 500 };
      if (failure === 'malformed JSON') return { ok: true, json: async () => { throw new Error('invalid JSON'); } };
      return success({ ...stations[0], facilities: {} });
    }).mockImplementation(async () => success());
    const window = await renderPage(fetch);
    window.document.querySelector('button[data-station-id]').click();
    const panel = window.document.getElementById('start-station-details');
    await waitForPanel(panel);
    expect(panel.textContent).toContain('Unable to load station details.');
    expect(panel.querySelector('h3')).toBeNull();
    panel.querySelector('button').click();
    await waitForPanel(panel);
    expect(panel.textContent).toContain('Nagoya Station');
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  test('does not reopen a collapsed panel when its request completes', async () => {
    let resolve;
    const pending = new Promise((done) => { resolve = done; });
    const fetch = vi.fn(async () => pending);
    const window = await renderPage(fetch);
    const button = window.document.querySelector('button[data-station-id]');
    const panel = window.document.getElementById('start-station-details');
    button.click();
    button.click();
    resolve(success());
    await waitForPanel(panel);
    expect(panel.hidden).toBe(true);
    expect(button.getAttribute('aria-expanded')).toBe('false');
    button.click();
    expect(panel.textContent).toContain('Nagoya Station');
    expect(fetch).toHaveBeenCalledTimes(1);
  });
});
