import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
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
  @ApiProperty({ example: 'Preparar informe trimestral', maxLength: 120 })
  @IsString()
  @IsNotEmpty({ message: 'title no puede estar vacío' })
  @MaxLength(120)
  title: string;

  @ApiPropertyOptional({ example: 'Incluir cierre de Q4', maxLength: 1000 })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiPropertyOptional({
    enum: TaskStatus,
    default: TaskStatus.PENDING,
    description: 'pendiente / en curso / hecha',
  })
  @IsOptional()
  @IsEnum(TaskStatus, {
    message: `status debe ser uno de: ${Object.values(TaskStatus).join(', ')}`,
  })
  status?: TaskStatus;

  @ApiProperty({ example: 'ana@acme.com', maxLength: 120 })
  @IsString()
  @IsNotEmpty({ message: 'assignee no puede estar vacío' })
  @MaxLength(120)
  assignee: string;

  @ApiProperty({
    example: '2026-12-01T00:00:00.000Z',
    description: 'Fecha límite en formato ISO 8601',
  })
  // Se acepta cualquier fecha válida: una tarea vencida debe poder editarse.
  @IsISO8601(
    { strict: true },
    { message: 'dueDate debe ser una fecha ISO 8601 válida' },
  )
  dueDate: string;
}
