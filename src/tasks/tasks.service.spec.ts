import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { QueryTasksDto } from './dto/query-tasks.dto';
import { Task } from './entities/task.entity';
import { TaskStatus } from './enums/task-status.enum';
import { TasksService } from './tasks.service';

const TASK_ID = '7f3c7d1e-0b6a-4a2b-9f1c-0f8a5b2d4c11';

function buildTask(overrides: Partial<Task> = {}): Task {
  return {
    id: TASK_ID,
    title: 'Preparar informe',
    description: 'Cierre Q4',
    status: TaskStatus.PENDING,
    assignee: 'ana@acme.com',
    dueDate: new Date('2026-12-01T00:00:00.000Z'),
    createdAt: new Date('2026-11-01T00:00:00.000Z'),
    updatedAt: new Date('2026-11-01T00:00:00.000Z'),
    ...overrides,
  };
}

/** Query con los valores por defecto que aplicaría el ValidationPipe. */
function buildQuery(overrides: Partial<QueryTasksDto> = {}): QueryTasksDto {
  return Object.assign(new QueryTasksDto(), overrides);
}

describe('TasksService', () => {
  let service: TasksService;
  let repository: jest.Mocked<Repository<Task>>;

  beforeEach(async () => {
    const repositoryMock = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      findAndCount: jest.fn(),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TasksService,
        { provide: getRepositoryToken(Task), useValue: repositoryMock },
      ],
    }).compile();

    service = module.get(TasksService);
    repository = module.get(getRepositoryToken(Task));
  });

  describe('create', () => {
    it('aplica el estado pendiente por defecto y convierte dueDate a Date', async () => {
      const created = buildTask();
      repository.create.mockReturnValue(created);
      repository.save.mockResolvedValue(created);

      const result = await service.create({
        title: 'Preparar informe',
        description: 'Cierre Q4',
        assignee: 'ana@acme.com',
        dueDate: '2026-12-01T00:00:00.000Z',
      });

      expect(repository.create).toHaveBeenCalledWith({
        title: 'Preparar informe',
        description: 'Cierre Q4',
        status: TaskStatus.PENDING,
        assignee: 'ana@acme.com',
        dueDate: new Date('2026-12-01T00:00:00.000Z'),
      });
      expect(repository.save).toHaveBeenCalledWith(created);
      expect(result).toBe(created);
    });

    it('guarda description a null cuando no se envía', async () => {
      repository.create.mockReturnValue(buildTask({ description: null }));
      repository.save.mockResolvedValue(buildTask({ description: null }));

      await service.create({
        title: 'Sin descripción',
        assignee: 'ana@acme.com',
        dueDate: '2026-12-01T00:00:00.000Z',
      });

      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({ description: null }),
      );
    });

    it('respeta el estado recibido', async () => {
      repository.create.mockReturnValue(buildTask());
      repository.save.mockResolvedValue(buildTask());

      await service.create({
        title: 'Preparar informe',
        assignee: 'ana@acme.com',
        status: TaskStatus.DONE,
        dueDate: '2026-12-01T00:00:00.000Z',
      });

      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({ status: TaskStatus.DONE }),
      );
    });
  });

  describe('findAll', () => {
    it('no filtra nada cuando no llegan filtros', async () => {
      repository.findAndCount.mockResolvedValue([[buildTask()], 1]);

      const result = await service.findAll(buildQuery());

      expect(repository.findAndCount).toHaveBeenCalledWith({
        where: {},
        order: { dueDate: 'ASC' },
        skip: 0,
        take: 10,
      });
      expect(result.meta).toEqual({
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      });
    });

    it('filtra por estado y responsable cuando llegan ambos', async () => {
      repository.findAndCount.mockResolvedValue([[], 0]);

      await service.findAll(
        buildQuery({
          status: TaskStatus.IN_PROGRESS,
          assignee: 'ana@acme.com',
        }),
      );

      expect(repository.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { status: TaskStatus.IN_PROGRESS, assignee: 'ana@acme.com' },
        }),
      );
    });

    it('traduce page y limit a skip y take', async () => {
      repository.findAndCount.mockResolvedValue([[], 12]);

      const result = await service.findAll(buildQuery({ page: 3, limit: 5 }));

      expect(repository.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 10, take: 5 }),
      );
      expect(result.meta).toEqual({
        total: 12,
        page: 3,
        limit: 5,
        totalPages: 3,
      });
    });
  });

  describe('findOne', () => {
    it('devuelve la tarea encontrada', async () => {
      const task = buildTask();
      repository.findOne.mockResolvedValue(task);

      await expect(service.findOne(TASK_ID)).resolves.toBe(task);
      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id: TASK_ID },
      });
    });

    it('lanza 404 si no existe', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.findOne(TASK_ID)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('aplica solo los campos recibidos', async () => {
      const task = buildTask();
      repository.findOne.mockResolvedValue(task);
      repository.save.mockImplementation((entity) =>
        Promise.resolve(entity as Task),
      );

      const result = await service.update(TASK_ID, {
        status: TaskStatus.DONE,
        dueDate: '2027-01-15T10:00:00.000Z',
      });

      expect(result.status).toBe(TaskStatus.DONE);
      expect(result.dueDate).toEqual(new Date('2027-01-15T10:00:00.000Z'));
      // Lo que no se envía se mantiene intacto.
      expect(result.title).toBe('Preparar informe');
      expect(result.assignee).toBe('ana@acme.com');
    });

    it('lanza 404 si la tarea no existe', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(
        service.update(TASK_ID, { title: 'Nuevo título' }),
      ).rejects.toThrow(NotFoundException);
      expect(repository.save).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('borra la tarea existente', async () => {
      const task = buildTask();
      repository.findOne.mockResolvedValue(task);

      await service.remove(TASK_ID);

      expect(repository.remove).toHaveBeenCalledWith(task);
    });

    it('lanza 404 si la tarea no existe', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.remove(TASK_ID)).rejects.toThrow(NotFoundException);
      expect(repository.remove).not.toHaveBeenCalled();
    });
  });
});
