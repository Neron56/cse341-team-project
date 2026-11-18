import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import bcrypt from 'bcrypt';
import request from 'supertest';
import app from '../app.js';
import User from '../src/models/schemas/users.js';
import Role from '../src/models/schemas/roles.js';

const password = 'fictional-profile-test-password';
// Low cost is only for disposable test fixtures; production hashing stays at 12.
const passwordHash = await bcrypt.hash(password, 4);
let accounts;

beforeEach(async () => {
  const roles = await Role.find({}).lean();
  const roleId = (name) => roles.find((role) => role.name === name)._id;
  const users = await User.create([
    { displayName: 'Sam Rider', username: 'sam-rider', email: 'sam@example.test', role: roleId('customer'), passwordHash },
    { displayName: 'Lee Rider', username: 'lee-rider', email: 'lee@example.test', role: roleId('customer'), passwordHash },
    { displayName: 'Admin Rider', username: 'admin-rider', email: 'admin@example.test', role: roleId('admin'), passwordHash }
  ]);
  accounts = { sam: users[0], lee: users[1], admin: users[2] };
});

afterEach(() => vi.restoreAllMocks());

const signIn = async (name = 'sam') => {
  const account = accounts[name];
  const agent = request.agent(app);
  const login = await agent.post('/login').send({ email: account.email, password });
  expect(login.status).toBe(303);
  const list = await agent.get('/api/users');
  expect(list.status).toBe(200);
  return { agent, token: list.body.csrfToken, id: account.id, list };
};

describe('user page and list authorization', () => {
  test('redirects the signed-out page and returns JSON 401 for every user API', async () => {
    const page = await request(app).get('/admin/users');
    expect(page.status).toBe(302);
    expect(page.headers.location).toBe('/login');
    for (const method of ['get', 'patch', 'delete']) {
      const url = method === 'get' ? '/api/users' : `/api/users/${accounts.sam.id}`;
      const response = await request(app)[method](url).send({ displayName: 'Changed' });
      expect(response.status).toBe(401);
      expect(response.body).toEqual({ error: 'Authentication required' });
      expect(response.headers['content-type']).toContain('application/json');
    }
  });

  test('allows a customer to see only self and renders only a page shell', async () => {
    const { agent, list, id } = await signIn();
    expect(list.body.users).toHaveLength(1);
    expect(list.body.users[0]).toMatchObject({ id, email: accounts.sam.email, role: 'customer' });
    expect(list.body.currentUserId).toBe(id);
    expect(list.body.csrfToken).toMatch(/^[a-f0-9]{64}$/);
    expect(list.headers['cache-control']).toBe('no-store');
    const page = await agent.get('/admin/users');
    expect(page.status).toBe(200);
    expect(page.headers['cache-control']).toBe('no-store');
    expect(page.text).toContain('<h1>My Account</h1>');
    expect(page.text).toContain('/js/user-admin.js');
    expect(page.text).not.toContain(accounts.sam.email);
    expect(page.text).not.toContain(accounts.lee.email);
  });

  test('allows admins to see all safe profiles and links the dashboard', async () => {
    const { agent, list } = await signIn('admin');
    expect(list.body.users).toHaveLength(3);
    expect(list.body.users.map((user) => user.username)).toEqual(['admin-rider', 'lee-rider', 'sam-rider']);
    for (const user of list.body.users) {
      expect(Object.keys(user).sort()).toEqual(
        ['id', 'displayName', 'username', 'email', 'role', 'createdAt', 'updatedAt'].sort()
      );
    }
    expect(JSON.stringify(list.body)).not.toContain('password');
    const dashboard = await agent.get('/admin');
    expect(dashboard.text).toContain('href="/admin/users"');
    expect((await agent.get('/admin/users')).text).toContain('<h1>User Administration</h1>');
  });
});

