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
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 120 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  // SQLite no tiene tipo enum nativo: se guarda como texto y la validación
  // de los valores admitidos la hace @IsEnum en los DTO.
  @Index('idx_tasks_status')
  @Column({ type: 'varchar', length: 20, default: TaskStatus.PENDING })
  status: TaskStatus;

  @Index('idx_tasks_assignee')
  @Column({ name: 'assignee', length: 120 })
  assignee: string;

  @Column({ name: 'due_date', type: 'datetime' })
  dueDate: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
