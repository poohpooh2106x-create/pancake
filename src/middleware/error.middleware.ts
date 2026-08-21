import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) {
  logger.error(
    {
      error: err.message,
      stack: err.stack,
      url: req.originalUrl,
      method: req.method,
    },
    'Unhandled Application Error'
  );

  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal Server Error',
  });
}