describe('profile updates and deletion', () => {
  test('updates own profile, normalizes fields, refreshes identity, and preserves credentials/role', async () => {
    const { agent, token, id } = await signIn();
    const roleBefore = accounts.sam.role.toString();
    const updated = await agent.patch(`/api/users/${id.toUpperCase()}`).set('X-CSRF-Token', token).send({
      displayName: '  Sam Updated  ', username: ' SAM.UPDATED ', email: ' SAM.UPDATED@EXAMPLE.TEST '
    });
    expect(updated.status).toBe(200);
    expect(updated.body.user).toMatchObject({ id, displayName: 'Sam Updated', username: 'sam.updated', email: 'sam.updated@example.test' });
    expect(updated.body.user).not.toHaveProperty('passwordHash');
    const stored = await User.findById(id).select('+passwordHash');
    expect(stored.passwordHash).toBe(passwordHash);
    expect(stored.role.toString()).toBe(roleBefore);
    const identity = await agent.get('/api/auth/me');
    expect(identity.body.user).toMatchObject({ displayName: 'Sam Updated', username: 'sam.updated', email: 'sam.updated@example.test' });
    const login = await request(app).post('/login').send({ email: 'sam.updated@example.test', password });
    expect(login.status).toBe(303);
  });

  test('admin can update and delete another account', async () => {
    const target = await signIn('lee');
    const { agent, token } = await signIn('admin');
    const update = await agent.patch(`/api/users/${target.id}`).set('X-CSRF-Token', token).send({ displayName: 'Lee Updated' });
    expect(update.status).toBe(200);
    expect(update.body.user.displayName).toBe('Lee Updated');
    const deletion = await agent.delete(`/api/users/${target.id}`).set('X-CSRF-Token', token);
    expect(deletion.status).toBe(200);
    expect(deletion.body).toEqual({ deletedId: target.id, signedOut: false });
    expect((await agent.get('/api/users')).body.users).toHaveLength(2);
    expect(await User.findById(target.id)).toBeNull();
    expect((await target.agent.get('/api/users')).status).toBe(401);
  });

  test.each(['sam', 'admin'])('self-deletion signs out %s and revokes second-session access', async (name) => {
    const first = await signIn(name);
    const second = await signIn(name);
    const response = await first.agent.delete(`/api/users/${first.id}`).set('X-CSRF-Token', first.token);
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ deletedId: first.id, signedOut: true });
    expect(response.headers['set-cookie'][0]).toContain('kizuna.sid=;');
    expect(await User.findById(first.id)).toBeNull();
    expect((await first.agent.get('/api/users')).status).toBe(401);
    expect((await second.agent.get('/api/users')).status).toBe(401);
    expect((await second.agent.get('/admin/users')).headers.location).toBe('/login');
    expect((await request(app).post('/login').send({ email: accounts[name].email, password })).status).toBe(401);
  });

  test.each(['patch', 'delete'])('customer cannot %s another account or probe an absent account', async (method) => {
    const { agent, token } = await signIn();
    for (const id of [accounts.lee.id, 'f'.repeat(24)]) {
      const response = await agent[method](`/api/users/${id}`).set('X-CSRF-Token', token).send({ displayName: 'Forbidden' });
      expect(response.status).toBe(403);
      expect(response.body).toEqual({ error: 'Forbidden' });
    }
    expect(await User.countDocuments()).toBe(3);
    expect((await User.findById(accounts.lee.id)).displayName).toBe('Lee Rider');
  });

  test.each(['patch', 'delete'])('admin receives 404 for %s of an absent account', async (method) => {
    const { agent, token } = await signIn('admin');
    const response = await agent[method](`/api/users/${'f'.repeat(24)}`).set('X-CSRF-Token', token).send({ displayName: 'Missing' });
    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: 'User not found' });
  });
});

