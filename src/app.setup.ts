import { INestApplication, ValidationPipe } from '@nestjs/common';

/**
 * Configuración HTTP común a la app y a los tests e2e, para que ambos
 * compartan prefijo y reglas de validación sin duplicarlas.
 */
export function configureApp(app: INestApplication): INestApplication {
  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({
      // Descarta propiedades no declaradas en el DTO...
      whitelist: true,
      // ...y responde 400 cuando llegan, en vez de ignorarlas en silencio.
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  return app;
}
