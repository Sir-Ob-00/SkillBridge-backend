import { NextFunction, Request, Response } from 'express';

type AsyncRouteHandler = (
  req: any,
  res: Response,
  next: NextFunction
) => Promise<unknown>;

export const asyncHandler = (handler: AsyncRouteHandler) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    handler(req, res, next).catch(next);
  };
};
