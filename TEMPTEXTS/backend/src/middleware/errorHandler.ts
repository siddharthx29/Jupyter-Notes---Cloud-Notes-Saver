import { Request, Response, NextFunction } from 'express';

export interface AppError extends Error {
  code?: string;
  statusCode?: number;
  details?: any;
}

export function errorHandler(
  err: AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const statusCode = err.statusCode || 500;
  const errorCode = err.code || (statusCode === 500 ? 'INTERNAL_SERVER_ERROR' : 'ERROR');
  const message = err.message || 'An unexpected error occurred';

  if (process.env.NODE_ENV !== 'production' && statusCode === 500) {
    console.error('[Error Details]:', err);
  }

  res.status(statusCode).json({
    error: errorCode,
    message: message,
    ...(err.details ? { details: err.details } : {}),
  });
}
