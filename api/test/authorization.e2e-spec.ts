import { type INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcryptjs';
import request from 'supertest';
import type { App } from 'supertest/types';
import { Role } from '@/modules/users/entities/role.enum';
import { UsersService } from '@/modules/users/users.service';
import { AppModule } from './../src/app.module';

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
    const token = await loginAs(adminEmail);

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
});
