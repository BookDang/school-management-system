import { type INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import type { App } from 'supertest/types';
import { Role } from '@/modules/users/entities/role.enum';
import { AppModule } from './../src/app.module';

const REFRESH_COOKIE_NAME = 'refresh_token';

/** Extracts just `name=value` from a Set-Cookie header, suitable for resending as a Cookie header. */
const extractCookie = (res: request.Response, name: string): string => {
  const setCookies = res.headers['set-cookie'] as unknown as string[];
  const cookie = setCookies.find((c) => c.startsWith(`${name}=`));
  if (!cookie) {
    throw new Error(`Expected a Set-Cookie header for "${name}"`);
  }
  return cookie.split(';')[0];
};

describe('Auth (e2e)', () => {
  let app: INestApplication<App>;
  const email = `e2e-auth-${Date.now()}@example.com`;
  const password = 'password123';
  const fullName = 'E2E Test User';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.use(cookieParser());
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('registers a new user, returns an access token, and sets an httpOnly refresh cookie', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email, password, fullName })
      .expect(201);

    expect(res.body.accessToken).toEqual(expect.any(String));
    expect(res.body.refreshToken).toBeUndefined();
    expect(res.body.user).toEqual({
      id: expect.any(String),
      email,
      fullName,
      role: Role.Student,
    });
    expect(res.body.user.password).toBeUndefined();

    expect(extractCookie(res, REFRESH_COOKIE_NAME)).toMatch(
      new RegExp(`^${REFRESH_COOKIE_NAME}=.+`),
    );
    const rawSetCookie = (res.headers['set-cookie'] as unknown as string[]).find((c) =>
      c.startsWith(`${REFRESH_COOKIE_NAME}=`),
    );
    expect(rawSetCookie).toMatch(/HttpOnly/i);
  });

  it('rejects registering the same email twice', async () => {
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email, password, fullName })
      .expect(409);
  });

  it('logs in with correct credentials', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, password })
      .expect(200);

    expect(res.body.accessToken).toEqual(expect.any(String));
    expect(res.body.user.email).toBe(email);
  });

  it('rejects login with a wrong password', async () => {
    await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, password: 'wrong-password' })
      .expect(401);
  });

  it('returns the current user profile for a valid token', async () => {
    const loginRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, password })
      .expect(200);

    const res = await request(app.getHttpServer())
      .get('/users/me')
      .set('Authorization', `Bearer ${loginRes.body.accessToken}`)
      .expect(200);

    expect(res.body).toEqual({ id: expect.any(String), email, fullName, role: Role.Student });
  });

  it('rejects /users/me without a token', async () => {
    await request(app.getHttpServer()).get('/users/me').expect(401);
  });

  it('issues a new access token from the refresh cookie', async () => {
    const loginRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, password })
      .expect(200);
    const refreshCookie = extractCookie(loginRes, REFRESH_COOKIE_NAME);

    const res = await request(app.getHttpServer())
      .post('/auth/refresh')
      .set('Cookie', refreshCookie)
      .expect(200);

    expect(res.body.accessToken).toEqual(expect.any(String));
    expect(res.body.refreshToken).toBeUndefined();
    expect(extractCookie(res, REFRESH_COOKIE_NAME)).not.toBe(refreshCookie);
  });

  it('rejects a used-up refresh cookie after it has been rotated', async () => {
    const loginRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, password })
      .expect(200);
    const originalCookie = extractCookie(loginRes, REFRESH_COOKIE_NAME);

    await request(app.getHttpServer())
      .post('/auth/refresh')
      .set('Cookie', originalCookie)
      .expect(200);

    // Same (now stale) cookie, reused — must be rejected, not silently accepted again.
    await request(app.getHttpServer())
      .post('/auth/refresh')
      .set('Cookie', originalCookie)
      .expect(401);
  });

  it('rejects a garbage refresh cookie', async () => {
    await request(app.getHttpServer())
      .post('/auth/refresh')
      .set('Cookie', `${REFRESH_COOKIE_NAME}=not-a-real-token`)
      .expect(401);
  });

  it('rejects refresh with no cookie at all', async () => {
    await request(app.getHttpServer()).post('/auth/refresh').expect(401);
  });

  it('clears the refresh cookie on logout and rejects refresh afterwards', async () => {
    const loginRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, password })
      .expect(200);
    const refreshCookie = extractCookie(loginRes, REFRESH_COOKIE_NAME);

    const logoutRes = await request(app.getHttpServer())
      .post('/auth/logout')
      .set('Authorization', `Bearer ${loginRes.body.accessToken}`)
      .expect(200);
    expect(extractCookie(logoutRes, REFRESH_COOKIE_NAME)).toBe(`${REFRESH_COOKIE_NAME}=`);

    await request(app.getHttpServer())
      .post('/auth/refresh')
      .set('Cookie', refreshCookie)
      .expect(401);
  });
});
