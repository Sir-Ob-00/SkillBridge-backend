import { Response } from 'express';

export interface PaginationMeta {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

export const sendSuccess = <T>(
  res: Response,
  data: T,
  message?: string,
  statusCode = 200
): Response => {
  return res.status(statusCode).json({
    success: true,
    data,
    ...(message ? { message } : {}),
  });
};

export const sendPaginated = <T>(
  res: Response,
  items: T[],
  meta: PaginationMeta,
  statusCode = 200
): Response => {
  return res.status(statusCode).json({
    success: true,
    data: {
      items,
      page: meta.page,
      totalPages: meta.totalPages,
      totalItems: meta.totalItems,
    },
  });
};

export const buildPaginationMeta = (
  page: number,
  pageSize: number,
  totalItems: number
): PaginationMeta => ({
  page,
  pageSize,
  totalItems,
  totalPages: Math.max(1, Math.ceil(totalItems / pageSize)),
});
