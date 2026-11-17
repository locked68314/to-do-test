import type { Server } from 'node:http';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { configureApp } from '../src/app.setup';
import { buildDataSourceOptions } from '../src/config/database.config';
import { Task } from '../src/tasks/entities/task.entity';
import { TaskStatus } from '../src/tasks/enums/task-status.enum';
import { TasksModule } from '../src/tasks/tasks.module';

const UNKNOWN_ID = '00000000-0000-4000-8000-000000000000';

/** Forma de la tarea tal y como la serializa la API. */
interface TaskResponse {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  assignee: string;
  dueDate: string;
  createdAt: string;
  updatedAt: string;
}

interface PaginatedTasksResponse {
  data: TaskResponse[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

interface ErrorResponse {
  statusCode: number;
  error: string;
  message: string | string[];
}

describe('Tasks (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        // SQLite en memoria creada aplicando las migraciones reales:
        // así los tests validan también el esquema versionado.
        TypeOrmModule.forRoot({
          ...buildDataSourceOptions({}),
          database: ':memory:',
          migrationsRun: true,
          logging: false,
        }),
        TasksModule,
      ],
    }).compile();

    app = configureApp(module.createNestApplication());
    dataSource = module.get(DataSource);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await dataSource.getRepository(Task).clear();
  });

  /** supertest sobre el servidor HTTP ya tipado. */
  function api() {
    return request(app.getHttpServer() as Server);
  }

  function createTask(overrides: Record<string, unknown> = {}) {
    return api()
      .post('/api/tasks')
      .send({
        title: 'Preparar informe',
        description: 'Cierre Q4',
        assignee: 'ana@acme.com',
        dueDate: '2026-12-01T00:00:00.000Z',
        ...overrides,
      });
  }

  it('aplica la migración inicial al arrancar', async () => {
    const applied = await dataSource.query<{ name: string }[]>(
      'SELECT name FROM migrations',
    );

    expect(applied.map((row) => row.name)).toContain(
      'CreateTasksTable1794877967631',
    );
  });

  describe('POST /api/tasks', () => {
    it('crea la tarea y responde 201 con estado pendiente por defecto', async () => {
      const response = await createTask({ status: undefined }).expect(201);
      const task = response.body as TaskResponse;

      expect(task).toMatchObject({
        title: 'Preparar informe',
        description: 'Cierre Q4',
        status: TaskStatus.PENDING,
        assignee: 'ana@acme.com',
        dueDate: '2026-12-01T00:00:00.000Z',
      });
      expect(task.id).toMatch(/^[0-9a-f-]{36}$/);
    });

    it('guarda description a null cuando no se envía', async () => {
      const response = await createTask({ description: undefined }).expect(201);

      expect((response.body as TaskResponse).description).toBeNull();
    });

    it('responde 400 si falta el título', async () => {
      const response = await createTask({ title: '' }).expect(400);

      expect((response.body as ErrorResponse).message).toContain(
        'title no puede estar vacío',
      );
    });

    it('responde 400 si falta el responsable', async () => {
      await createTask({ assignee: undefined }).expect(400);
    });

    it('responde 400 si el estado no es válido', async () => {
      const response = await createTask({ status: 'urgente' }).expect(400);

      expect((response.body as ErrorResponse).message).toContain(
        'status debe ser uno de: pending, in_progress, done',
      );
    });

    it('responde 400 si la fecha límite no es ISO 8601', async () => {
      await createTask({ dueDate: '01/12/2026' }).expect(400);
    });

    it('responde 400 ante propiedades desconocidas', async () => {
      const response = await createTask({ prioridad: 'alta' }).expect(400);

      expect((response.body as ErrorResponse).message).toContain(
        'property prioridad should not exist',
      );
    });
  });

  describe('GET /api/tasks', () => {
    beforeEach(async () => {
      await createTask({
        title: 'Tarea 1',
        assignee: 'ana@acme.com',
        status: TaskStatus.PENDING,
        dueDate: '2026-12-01T00:00:00.000Z',
      });
      await createTask({
        title: 'Tarea 2',
        assignee: 'ana@acme.com',
        status: TaskStatus.IN_PROGRESS,
        dueDate: '2026-12-02T00:00:00.000Z',
      });
      await createTask({
        title: 'Tarea 3',
        assignee: 'luis@acme.com',
        status: TaskStatus.IN_PROGRESS,
        dueDate: '2026-12-03T00:00:00.000Z',
      });
      await createTask({
        title: 'Tarea 4',
        assignee: 'luis@acme.com',
        status: TaskStatus.DONE,
        dueDate: '2026-12-04T00:00:00.000Z',
      });
    });

    it('devuelve todas las tareas paginadas por defecto', async () => {
      const response = await api().get('/api/tasks').expect(200);
      const body = response.body as PaginatedTasksResponse;

      expect(body.meta).toEqual({
        total: 4,
        page: 1,
        limit: 10,
        totalPages: 1,
      });
      expect(body.data).toHaveLength(4);
    });

    it('filtra por estado', async () => {
      const response = await api()
        .get('/api/tasks')
        .query({ status: TaskStatus.IN_PROGRESS })
        .expect(200);
      const body = response.body as PaginatedTasksResponse;

      expect(body.meta.total).toBe(2);
      expect(body.data.map((task) => task.title)).toEqual([
        'Tarea 2',
        'Tarea 3',
      ]);
    });

    it('filtra por responsable', async () => {
      const response = await api()
        .get('/api/tasks')
        .query({ assignee: 'luis@acme.com' })
        .expect(200);
      const body = response.body as PaginatedTasksResponse;

      expect(body.meta.total).toBe(2);
      expect(body.data.map((task) => task.title)).toEqual([
        'Tarea 3',
        'Tarea 4',
      ]);
    });

    it('combina estado y responsable', async () => {
      const response = await api()
        .get('/api/tasks')
        .query({ status: TaskStatus.IN_PROGRESS, assignee: 'ana@acme.com' })
        .expect(200);
      const body = response.body as PaginatedTasksResponse;

      expect(body.meta.total).toBe(1);
      expect(body.data[0].title).toBe('Tarea 2');
    });

    it('pagina los resultados', async () => {
      const response = await api()
        .get('/api/tasks')
        .query({ page: 2, limit: 2 })
        .expect(200);
      const body = response.body as PaginatedTasksResponse;

      expect(body.meta).toEqual({
        total: 4,
        page: 2,
        limit: 2,
        totalPages: 2,
      });
      expect(body.data.map((task) => task.title)).toEqual([
        'Tarea 3',
        'Tarea 4',
      ]);
    });

    it('responde 400 si la paginación no es válida', async () => {
      await api().get('/api/tasks').query({ page: 'abc' }).expect(400);

      await api().get('/api/tasks').query({ limit: 500 }).expect(400);
    });

    it('responde 400 ante un filtro desconocido', async () => {
      await api()
        .get('/api/tasks')
        .query({ responsable: 'ana@acme.com' })
        .expect(400);
    });
  });

  describe('GET /api/tasks/:id', () => {
    it('devuelve la tarea existente', async () => {
      const created = (await createTask().expect(201)).body as TaskResponse;

      const response = await api().get(`/api/tasks/${created.id}`).expect(200);

      expect((response.body as TaskResponse).id).toBe(created.id);
    });

    it('responde 404 si la tarea no existe', async () => {
      const response = await api().get(`/api/tasks/${UNKNOWN_ID}`).expect(404);

      expect((response.body as ErrorResponse).message).toBe(
        `No existe una tarea con id ${UNKNOWN_ID}`,
      );
    });

    it('responde 400 si el id no es un uuid', async () => {
      await api().get('/api/tasks/no-es-uuid').expect(400);
    });
  });

  describe('PATCH /api/tasks/:id', () => {
    it('actualiza solo los campos enviados', async () => {
      const created = (await createTask().expect(201)).body as TaskResponse;

      const response = await api()
        .patch(`/api/tasks/${created.id}`)
        .send({ status: TaskStatus.DONE, dueDate: '2027-01-15T10:00:00.000Z' })
        .expect(200);

      expect(response.body).toMatchObject({
        id: created.id,
        title: 'Preparar informe',
        assignee: 'ana@acme.com',
        status: TaskStatus.DONE,
        dueDate: '2027-01-15T10:00:00.000Z',
      });
    });

    it('responde 400 si el estado no es válido', async () => {
      const created = (await createTask().expect(201)).body as TaskResponse;

      await api()
        .patch(`/api/tasks/${created.id}`)
        .send({ status: 'hecha' })
        .expect(400);
    });

    it('responde 404 si la tarea no existe', async () => {
      await api()
        .patch(`/api/tasks/${UNKNOWN_ID}`)
        .send({ title: 'Nuevo título' })
        .expect(404);
    });
  });

  describe('DELETE /api/tasks/:id', () => {
    it('borra la tarea y responde 204', async () => {
      const created = (await createTask().expect(201)).body as TaskResponse;

      await api().delete(`/api/tasks/${created.id}`).expect(204);

      await api().get(`/api/tasks/${created.id}`).expect(404);
    });

    it('responde 404 si la tarea no existe', async () => {
      await api().delete(`/api/tasks/${UNKNOWN_ID}`).expect(404);
    });
  });
});
