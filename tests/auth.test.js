import { describe, expect, test } from 'vitest';
import request from 'supertest';
import app from '../app.js';
import Role from '../src/models/schemas/roles.js';
import User from '../src/models/schemas/users.js';

const registration = {
  displayName: 'Test Passenger',
  username: 'test-passenger',
  email: 'passenger@example.com',
  password: 'a-long-test-password'
};

describe('Week 04 core authentication', () => {
  test('redirects unauthenticated pages and rejects unauthenticated API requests', async () => {
    const page = await request(app).get('/admin');
    const api = await request(app).get('/api/auth/me');
    const roleApi = await request(app).get('/api/admin/dashboard');
    const loginForm = await request(app).get('/login');
    const registrationForm = await request(app).get('/register');

    expect(page.status).toBe(302);
    expect(page.headers.location).toBe('/login');
    expect(api.status).toBe(401);
    expect(api.body).toEqual({ error: 'Authentication required' });
    expect(roleApi.status).toBe(401);
    expect(roleApi.body).toEqual({ error: 'Authentication required' });
    expect(loginForm.status).toBe(200);
    expect(registrationForm.status).toBe(200);
  });

  test('registers customers with a password hash and rejects invalid or duplicate credentials', async () => {
    const emptyRegistration = await request(app).post('/register');
    expect(emptyRegistration.status).toBe(400);

    const invalid = await request(app).post('/register').send({
      ...registration,
      password: 'short'
    });
    expect(invalid.status).toBe(400);

    const response = await request(app).post('/register').send({
      ...registration,
      role: 'admin'
    });
    expect(response.status).toBe(303);
    expect(response.headers.location).toBe('/login?registered=1');

    const user = await User.findOne({ email: registration.email }).select('+passwordHash').populate('role');
    expect(user.passwordHash).not.toBe(registration.password);
    expect(user.role.name).toBe('customer');

    const duplicate = await request(app).post('/register').send(registration);
    expect(duplicate.status).toBe(409);

    const emptyLogin = await request(app).post('/login');
    expect(emptyLogin.status).toBe(401);

    const invalidLogin = await request(app).post('/login').send({
      email: registration.email,
      password: 'incorrect-password'
    });
    expect(invalidLogin.status).toBe(401);
    expect(invalidLogin.text).toContain('Email or password is incorrect.');
  });

  test('persists login state, denies customer admin access, and revokes access on logout', async () => {
    const browser = request.agent(app);
    await browser.post('/register').send(registration);

    const login = await browser.post('/login').send({
      email: registration.email,
      password: registration.password
    });
    expect(login.status).toBe(303);
    expect(login.headers.location).toBe('/trips');
    expect(login.headers['set-cookie'][0]).toContain('HttpOnly');
    expect(login.headers['set-cookie'][0]).toContain('SameSite=Lax');

    const profile = await browser.get('/api/auth/me');
    expect(profile.status).toBe(200);
    expect(profile.body.user).toMatchObject({
      displayName: registration.displayName,
      username: registration.username,
      role: 'customer'
    });
    expect(profile.body.user).not.toHaveProperty('passwordHash');

    const adminPage = await browser.get('/admin');
    const adminApi = await browser.get('/api/admin/dashboard');
    expect(adminPage.status).toBe(403);
    expect(adminApi.status).toBe(403);
    expect(adminApi.body).toEqual({ error: 'Forbidden' });

    const logout = await browser.post('/logout');
    expect(logout.status).toBe(303);
    expect(logout.headers.location).toBe('/login?loggedOut=1');
    expect((await browser.get('/api/auth/me')).status).toBe(401);
    expect((await browser.get('/admin')).headers.location).toBe('/login');
  });

  test('allows an authenticated admin to open the protected page and API', async () => {
    await request(app).post('/register').send(registration);
    const adminRole = await Role.findOne({ name: 'admin' });
    await User.updateOne({ email: registration.email }, { role: adminRole._id });

    const browser = request.agent(app);
    const login = await browser.post('/login').send({
      email: registration.email,
      password: registration.password
    });
    expect(login.status).toBe(303);
    expect(login.headers.location).toBe('/admin');

    const page = await browser.get('/admin');
    expect(page.status).toBe(200);
    expect(page.text).toContain('Welcome to the Admin Dashboard');

    const api = await browser.get('/api/admin/dashboard');
    expect(api.status).toBe(200);
    expect(api.body.message).toBe('Welcome to the Admin Dashboard');
    expect(api.body.user.role).toBe('admin');
  });
});
