import 'reflect-metadata';
import request from 'supertest';
import app from '../../src/app';
import { AppDataSource } from '../../src/config/database';
import { User } from '../../src/entities';

describe('E2E API Endpoints Workflow', () => {
  let memberToken: string;
  let projectId: string;
  let taskId: string;

  beforeAll(async () => {
    // Initialize real database connection for E2E tests
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }

    // Clean up any stale test user data from previous runs to ensure idempotency
    const userRepository = AppDataSource.getRepository(User);
    const staleUser = await userRepository.findOneBy({ email: 'e2e_member@test.com' });
    if (staleUser) {
      await userRepository.remove(staleUser);
    }
  });

  afterAll(async () => {
    // Tear down database connection
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  });

  describe('Auth Endpoints', () => {
    it('POST /api/v1/auth/register - should register a new member', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          name: 'E2E Member',
          email: 'e2e_member@test.com',
          password: 'MemberPassword123',
          role: 'member',
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.status).toBe('success');
      expect(res.body.data).toHaveProperty('token');
      expect(res.body.data.user.email).toBe('e2e_member@test.com');
    });

    it('POST /api/v1/auth/login - should login and return JWT', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'e2e_member@test.com',
          password: 'MemberPassword123',
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data).toHaveProperty('token');
      memberToken = res.body.data.token;
    });
  });

  describe('Projects Endpoints', () => {
    it('POST /api/v1/projects - should block unauthorized project creation', async () => {
      const res = await request(app)
        .post('/api/v1/projects')
        .send({ title: 'Unauthorized Project' });

      expect(res.statusCode).toBe(401);
    });

    it('POST /api/v1/projects - should create project for authenticated user', async () => {
      const res = await request(app)
        .post('/api/v1/projects')
        .set('Authorization', `Bearer ${memberToken}`)
        .send({
          title: 'E2E Test Project',
          description: 'A project created during E2E testing',
          status: 'in_progress',
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.status).toBe('success');
      expect(res.body.data.project.title).toBe('E2E Test Project');
      projectId = res.body.data.project.id;
    });

    it('GET /api/v1/projects - should list projects for user', async () => {
      const res = await request(app)
        .get('/api/v1/projects')
        .set('Authorization', `Bearer ${memberToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.results).toBeGreaterThan(0);
      expect(res.body.data[0].id).toBe(projectId);
    });
  });

  describe('Tasks Endpoints', () => {
    it('POST /api/v1/projects/:projectId/tasks - should create task under project', async () => {
      const res = await request(app)
        .post(`/api/v1/projects/${projectId}/tasks`)
        .set('Authorization', `Bearer ${memberToken}`)
        .send({
          title: 'E2E Task 1',
          description: 'E2E task description',
          status: 'pending',
          priority: 'high',
          dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(), // Tomorrow
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.status).toBe('success');
      expect(res.body.data.task.title).toBe('E2E Task 1');
      taskId = res.body.data.task.id;
    });

    it('GET /api/v1/projects/:projectId/tasks - should list tasks for project', async () => {
      const res = await request(app)
        .get(`/api/v1/projects/${projectId}/tasks`)
        .set('Authorization', `Bearer ${memberToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.results).toBeGreaterThan(0);
    });

    it('PATCH /api/v1/tasks/:id - should update task details', async () => {
      const res = await request(app)
        .patch(`/api/v1/tasks/${taskId}`)
        .set('Authorization', `Bearer ${memberToken}`)
        .send({
          status: 'in_progress',
          priority: 'medium',
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.task.status).toBe('in_progress');
      expect(res.body.data.task.priority).toBe('medium');
    });

    it('DELETE /api/v1/tasks/:id - should delete task', async () => {
      const res = await request(app)
        .delete(`/api/v1/tasks/${taskId}`)
        .set('Authorization', `Bearer ${memberToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe('success');

      // Verify task is deleted
      const checkRes = await request(app)
        .get(`/api/v1/tasks/${taskId}`)
        .set('Authorization', `Bearer ${memberToken}`);
      expect(checkRes.statusCode).toBe(404);
    });
  });

  describe('Cleanup', () => {
    it('DELETE /api/v1/projects/:id - should delete project and cascade delete member record', async () => {
      const res = await request(app)
        .delete(`/api/v1/projects/${projectId}`)
        .set('Authorization', `Bearer ${memberToken}`);

      expect(res.statusCode).toBe(200);

      // Verify project is deleted
      const checkRes = await request(app)
        .get(`/api/v1/projects/${projectId}`)
        .set('Authorization', `Bearer ${memberToken}`);
      expect(checkRes.statusCode).toBe(404);
    });
  });
});
