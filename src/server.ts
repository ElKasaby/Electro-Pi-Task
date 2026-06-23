import 'reflect-metadata';
import app from './app';
import { AppDataSource } from './config/database';
import { env } from './config/env';

const PORT = env.PORT || 3000;

// Initialize the database connection before starting the server
AppDataSource.initialize()
  .then(() => {
    console.log('[Database]: PostgreSQL connection initialized successfully.');

    const server = app.listen(PORT, () => {
      console.log(`[Server]: Running in ${env.NODE_ENV} mode on http://localhost:${PORT}`);
    });

    // Handle unhandled rejections
    process.on('unhandledRejection', (err: Error) => {
      console.error('[UnhandledRejectionError]:', err.message);
      server.close(() => {
        process.exit(1);
      });
    });
  })
  .catch((error) => {
    console.error('[Database]: Failed to initialize database connection:', error);
    process.exit(1);
  });
