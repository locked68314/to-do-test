import {
  IsEnum,
  IsISO8601,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { TaskStatus } from '../enums/task-status.enum';

export class CreateTaskDto {
  @IsString()
  @IsNotEmpty({ message: 'title no puede estar vacío' })
  @MaxLength(120)
  title: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @IsOptional()
  @IsEnum(TaskStatus, {
    message: `status debe ser uno de: ${Object.values(TaskStatus).join(', ')}`,
  })
  status?: TaskStatus;

  @IsString()
  @IsNotEmpty({ message: 'assignee no puede estar vacío' })
  @MaxLength(120)
  assignee: string;

  // Se acepta cualquier fecha válida: una tarea vencida debe poder editarse.
  @IsISO8601(
    { strict: true },
    { message: 'dueDate debe ser una fecha ISO 8601 válida' },
  )
  dueDate: string;
}
