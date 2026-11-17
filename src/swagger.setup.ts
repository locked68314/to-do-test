import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

/** Publica la documentación OpenAPI en /api/docs. */
export function setupSwagger(app: INestApplication): void {
  const config = new DocumentBuilder()
    .setTitle('API de tareas')
    .setDescription(
      'Gestión de tareas: alta, consulta, edición y borrado, con filtros por estado y responsable.',
    )
    .setVersion('1.0')
    .addTag('tasks')
    .build();

  SwaggerModule.setup(
    'api/docs',
    app,
    SwaggerModule.createDocument(app, config),
  );
}
