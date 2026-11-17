import 'dotenv/config';
import { DataSource } from 'typeorm';
import { buildDataSourceOptions } from '../config/database.config';

/**
 * DataSource que consume el CLI de TypeORM (`pnpm migration:*`).
 * La aplicación no lo usa: allí las mismas opciones las carga TypeOrmModule.
 */
export default new DataSource(buildDataSourceOptions());
