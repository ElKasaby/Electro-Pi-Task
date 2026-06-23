import { DataSource } from 'typeorm';
import dotenv from 'dotenv';
import path from 'path';

// Ensure env variables are loaded
dotenv.config();

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '231100',
  database: process.env.DB_NAME || 'taskmanager',
  synchronize: false, // Enforce migrations
  logging: process.env.NODE_ENV === 'development',
  entities: [path.join(__dirname, '../entities/*.{ts,js}')],
  migrations: [path.join(__dirname, '../database/migrations/*.{ts,js}')],
  subscribers: [],
});
