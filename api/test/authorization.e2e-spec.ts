import { type INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcryptjs';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import type { App } from 'supertest/types';
import { Role } from '@/modules/users/entities/role.enum';
import { UsersService } from '@/modules/users/users.service';
import { AppModule } from './../src/app.module';

/** Extracts just `name=value` from a Set-Cookie header, suitable for resending as a Cookie header. */
const extractCookie = (res: request.Response, name: string): string => {
  const setCookies = res.headers['set-cookie'] as unknown as string[];
  const cookie = setCookies.find((c) => c.startsWith(`${name}=`));
  if (!cookie) {
    throw new Error(`Expected a Set-Cookie header for "${name}"`);
  }
  return cookie.split(';')[0];
};

describe('Authorization (e2e)', () => {
  let app: INestApplication<App>;
  let usersService: UsersService;

  const studentEmail = `e2e-authz-student-${Date.now()}@example.com`;
  const adminEmail = `e2e-authz-admin-${Date.now()}@example.com`;
  const password = 'password123';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.use(cookieParser());
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    usersService = moduleFixture.get(UsersService);

    // Registration always creates a Student — seed an Admin directly through the service,
    // the way a real admin account would be provisioned (not through the public API).
    await usersService.create({
      email: adminEmail,
      password: await bcrypt.hash(password, 10),
      fullName: 'E2E Admin',
      role: Role.Admin,
    });

    await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email: studentEmail, password, fullName: 'E2E Student' });
  });

  afterAll(async () => {
    await app.close();
  });

  const loginAs = async (email: string) => {
    const res = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, password })
      .expect(200);
    return res.body.accessToken as string;
  };

  const loginStaffAs = async (email: string) => {
    const res = await request(app.getHttpServer())
      .post('/auth/staff/login')
      .send({ email, password })
      .expect(200);
    return res.body.accessToken as string;
  };

  it('rejects a student logging in through the staff portal', async () => {
    await request(app.getHttpServer())
      .post('/auth/staff/login')
      .send({ email: studentEmail, password })
      .expect(401);
  });

  it('rejects an admin logging in through the end-user portal', async () => {
    await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: adminEmail, password })
      .expect(401);
  });

  it('rejects GET /users without a token', async () => {
    await request(app.getHttpServer()).get('/users').expect(401);
  });

  it('rejects GET /users for a student (not an admin)', async () => {
    const token = await loginAs(studentEmail);

    await request(app.getHttpServer())
      .get('/users')
      .set('Authorization', `Bearer ${token}`)
      .expect(403);
  });

  it('allows GET /users for an admin and includes the seeded users', async () => {
    const token = await loginStaffAs(adminEmail);

    const res = await request(app.getHttpServer())
      .get('/users')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ email: adminEmail, role: Role.Admin }),
        expect.objectContaining({ email: studentEmail, role: Role.Student }),
      ]),
    );
    expect(res.body.every((user: { password?: string }) => user.password === undefined)).toBe(true);
  });

  it('rejects POST /auth/staff/register for a student', async () => {
    const token = await loginAs(studentEmail);

    await request(app.getHttpServer())
      .post('/auth/staff/register')
      .set('Authorization', `Bearer ${token}`)
      .send({
        email: `e2e-authz-newteacher-${Date.now()}@example.com`,
        password,
        fullName: 'New Teacher',
        role: Role.Teacher,
      })
      .expect(403);
  });

  it('rejects POST /auth/staff/register without a token', async () => {
    await request(app.getHttpServer())
      .post('/auth/staff/register')
      .send({
        email: `e2e-authz-newteacher-${Date.now()}@example.com`,
        password,
        fullName: 'New Teacher',
        role: Role.Teacher,
      })
      .expect(401);
  });

  it('lets an admin provision a new teacher account, which can then log in via the staff portal', async () => {
    const adminToken = await loginStaffAs(adminEmail);
    const newTeacherEmail = `e2e-authz-newteacher-${Date.now()}@example.com`;

    const createRes = await request(app.getHttpServer())
      .post('/auth/staff/register')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ email: newTeacherEmail, password, fullName: 'New Teacher', role: Role.Teacher })
      .expect(201);

    expect(createRes.body).toEqual({
      id: expect.any(String),
      email: newTeacherEmail,
      fullName: 'New Teacher',
      role: Role.Teacher,
    });
    // registerStaff doesn't log the new account in on the admin's behalf.
    expect(createRes.body.accessToken).toBeUndefined();

    await loginStaffAs(newTeacherEmail);
  });

  it('rejects a staff refresh cookie on the end-user refresh endpoint, but rotates it fine on /auth/staff/refresh', async () => {
    const loginRes = await request(app.getHttpServer())
      .post('/auth/staff/login')
      .send({ email: adminEmail, password })
      .expect(200);
    const staffRefreshCookie = extractCookie(loginRes, 'staff_refresh_token');

    // Same cookie, wrong portal — rejected before it's ever rotated.
    await request(app.getHttpServer())
      .post('/auth/refresh')
      .set('Cookie', staffRefreshCookie)
      .expect(401);

    await request(app.getHttpServer())
      .post('/auth/staff/refresh')
      .set('Cookie', staffRefreshCookie)
      .expect(200);
  });
});
