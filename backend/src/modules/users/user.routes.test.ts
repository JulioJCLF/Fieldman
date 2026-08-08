import request from 'supertest';
import { describe, expect, it } from 'vitest';

import { buildTestApp } from '../../test/harness.js';
import type { StaffUser } from './user.types.js';

const staff: StaffUser = {
  id: '9ae2910f-4d70-4d3b-a5f4-12a5a3b04545',
  email: 'admin@fieldman.app',
  created_at: '2026-08-08T16:13:01.797Z',
  last_sign_in_at: '2026-08-08T17:54:01.724Z',
};

describe('user routes', () => {
  it('lists staff users', async () => {
    const { app, services } = buildTestApp();
    services.userService.list.mockResolvedValue([staff]);

    const response = await request(app).get('/api/users');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ success: true, data: [staff] });
  });

  it('creates a staff user with a valid payload', async () => {
    const { app, services } = buildTestApp();
    services.userService.create.mockResolvedValue(staff);

    const response = await request(app)
      .post('/api/users')
      .send({ email: 'Admin@Fieldman.app', password: 'segredo123' });

    expect(response.status).toBe(201);
    expect(response.body).toEqual({ success: true, data: staff });
    expect(services.userService.create).toHaveBeenCalledWith({ email: 'admin@fieldman.app', password: 'segredo123' });
  });

  it('rejects a short password', async () => {
    const { app, services } = buildTestApp();

    const response = await request(app)
      .post('/api/users')
      .send({ email: 'novo@fieldman.app', password: '123' });

    expect(response.status).toBe(400);
    expect(services.userService.create).not.toHaveBeenCalled();
  });

  it('updates a staff user', async () => {
    const { app, services } = buildTestApp();
    services.userService.update.mockResolvedValue({ ...staff, email: 'novo@fieldman.app' });

    const response = await request(app)
      .patch(`/api/users/${staff.id}`)
      .send({ email: 'novo@fieldman.app' });

    expect(response.status).toBe(200);
    expect(services.userService.update).toHaveBeenCalledWith(staff.id, { email: 'novo@fieldman.app' });
  });

  it('rejects an empty update', async () => {
    const { app, services } = buildTestApp();

    const response = await request(app).patch(`/api/users/${staff.id}`).send({});

    expect(response.status).toBe(400);
    expect(services.userService.update).not.toHaveBeenCalled();
  });

  it('removes a staff user', async () => {
    const { app, services } = buildTestApp();
    services.userService.remove.mockResolvedValue(undefined);

    const response = await request(app).delete(`/api/users/${staff.id}`);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ success: true, data: { id: staff.id } });
    expect(services.userService.remove).toHaveBeenCalledWith(staff.id);
  });
});
