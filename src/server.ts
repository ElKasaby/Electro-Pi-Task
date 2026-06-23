import 'reflect-metadata';
import app from './app';

const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
  console.log(`[Server]: running in ${process.env.NODE_ENV || 'development'} mode on http://localhost:${PORT}`);
});

// Handle unhandled rejections
process.on('unhandledRejection', (err: Error) => {
  console.error('[UnhandledRejectionError]:', err.message);
  server.close(() => {
    process.exit(1);
  });
});
