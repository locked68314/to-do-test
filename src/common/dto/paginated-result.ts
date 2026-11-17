import { ApiProperty } from '@nestjs/swagger';

/** Metadatos de paginación que acompañan a todo listado. */
export class PaginationMetaDto {
  @ApiProperty({ description: 'Total de elementos que cumplen el filtro' })
  total: number;

  @ApiProperty({ description: 'Página devuelta', example: 1 })
  page: number;

  @ApiProperty({ description: 'Tamaño de página aplicado', example: 10 })
  limit: number;

  @ApiProperty({ description: 'Número total de páginas' })
  totalPages: number;
}

export interface PaginatedResult<T> {
  data: T[];
  meta: PaginationMetaDto;
}

export function buildPaginatedResult<T>(
  data: T[],
  total: number,
  page: number,
  limit: number,
): PaginatedResult<T> {
  return {
    data,
    meta: {
      total,
      page,
      limit,
      totalPages: limit > 0 ? Math.ceil(total / limit) : 0,
    },
  };
}
