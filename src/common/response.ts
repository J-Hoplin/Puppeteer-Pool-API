import { Response } from 'express';

export const responseFn = (
  res: Response,
  statusCode: number,
  data: unknown,
): Response => {
  const isSuccess = statusCode >= 200 && statusCode < 300;
  return res.status(statusCode).json({
    success: isSuccess,
    data: data,
  });
};
