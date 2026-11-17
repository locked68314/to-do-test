import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Repository } from 'typeorm';
import {
  buildPaginatedResult,
  PaginatedResult,
} from '../common/dto/paginated-result';
import { CreateTaskDto } from './dto/create-task.dto';
import { QueryTasksDto } from './dto/query-tasks.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { Task } from './entities/task.entity';
import { TaskStatus } from './enums/task-status.enum';

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task)
    private readonly tasksRepository: Repository<Task>,
  ) {}

  async create(dto: CreateTaskDto): Promise<Task> {
    const task = this.tasksRepository.create({
      title: dto.title,
      description: dto.description ?? null,
      status: dto.status ?? TaskStatus.PENDING,
      assignee: dto.assignee,
      dueDate: new Date(dto.dueDate),
    });

    return this.tasksRepository.save(task);
  }

  async findAll(query: QueryTasksDto): Promise<PaginatedResult<Task>> {
    const { page, limit, status, assignee } = query;

    // Solo se filtra por lo que llega: un filtro ausente no restringe nada.
    const where: FindOptionsWhere<Task> = {};

    if (status !== undefined) {
      where.status = status;
    }

    if (assignee !== undefined) {
      where.assignee = assignee;
    }

    const [data, total] = await this.tasksRepository.findAndCount({
      where,
      order: { dueDate: 'ASC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return buildPaginatedResult(data, total, page, limit);
  }

  /** Devuelve la tarea o lanza 404; punto único de ese error. */
  async findOne(id: string): Promise<Task> {
    const task = await this.tasksRepository.findOne({ where: { id } });

    if (!task) {
      throw new NotFoundException(`No existe una tarea con id ${id}`);
    }

    return task;
  }

  async update(id: string, dto: UpdateTaskDto): Promise<Task> {
    const task = await this.findOne(id);
    const { dueDate, description, ...rest } = dto;

    Object.assign(task, rest);

    if (description !== undefined) {
      task.description = description;
    }

    if (dueDate !== undefined) {
      task.dueDate = new Date(dueDate);
    }

    return this.tasksRepository.save(task);
  }

  async remove(id: string): Promise<void> {
    const task = await this.findOne(id);
    await this.tasksRepository.remove(task);
  }
}
