import { NextFunction, Request, Response } from 'express';
import { AnyObjectSchema } from 'yup';

import { catchAsync } from '../utils/catch-async';

export const validateRequest = (schema: AnyObjectSchema) =>
  catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const validatedRequest = await schema.validate(
      {
        body: req.body,
        query: req.query,
        params: req.params,
      },
      { abortEarly: false },
    );

    req.body = validatedRequest.body;
    req.query = validatedRequest.query;
    req.params = validatedRequest.params;

    next();
  });
