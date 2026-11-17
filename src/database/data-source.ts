import { DataSource } from 'typeorm';
import { buildDataSourceOptions } from '../config/database.config';

/**
 * DataSource que consume el CLI de TypeORM (`pnpm migration:*`).
 * El .env lo carga Node con --env-file-if-exists desde el script de npm.
 * La aplicación no usa este fichero: allí las opciones las carga TypeOrmModule.
 */
export default new DataSource(buildDataSourceOptions());
