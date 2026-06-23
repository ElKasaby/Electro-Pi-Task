import { DataSource } from 'typeorm';
import path from 'path';
import { env } from './env';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: env.DB_HOST,
  port: env.DB_PORT,
  username: env.DB_USER,
  password: env.DB_PASSWORD,
  database: env.DB_NAME,
  synchronize: false, // Enforce migrations
  logging: env.NODE_ENV === 'development',
  entities: [path.join(__dirname, '../entities/*.{ts,js}')],
  migrations: [path.join(__dirname, '../database/migrations/*.{ts,js}')],
  subscribers: [],
});
