import { join } from 'node:path';
import type { BetterSqlite3DataSourceOptions } from 'typeorm/driver/better-sqlite3/BetterSqlite3DataSourceOptions';

/** Fichero SQLite por defecto cuando no se define DB_PATH. */
export const DEFAULT_DB_PATH = './data/tasks.sqlite';

/**
 * Opciones de TypeORM compartidas por la aplicación (TypeOrmModule) y por el
 * CLI de migraciones (src/database/data-source.ts), de modo que ambos apunten
 * siempre a la misma base de datos y al mismo juego de migraciones.
 */
export function buildDataSourceOptions(
  env: NodeJS.ProcessEnv = process.env,
): BetterSqlite3DataSourceOptions {
  return {
    type: 'better-sqlite3',
    database: env.DB_PATH ?? DEFAULT_DB_PATH,
    entities: [join(__dirname, '..', '**', '*.entity{.ts,.js}')],
    migrations: [join(__dirname, '..', 'database', 'migrations', '*{.ts,.js}')],
    migrationsTableName: 'migrations',
    // El esquema se versiona con migraciones; nunca se sincroniza solo.
    synchronize: false,
    logging: env.DB_LOGGING === 'true' ? ['query', 'error'] : ['error'],
  };
}
