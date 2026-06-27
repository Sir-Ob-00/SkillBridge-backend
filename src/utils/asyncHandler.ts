import { NextFunction, Request, Response } from 'express';

type AsyncRouteHandler = (
  req: Request<any, any, any, any>,
  res: Response,
  next: NextFunction
) => Promise<unknown>;

/**
 * Wraps an async Express handler so rejected promises are forwarded to
 * the error-handling middleware instead of crashing the process.
 */
export const asyncHandler = (handler: AsyncRouteHandler) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    handler(req, res, next).catch(next);
  };
};
