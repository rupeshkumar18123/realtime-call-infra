import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AppError } from '@core/errors';
import { logger } from '@logger/index';
import { config } from '@config/index';

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      error: { code: err.code, message: err.message },
    });
    return;
  }

  if (err instanceof ZodError) {
    res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'Invalid request data', details: err.flatten() },
    });
    return;
  }

  logger.error('Unhandled error', { error: err.message, stack: err.stack });

  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: config.server.isProd ? 'Internal server error' : err.message,
    },
  });
}