describe('input and mutation protection', () => {
  test.each([
    {}, [], { displayName: '' }, { displayName: ' '.repeat(3) }, { displayName: 'a'.repeat(81) },
    { displayName: { $ne: null } }, { username: 'x' }, { username: 'invalid name' },
    { email: 'bad' }, { email: 'a'.repeat(255) + '@example.test' },
    { role: 'admin' }, { password: 'replacement' }, { passwordHash: 'replacement' },
    { id: 'f'.repeat(24) }, { $set: { role: 'admin' } }, { createdAt: '2000-01-01' }
  ].map((body) => [body]))('rejects invalid or uneditable fields: %j', async (body) => {
    const { agent, token, id } = await signIn();
    const response = await agent.patch(`/api/users/${id}`).set('X-CSRF-Token', token).send(body);
    expect(response.status).toBe(400);
    expect((await User.findById(id)).displayName).toBe('Sam Rider');
  });

  test.each(['patch', 'delete'])('rejects malformed %s target IDs', async (method) => {
    const { agent, token } = await signIn('admin');
    const response = await agent[method]('/api/users/not-an-object-id').set('X-CSRF-Token', token).send({ displayName: 'Invalid' });
    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Invalid user ID');
  });

  test.each(['patch', 'delete'])('rejects %s without a valid same-session token', async (method) => {
    const first = await signIn();
    const second = await signIn();
    for (const token of [undefined, 'invalid', '0'.repeat(64), second.token]) {
      let req = first.agent[method](`/api/users/${first.id}`).send({ displayName: 'No change' });
      if (token) req = req.set('X-CSRF-Token', token);
      const response = await req;
      expect(response.status).toBe(403);
    }
    expect((await User.findById(first.id)).displayName).toBe('Sam Rider');
    expect(await User.countDocuments()).toBe(3);
  });

  test.each(['username', 'email'])('returns 409 for duplicate %s without partial changes', async (field) => {
    const { agent, token, id } = await signIn();
    const response = await agent.patch(`/api/users/${id}`).set('X-CSRF-Token', token).send({
      displayName: 'Must not change', [field]: accounts.lee[field].toUpperCase()
    });
    expect(response.status).toBe(409);
    expect(response.body.error).toBe('That username or email is already registered.');
    expect((await User.findById(id)).displayName).toBe('Sam Rider');
  });

  test('returns safe JSON for malformed request JSON', async () => {
    const response = await request(app).patch(`/api/users/${accounts.sam.id}`)
      .set('Content-Type', 'application/json').send('{');
    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: 'Invalid request' });
  });
});

describe('current account checks and safe failures', () => {
  test('a demoted admin immediately loses access to other profiles and the dashboard', async () => {
    const { agent, token, id } = await signIn('admin');
    await User.updateOne({ _id: id }, { role: accounts.sam.role });
    const list = await agent.get('/api/users');
    expect(list.body.users).toHaveLength(1);
    expect(list.body.users[0].role).toBe('customer');
    expect((await agent.get('/admin')).status).toBe(403);
    const update = await agent.patch(`/api/users/${accounts.lee.id}`).set('X-CSRF-Token', token).send({ displayName: 'Forbidden' });
    expect(update.status).toBe(403);
    expect((await agent.delete(`/api/users/${accounts.lee.id}`).set('X-CSRF-Token', token)).status).toBe(403);
  });

  test('a deleted account loses access through its existing session', async () => {
    const { agent, id } = await signIn('admin');
    await User.deleteOne({ _id: id });
    expect((await agent.get('/api/users')).status).toBe(401);
    expect((await agent.get('/api/admin/dashboard')).status).toBe(401);
    expect((await agent.get('/admin/users')).headers.location).toBe('/login');
  });

  test.each([
    ['find', 'get', 'Failed to fetch users'],
    ['findByIdAndUpdate', 'patch', 'Failed to update user'],
    ['findByIdAndDelete', 'delete', 'Failed to delete user']
  ])('returns a generic JSON 500 for a %s failure', async (modelMethod, method, message) => {
    const { agent, id, token } = await signIn('admin');
    vi.spyOn(User, modelMethod).mockImplementation(() => { throw new Error('private database detail'); });
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const url = method === 'get' ? '/api/users' : `/api/users/${id}`;
    const response = await agent[method](url).set('X-CSRF-Token', token).send({ displayName: 'Change' });
    expect(response.status).toBe(500);
    expect(response.body).toEqual({ error: message });
  });

  test('identity lookup failure denies access with generic JSON', async () => {
    const { agent } = await signIn('admin');
    vi.spyOn(User, 'findById').mockImplementation(() => { throw new Error('private identity error'); });
    const response = await agent.get('/api/users');
    expect(response.status).toBe(500);
    expect(response.body).toEqual({ error: 'Unable to complete request' });
    expect(response.headers['content-type']).toContain('application/json');
  });
});
