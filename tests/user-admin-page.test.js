import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import ejs from 'ejs';
import { JSDOM } from 'jsdom';
import { afterEach, describe, expect, test, vi } from 'vitest';

const script = await readFile(new URL('../public/js/user-admin.js', import.meta.url), 'utf8');
const template = fileURLToPath(new URL('../src/views/admin/users.ejs', import.meta.url));
const self = { id: 'a'.repeat(24), displayName: 'Admin Rider', username: 'admin-rider', email: 'admin@example.test', role: 'admin' };
const other = { id: 'b'.repeat(24), displayName: 'Lee Rider', username: 'lee-rider', email: 'lee@example.test', role: 'customer' };
const token = 'c'.repeat(64);
const payload = (users = [self, other]) => ({ users, currentUserId: self.id, csrfToken: token });
const response = (body, status = 200) => ({ ok: status < 400, status, json: async () => body });
const pages = [];

const openPage = async (fetch) => {
  const html = await ejs.renderFile(template, {
    title: 'User Administration', NODE_ENV: 'test', appVersion: '1.0.0', user: self, query: {}
  });
  const dom = new JSDOM(html, { url: 'http://localhost/admin/users', runScripts: 'outside-only' });
  pages.push(dom);
  dom.window.fetch = fetch;
  dom.window.confirm = vi.fn(() => true);
  expect(dom.window.document.getElementById('users-loading').hidden).toBe(false);
  await dom.window.eval(script);
  expect(dom.window.document.getElementById('users-loading').hidden).toBe(true);
  return { dom, document: dom.window.document, fetch };
};

afterEach(() => {
  for (const page of pages.splice(0)) page.window.close();
});

