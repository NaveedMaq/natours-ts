import types from '../@types/express';
import { env } from './env';

import express, { NextFunction, Request, Response } from 'express';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import mongoSanitize from 'express-mongo-sanitize';
import helmet from 'helmet';
import hpp from 'hpp';

import { xssSanitize } from './utils/xss.utils';
import { tourRouter } from './routes/tour.routes';
import { userRouter } from './routes/user.routes';
import { AppError } from './utils/app-error';
import { globalErrorHandler } from './controllers/error.controller';

export const app = express();

// 1) MIDDLEWARES
// Set security HTTP headers
app.use(helmet());

// Development logging
if (env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}
// Limit requests from same api
const limiter = rateLimit({
  max: 100,
  windowMs: 1 * 60 * 60 * 1000, // 1 hour,
  message: {
    status: 'fail',
    message: 'Too many requests from this IP, please try again in an hour!',
  },
});

app.use('/api', limiter);

// Body parser, reading data from body into req.body
app.use(express.json({ limit: '10kb' }));

// Data sanitization against NoSQL query injection
app.use(mongoSanitize());

// Data sanitzation against against XSS
app.use(xssSanitize());

// Prevent parameter pollution
app.use(
  hpp({
    whitelist: [
      'duration',
      'ratingsAverage',
      'ratingsQuantity',
      'maxGroupSize',
      'difficulty',
      'price',
    ],
  }),
);

// Serving static files
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
