import { ApiProperty } from '@nestjs/swagger';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { TaskStatus } from '../enums/task-status.enum';

@Entity('tasks')
export class Task {
  @ApiProperty({ format: 'uuid' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ example: 'Preparar informe trimestral', maxLength: 120 })
  @Column({ length: 120 })
  title: string;

  @ApiProperty({ nullable: true, example: 'Incluir cierre de Q4' })
  @Column({ type: 'text', nullable: true })
  description: string | null;

  // SQLite no tiene tipo enum nativo: se guarda como texto y la validación
  // de los valores admitidos la hace @IsEnum en los DTO.
  @ApiProperty({ enum: TaskStatus, example: TaskStatus.PENDING })
  @Index('idx_tasks_status')
  @Column({ type: 'varchar', length: 20, default: TaskStatus.PENDING })
  status: TaskStatus;

  @ApiProperty({
    description: 'Responsable de la tarea',
    example: 'ana@acme.com',
  })
  @Index('idx_tasks_assignee')
  @Column({ name: 'assignee', length: 120 })
  assignee: string;

  @ApiProperty({
    description: 'Fecha límite',
    example: '2026-12-01T00:00:00.000Z',
  })
  @Column({ name: 'due_date', type: 'datetime' })
  dueDate: Date;

  @ApiProperty()
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ApiProperty()
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
