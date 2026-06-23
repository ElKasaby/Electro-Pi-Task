import { Request, Response, NextFunction } from 'express';

export const errorHandler = (err: any, _req: Request, res: Response, _next: NextFunction): void => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  // Handle PostgreSQL Database Errors
  if (err.code === '23505') {
    // Unique violation
    err.statusCode = 409;
    err.status = 'fail';
    err.message = 'Duplicate field value entered';
  }

  // Handle TypeORM/Postgres UUID parsing errors
  if (err.message && err.message.includes('invalid input syntax for type uuid')) {
    err.statusCode = 400;
    err.status = 'fail';
    err.message = 'Invalid UUID format';
  }

  if (process.env.NODE_ENV === 'development') {
    res.status(err.statusCode).json({
      status: err.status,
      error: err,
      message: err.message,
      stack: err.stack,
    });
  } else {
    // Production Mode - Hide internal system error details
    if (err.isOperational) {
      res.status(err.statusCode).json({
        status: err.status,
        message: err.message,
      });
    } else {
      // Unhandled generic system errors (500)
      console.error('[Error] Unhandled Exception:', err);
      res.status(500).json({
        status: 'error',
        message: 'Something went wrong on the server',
      });
    }
  }
};

export default errorHandler;
