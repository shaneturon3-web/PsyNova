import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { randomUUID } from 'node:crypto';
import { AppModule } from '../src/app.module';

describe('AppController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('/api/health (GET)', async () => {
    const response = await request(app.getHttpServer()).get('/api/health');
    expect(response.status).toBe(200);
    expect(response.body.status).toBe('healthy');
  });

  it('/api/auth/register (POST)', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        email: 'patient@example.com',
        password: 'StrongPass123',
        role: 'patient',
        preferredLanguage: 'en',
      });

    expect(response.status).toBe(201);
    expect(response.body.user.email).toBe('patient@example.com');
  });

  it('/api/auth/login (POST)', async () => {
    await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        email: 'login-check@example.com',
        password: 'StrongPass123',
        role: 'patient',
        preferredLanguage: 'en',
      });

    const okResponse = await request(app.getHttpServer()).post('/api/auth/login').send({
      email: 'login-check@example.com',
      password: 'StrongPass123',
    });

    expect(okResponse.status).toBe(201);
    expect(typeof okResponse.body.accessToken).toBe('string');
    expect(okResponse.body.accessToken.split('.')).toHaveLength(3);

    const badResponse = await request(app.getHttpServer()).post('/api/auth/login').send({
      email: 'login-check@example.com',
      password: 'WrongPass123',
    });

    expect(badResponse.status).toBe(401);
  });

  it('/api/auth/logout (POST)', async () => {
    await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        email: 'logout-check@example.com',
        password: 'StrongPass123',
        role: 'patient',
        preferredLanguage: 'en',
      });

    const loginResponse = await request(app.getHttpServer()).post('/api/auth/login').send({
      email: 'logout-check@example.com',
      password: 'StrongPass123',
    });

    const token = loginResponse.body.accessToken;
    const refreshResponse = await request(app.getHttpServer())
      .post('/api/auth/refresh')
      .set('Authorization', `Bearer ${token}`);
    expect(refreshResponse.status).toBe(201);
    expect(typeof refreshResponse.body.accessToken).toBe('string');

    const refreshedToken = refreshResponse.body.accessToken;
    expect(refreshedToken).not.toBe(token);

    const oldTokenAfterRefresh = await request(app.getHttpServer())
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);
    expect(oldTokenAfterRefresh.status).toBe(401);

    const meBeforeLogout = await request(app.getHttpServer())
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${refreshedToken}`);
    expect(meBeforeLogout.status).toBe(200);
    expect(meBeforeLogout.body.user.email).toBe('logout-check@example.com');
    expect(typeof meBeforeLogout.body.user.exp).toBe('number');

    const logoutResponse = await request(app.getHttpServer())
      .post('/api/auth/logout')
      .set('Authorization', `Bearer ${refreshedToken}`);

    expect(logoutResponse.status).toBe(201);
    expect(logoutResponse.body.revoked).toBe(true);

    const revokedTokenAccess = await request(app.getHttpServer())
      .get('/api/appointments')
      .set('Authorization', `Bearer ${refreshedToken}`);
    expect(revokedTokenAccess.status).toBe(401);

    const meAfterLogout = await request(app.getHttpServer())
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${refreshedToken}`);
    expect(meAfterLogout.status).toBe(401);
  });

  it('/api/auth/refresh (POST)', async () => {
    await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        email: 'refresh-check@example.com',
        password: 'StrongPass123',
        role: 'patient',
        preferredLanguage: 'en',
      });

    const loginResponse = await request(app.getHttpServer()).post('/api/auth/login').send({
      email: 'refresh-check@example.com',
      password: 'StrongPass123',
    });
    const oldToken = loginResponse.body.accessToken;

    const refreshResponse = await request(app.getHttpServer())
      .post('/api/auth/refresh')
      .set('Authorization', `Bearer ${oldToken}`);
    expect(refreshResponse.status).toBe(201);
    expect(typeof refreshResponse.body.accessToken).toBe('string');

    const oldTokenAfterRefresh = await request(app.getHttpServer())
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${oldToken}`);
    expect(oldTokenAfterRefresh.status).toBe(401);
  });

  it('/api/appointments lifecycle', async () => {
    await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        email: 'appointments-check@example.com',
        password: 'StrongPass123',
        role: 'patient',
        preferredLanguage: 'en',
      });
    const loginResponse = await request(app.getHttpServer()).post('/api/auth/login').send({
      email: 'appointments-check@example.com',
      password: 'StrongPass123',
    });
    const token = loginResponse.body.accessToken;

    const patientId = randomUUID();
    const clinicianId = randomUUID();

    const unauthorizedResponse = await request(app.getHttpServer()).post('/api/appointments').send({
      patientId,
      clinicianId,
      startsAt: new Date(Date.now() + 3600000).toISOString(),
      endsAt: new Date(Date.now() + 5400000).toISOString(),
      status: 'pending',
    });
    expect(unauthorizedResponse.status).toBe(401);

    const createResponse = await request(app.getHttpServer())
      .post('/api/appointments')
      .set('Authorization', `Bearer ${token}`)
      .send({
        patientId,
        clinicianId,
        startsAt: new Date(Date.now() + 3600000).toISOString(),
        endsAt: new Date(Date.now() + 5400000).toISOString(),
        status: 'pending',
      });

    expect(createResponse.status).toBe(201);
    expect(createResponse.body.appointment.id).toBeDefined();

    const listResponse = await request(app.getHttpServer())
      .get('/api/appointments')
      .set('Authorization', `Bearer ${token}`);
    expect(listResponse.status).toBe(200);
    expect(Array.isArray(listResponse.body.items)).toBe(true);
  });
});
