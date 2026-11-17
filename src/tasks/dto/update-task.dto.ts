import { PartialType } from '@nestjs/swagger';
import { CreateTaskDto } from './create-task.dto';

/** Todos los campos son opcionales: el PATCH actualiza solo lo que llega. */
export class UpdateTaskDto extends PartialType(CreateTaskDto) {}
