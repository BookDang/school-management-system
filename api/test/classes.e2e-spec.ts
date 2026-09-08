import { type INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcryptjs';
import request from 'supertest';
import type { App } from 'supertest/types';
import { Role } from '@/modules/users/entities/role.enum';
import { UsersService } from '@/modules/users/users.service';
import { AppModule } from './../src/app.module';

describe('Classes (e2e)', () => {
  let app: INestApplication<App>;
  let usersService: UsersService;

  const adminEmail = `e2e-classes-admin-${Date.now()}@example.com`;
  const teacherEmail = `e2e-classes-teacher-${Date.now()}@example.com`;
  const otherTeacherEmail = `e2e-classes-other-teacher-${Date.now()}@example.com`;
  const password = 'password123';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    usersService = moduleFixture.get(UsersService);

    // Provision staff directly through the service - there's no public registration for
    // teacher/admin accounts.
    await usersService.create({
      email: adminEmail,
      password: await bcrypt.hash(password, 10),
      fullName: 'E2E Admin',
      role: Role.Admin,
    });
    await usersService.create({
      email: teacherEmail,
      password: await bcrypt.hash(password, 10),
      fullName: 'E2E Teacher',
      role: Role.Teacher,
    });
    await usersService.create({
      email: otherTeacherEmail,
      password: await bcrypt.hash(password, 10),
      fullName: 'E2E Other Teacher',
      role: Role.Teacher,
    });
  });

  afterAll(async () => {
    await app.close();
  });

  const loginStaffAs = async (email: string) => {
    const res = await request(app.getHttpServer())
      .post('/auth/staff/login')
      .send({ email, password })
      .expect(200);
    return res.body.accessToken as string;
  };

  describe('/traditional-classes', () => {
    const createTraditionalClass = async (token: string, teacherId: string) => {
      const res = await request(app.getHttpServer())
        .post('/traditional-classes')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: '10A1', teacherId, capacity: 30, gradeLevel: '10' })
        .expect(201);
      return res.body.id as string;
    };

    it('rejects unauthenticated access', async () => {
      await request(app.getHttpServer()).get('/traditional-classes').expect(401);
    });

    it('rejects a teacher creating a class', async () => {
      const teacherToken = await loginStaffAs(teacherEmail);
      const teacherId = (await usersService.findByEmail(teacherEmail))?.id;

      await request(app.getHttpServer())
        .post('/traditional-classes')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({ name: '10A1', teacherId, capacity: 30, gradeLevel: '10' })
        .expect(403);
    });

    it('lets an admin create a class and a teacher read it back with its gradeLevel', async () => {
      const adminToken = await loginStaffAs(adminEmail);
      const teacherId = (await usersService.findByEmail(teacherEmail))?.id as string;
      const classId = await createTraditionalClass(adminToken, teacherId);

      const teacherToken = await loginStaffAs(teacherEmail);
      const res = await request(app.getHttpServer())
        .get(`/traditional-classes/${classId}`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .expect(200);

      expect(res.body).toEqual(
        expect.objectContaining({ id: classId, name: '10A1', teacherId, gradeLevel: '10' }),
      );
    });

    it("lets a teacher update their own class but not another teacher's", async () => {
      const adminToken = await loginStaffAs(adminEmail);
      const teacherId = (await usersService.findByEmail(teacherEmail))?.id as string;
      const classId = await createTraditionalClass(adminToken, teacherId);

      const teacherToken = await loginStaffAs(teacherEmail);
      await request(app.getHttpServer())
        .patch(`/traditional-classes/${classId}`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({ capacity: 25, gradeLevel: '11' })
        .expect(200);

      const otherTeacherToken = await loginStaffAs(otherTeacherEmail);
      await request(app.getHttpServer())
        .patch(`/traditional-classes/${classId}`)
        .set('Authorization', `Bearer ${otherTeacherToken}`)
        .send({ capacity: 20 })
        .expect(403);
    });

    it('rejects a teacher deleting a class but lets an admin delete it', async () => {
      const adminToken = await loginStaffAs(adminEmail);
      const teacherId = (await usersService.findByEmail(teacherEmail))?.id as string;
      const classId = await createTraditionalClass(adminToken, teacherId);

      const teacherToken = await loginStaffAs(teacherEmail);
      await request(app.getHttpServer())
        .delete(`/traditional-classes/${classId}`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .expect(403);

      await request(app.getHttpServer())
        .delete(`/traditional-classes/${classId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      await request(app.getHttpServer())
        .get(`/traditional-classes/${classId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });

    it('does not expose a center class through the traditional endpoint', async () => {
      const adminToken = await loginStaffAs(adminEmail);
      const teacherId = (await usersService.findByEmail(teacherEmail))?.id as string;
      const centerRes = await request(app.getHttpServer())
        .post('/center-classes')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'IELTS Foundation', teacherId, capacity: 15, subject: 'English' })
        .expect(201);

      await request(app.getHttpServer())
        .get(`/traditional-classes/${centerRes.body.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });
  });

  describe('/center-classes', () => {
    const createCenterClass = async (token: string, teacherId: string) => {
      const res = await request(app.getHttpServer())
        .post('/center-classes')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'IELTS Foundation', teacherId, capacity: 15, subject: 'English' })
        .expect(201);
      return res.body.id as string;
    };

    it('rejects unauthenticated access', async () => {
      await request(app.getHttpServer()).get('/center-classes').expect(401);
    });

    it('lets an admin create a class and a teacher read it back with its subject', async () => {
      const adminToken = await loginStaffAs(adminEmail);
      const teacherId = (await usersService.findByEmail(teacherEmail))?.id as string;
      const classId = await createCenterClass(adminToken, teacherId);

      const teacherToken = await loginStaffAs(teacherEmail);
      const res = await request(app.getHttpServer())
        .get(`/center-classes/${classId}`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .expect(200);

      expect(res.body).toEqual(
        expect.objectContaining({
          id: classId,
          name: 'IELTS Foundation',
          teacherId,
          subject: 'English',
        }),
      );
    });

    it("lets a teacher update their own class but not another teacher's", async () => {
      const adminToken = await loginStaffAs(adminEmail);
      const teacherId = (await usersService.findByEmail(teacherEmail))?.id as string;
      const classId = await createCenterClass(adminToken, teacherId);

      const teacherToken = await loginStaffAs(teacherEmail);
      await request(app.getHttpServer())
        .patch(`/center-classes/${classId}`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({ capacity: 20, subject: 'Math' })
        .expect(200);

      const otherTeacherToken = await loginStaffAs(otherTeacherEmail);
      await request(app.getHttpServer())
        .patch(`/center-classes/${classId}`)
        .set('Authorization', `Bearer ${otherTeacherToken}`)
        .send({ capacity: 10 })
        .expect(403);
    });

    it('rejects a teacher deleting a class but lets an admin delete it', async () => {
      const adminToken = await loginStaffAs(adminEmail);
      const teacherId = (await usersService.findByEmail(teacherEmail))?.id as string;
      const classId = await createCenterClass(adminToken, teacherId);

      const teacherToken = await loginStaffAs(teacherEmail);
      await request(app.getHttpServer())
        .delete(`/center-classes/${classId}`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .expect(403);

      await request(app.getHttpServer())
        .delete(`/center-classes/${classId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      await request(app.getHttpServer())
        .get(`/center-classes/${classId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });
  });

  describe('/classes/:classId/schedules', () => {
    const scheduleDto = {
      startDate: '2026-09-01',
      endDate: '2026-12-15',
      daysOfWeek: ['monday', 'wednesday'],
      startTime: '18:00',
      endTime: '20:00',
    };

    const createCenterClass = async (token: string, teacherId: string) => {
      const res = await request(app.getHttpServer())
        .post('/center-classes')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'IELTS Foundation', teacherId, capacity: 15, subject: 'English' })
        .expect(201);
      return res.body.id as string;
    };

    it('rejects unauthenticated access', async () => {
      const adminToken = await loginStaffAs(adminEmail);
      const teacherId = (await usersService.findByEmail(teacherEmail))?.id as string;
      const classId = await createCenterClass(adminToken, teacherId);

      await request(app.getHttpServer()).get(`/classes/${classId}/schedules`).expect(401);
    });

    it('returns 404 for a non-existent class', async () => {
      const adminToken = await loginStaffAs(adminEmail);

      await request(app.getHttpServer())
        .get('/classes/00000000-0000-0000-0000-000000000000/schedules')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });

    it("lets a teacher add and read schedules on their own class but not another teacher's", async () => {
      const adminToken = await loginStaffAs(adminEmail);
      const teacherId = (await usersService.findByEmail(teacherEmail))?.id as string;
      const classId = await createCenterClass(adminToken, teacherId);

      const teacherToken = await loginStaffAs(teacherEmail);
      const createRes = await request(app.getHttpServer())
        .post(`/classes/${classId}/schedules`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .send(scheduleDto)
        .expect(201);

      expect(createRes.body).toEqual(expect.objectContaining({ classId, ...scheduleDto }));

      const listRes = await request(app.getHttpServer())
        .get(`/classes/${classId}/schedules`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .expect(200);
      expect(listRes.body).toHaveLength(1);

      const otherTeacherToken = await loginStaffAs(otherTeacherEmail);
      await request(app.getHttpServer())
        .post(`/classes/${classId}/schedules`)
        .set('Authorization', `Bearer ${otherTeacherToken}`)
        .send(scheduleDto)
        .expect(403);
    });

    it('lets a teacher update and delete a schedule on their own class', async () => {
      const adminToken = await loginStaffAs(adminEmail);
      const teacherId = (await usersService.findByEmail(teacherEmail))?.id as string;
      const classId = await createCenterClass(adminToken, teacherId);

      const teacherToken = await loginStaffAs(teacherEmail);
      const createRes = await request(app.getHttpServer())
        .post(`/classes/${classId}/schedules`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .send(scheduleDto)
        .expect(201);
      const scheduleId = createRes.body.id as string;

      await request(app.getHttpServer())
        .patch(`/classes/${classId}/schedules/${scheduleId}`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({ startTime: '19:00' })
        .expect(200)
        .expect((res) => {
          expect(res.body.startTime).toBe('19:00');
        });

      await request(app.getHttpServer())
        .delete(`/classes/${classId}/schedules/${scheduleId}`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .expect(200);

      await request(app.getHttpServer())
        .get(`/classes/${classId}/schedules/${scheduleId}`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .expect(404);
    });
  });
});
