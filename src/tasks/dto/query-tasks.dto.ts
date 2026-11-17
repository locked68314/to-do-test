import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { TaskStatus } from '../enums/task-status.enum';

/** Filtros admitidos por GET /tasks, sobre los parámetros de paginación. */
export class QueryTasksDto extends PaginationQueryDto {
  @IsOptional()
  @IsEnum(TaskStatus, {
    message: `status debe ser uno de: ${Object.values(TaskStatus).join(', ')}`,
  })
  status?: TaskStatus;

  @IsOptional()
  @IsString()
  @IsNotEmpty({ message: 'assignee no puede estar vacío' })
  assignee?: string;
}
