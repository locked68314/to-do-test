import { ApiProperty } from '@nestjs/swagger';
import {
  PaginatedResult,
  PaginationMetaDto,
} from '../../common/dto/paginated-result';
import { Task } from '../entities/task.entity';

/** Respuesta de GET /tasks, declarada como clase para que Swagger la describa. */
export class PaginatedTasksDto implements PaginatedResult<Task> {
  @ApiProperty({ type: [Task] })
  data: Task[];

  @ApiProperty({ type: PaginationMetaDto })
  meta: PaginationMetaDto;
}
