import { Request, Response, NextFunction } from 'express';
import { ApiError, formatErrorDetails } from '../utils';
import { ERRORS } from '../constants';

/**
 * Global error handler middleware
 */
export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Log error details for debugging
  console.error('Error:', formatErrorDetails(err));

  // Handle specific error types
  if (err instanceof ApiError) {
    res.status(err.statusCode).json(err.toResponse());
    return;
  }

  if (err instanceof SyntaxError && 'body' in err) {
    res.status(400).json({
      error: 'Invalid JSON',
      details: 'The request body contains invalid JSON',
      code: 'INVALID_JSON'
    });
    return;
  }

  if ((err as any)?.code === 'EBADCSRFTOKEN') {
    res.status(403).json({
      error: 'CSRF Error',
      details: ERRORS.SECURITY.CSRF,
      code: 'INVALID_CSRF_TOKEN'
    });
    return;
  }

  // Default server error response
  res.status(500).json({
    error: 'Internal Server Error',
    details: process.env.NODE_ENV === 'development' 
      ? (err instanceof Error ? err.message : String(err))
      : ERRORS.SERVER.INTERNAL,
    code: 'INTERNAL_SERVER_ERROR'
  });
}

/**
 * Not found handler middleware
 */
export function notFoundHandler(
  req: Request,
  res: Response
): void {
  res.status(404).json({
    error: 'Not Found',
    details: `The requested resource '${req.path}' was not found`,
    code: 'RESOURCE_NOT_FOUND'
  });
}

/**
 * Async handler wrapper to catch promise rejections
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}