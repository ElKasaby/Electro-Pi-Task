import 'reflect-metadata';
import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import swaggerUi from 'swagger-ui-express';
import yaml from 'js-yaml';
import fs from 'fs';
import path from 'path';

import './config/env';
import logger from './middlewares/logger';
import authRoutes from './routes/auth.routes';
import projectRoutes from './routes/project.routes';
import taskRoutes from './routes/task.routes';
import errorHandler from './middlewares/errorHandler';

const app = express();

// Custom request logger
app.use(logger);

// Security middlewares
app.use(helmet({
  contentSecurityPolicy: false, // Disabled to allow Swagger UI scripts to run without issues
}));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Load and mount Swagger Documentation
try {
  const swaggerPath = path.join(__dirname, '../API DOC/openapi.yaml');
  if (fs.existsSync(swaggerPath)) {
    const swaggerDocument = yaml.load(fs.readFileSync(swaggerPath, 'utf8')) as any;
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
    console.log('[Docs]: Interactive API docs mounted on http://localhost:3000/api-docs');
  } else {
    console.warn('[Docs]: Warning - openapi.yaml not found at ' + swaggerPath);
  }
} catch (error: any) {
  console.error('[Docs]: Failed to load OpenAPI documentation:', error.message);
}

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 'fail',
    message: 'Too many requests from this IP, please try again after 15 minutes'
  }
});
app.use('/api', limiter);

// API Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/projects', projectRoutes);
app.use('/api/v1/tasks', taskRoutes);

// Health check route
app.get('/', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'success',
    message: 'Welcome to the Project & Task Management API!',
    timestamp: new Date().toISOString()
  });
});

// 404 Route handler for unrecognized paths
app.use((req: Request, res: Response) => {
  res.status(404).json({
    status: 'fail',
    message: `Route ${req.method} ${req.originalUrl} not found`
  });
});

// Global Error Handler Middleware
app.use(errorHandler);

export default app;