describe('dynamic user admin page', () => {
  test('loads profiles from the API and displays HTML-like names literally', async () => {
    const unsafeName = '<img src=x onerror=alert(1)>';
    const fetch = vi.fn(async () => response(payload([{ ...self, displayName: unsafeName }])));
    const { document } = await openPage(fetch);
    expect(fetch).toHaveBeenCalledWith('/api/users', undefined);
    expect(document.querySelectorAll('#users-list .user-card')).toHaveLength(1);
    expect(document.querySelector('#users-list h2').textContent).toBe(unsafeName);
    expect(document.querySelector('#users-list img')).toBeNull();
    expect(document.querySelector('[name="displayName"]').value).toBe(unsafeName);
    expect(document.querySelector('[data-session-name]').textContent).toBe(`Signed in as ${unsafeName}`);
    expect(document.getElementById('users-error').hidden).toBe(true);
  });

  test('saves a profile with its token and refetches the list without a page reload', async () => {
    const updated = { ...self, displayName: 'Updated Admin' };
    const fetch = vi.fn()
      .mockResolvedValueOnce(response(payload()))
      .mockResolvedValueOnce(response({ user: updated }))
      .mockResolvedValueOnce(response(payload([updated, other])));
    const { dom, document } = await openPage(fetch);
    const form = document.querySelector('#users-list form');
    form.elements.namedItem('displayName').value = updated.displayName;
    form.dispatchEvent(new dom.window.Event('submit', { bubbles: true, cancelable: true }));
    await vi.waitFor(() => expect(document.getElementById('users-status').textContent).toBe('Profile updated.'));
    expect(fetch).toHaveBeenCalledTimes(3);
    const [url, options] = fetch.mock.calls[1];
    expect(url).toBe(`/api/users/${self.id}`);
    expect(options).toMatchObject({ method: 'PATCH', headers: { 'X-CSRF-Token': token, 'Content-Type': 'application/json' } });
    expect(JSON.parse(options.body)).toEqual({ displayName: 'Updated Admin', username: self.username, email: self.email });
    expect(document.querySelector('#users-list h2').textContent).toBe('Updated Admin');
    expect(document.querySelector('[data-session-name]').textContent).toBe('Signed in as Updated Admin');
    expect(dom.window.location.pathname).toBe('/admin/users');
  });

  test('deletes a confirmed account and refreshes the remaining cards', async () => {
    const fetch = vi.fn()
      .mockResolvedValueOnce(response(payload()))
      .mockResolvedValueOnce(response({ deletedId: other.id, signedOut: false }))
      .mockResolvedValueOnce(response(payload([self])));
    const { dom, document } = await openPage(fetch);
    const otherForm = document.querySelector(`form[data-user-id="${other.id}"]`);
    otherForm.querySelector('[data-action="delete"]').click();
    await vi.waitFor(() => expect(document.getElementById('users-status').textContent).toBe('Account deleted.'));
    expect(dom.window.confirm).toHaveBeenCalled();
    expect(fetch.mock.calls[1]).toEqual([
      `/api/users/${other.id}`, { method: 'DELETE', headers: { 'X-CSRF-Token': token } }
    ]);
    expect(document.querySelectorAll('#users-list .user-card')).toHaveLength(1);
    expect(document.querySelector(`form[data-user-id="${other.id}"]`)).toBeNull();
    expect(dom.window.location.pathname).toBe('/admin/users');
  });

  test('cancelling deletion makes no mutation request', async () => {
    const fetch = vi.fn(async () => response(payload()));
    const { dom, document } = await openPage(fetch);
    dom.window.confirm.mockReturnValue(false);
    document.querySelector('[data-action="delete"]').click();
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(document.querySelectorAll('#users-list .user-card')).toHaveLength(2);
  });

  test('displays a conflict and preserves the form for correction', async () => {
    const fetch = vi.fn()
      .mockResolvedValueOnce(response(payload()))
      .mockResolvedValueOnce(response({ error: 'That username or email is already registered.' }, 409));
    const { dom, document } = await openPage(fetch);
    const form = document.querySelector('#users-list form');
    form.elements.namedItem('email').value = other.email;
    form.dispatchEvent(new dom.window.Event('submit', { bubbles: true, cancelable: true }));
    await vi.waitFor(() => expect(document.getElementById('users-error').hidden).toBe(false));
    expect(document.getElementById('users-error').textContent).toContain('already registered');
    expect(form.elements.namedItem('email').value).toBe(other.email);
    expect(form.querySelector('button').disabled).toBe(false);
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  test('explains when a mutation succeeds but reloading the list fails', async () => {
    const fetch = vi.fn()
      .mockResolvedValueOnce(response(payload()))
      .mockResolvedValueOnce(response({ user: self }))
      .mockResolvedValueOnce(response({ error: 'Failed to fetch users' }, 500));
    const { dom, document } = await openPage(fetch);
    document.querySelector('#users-list form').dispatchEvent(new dom.window.Event('submit', { bubbles: true, cancelable: true }));
    await vi.waitFor(() => expect(document.getElementById('users-error').textContent).toContain('Your change was saved'));
    expect(document.getElementById('users-loading').hidden).toBe(true);
    expect(document.getElementById('users-refresh').disabled).toBe(false);
  });

  test('shows the empty state for a successful empty list', async () => {
    const { document } = await openPage(vi.fn(async () => response(payload([]))));
    expect(document.getElementById('users-empty').hidden).toBe(false);
    expect(document.getElementById('users-list').children).toHaveLength(0);
  });

  test('handles an API failure and lets the user retry', async () => {
    const fetch = vi.fn()
      .mockResolvedValueOnce(response({ error: 'Failed to fetch users' }, 500))
      .mockResolvedValueOnce(response(payload()));
    const { document } = await openPage(fetch);
    expect(document.getElementById('users-error').textContent).toBe('Failed to fetch users');
    document.getElementById('users-refresh').click();
    await vi.waitFor(() => expect(document.querySelectorAll('#users-list .user-card')).toHaveLength(2));
    expect(document.getElementById('users-error').hidden).toBe(true);
  });

  test('handles malformed API data without leaving the loading state stuck', async () => {
    const { document } = await openPage(vi.fn(async () => response({ users: null })));
    expect(document.getElementById('users-error').hidden).toBe(false);
    expect(document.getElementById('users-loading').hidden).toBe(true);
    expect(document.getElementById('users-refresh').disabled).toBe(false);
  });
});
