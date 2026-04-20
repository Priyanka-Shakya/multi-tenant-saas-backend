import { Response } from 'express';

export const successResponse = (res: Response, data: any, statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    data,
  });
};

export const errorResponse = (
  res: Response,
  code: string,
  message: string,
  statusCode = 500,
  details: any = null
) => {
  return res.status(statusCode).json({
    error: {
      code,
      message,
      details,
    },
  });
};