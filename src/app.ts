import types from '../@types/express';

import express, { NextFunction, Request, Response } from 'express';
import morgan from 'morgan';

import { tourRouter } from './routes/tour.routes';
import { userRouter } from './routes/user.routes';

import { AppError } from './utils/app-error';
import { globalErrorHandler } from './controllers/error.controller';
import { env } from './env';

export const app = express();

// 1) MIDDLEWARES
console.log(env.NODE_ENV);
if (env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

app.use(express.json());
app.use(express.static(`${__dirname}/public`));

app.use((req: Request, res: Response, next: NextFunction) => {
  req.requestTime = new Date().toISOString();
  next();
});

// 2) ROUTES
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);

app.all('*', (req: Request, res: Response, next: NextFunction) => {
  next(new AppError(`Can't find ${req.path} on this server`, 404));
});

app.use(globalErrorHandler);
