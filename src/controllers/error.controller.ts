import { NextFunction, Request, Response } from 'express';
import { ValidationError as YupValidationError } from 'yup';
import mongoose from 'mongoose';
const { ValidationError: MongooseValidationError, CastError } = mongoose.Error;

import { AppError } from '../utils/app-error';
import { cloneError } from '../utils/obj.utils';
import { JsonWebTokenError } from 'jsonwebtoken';

type ProductionErrorType = {
  statusCode: number;
  status: string;
  message: string;
};

function handleCastErrorDb(err: any) {
  const message = `Invalid ${err.path}: ${err.value}`;
  return new AppError(message, 400);
}

function handleDuplicateFieldsDb(err: any) {
  const { keyValue } = err;
  const keys = Object.keys(keyValue);

  const duplicateFields = keys.map((key) => {
    const value = keyValue[key];
    return `${key}: ${value}`;
  });

  const message = `Duplicate field value(s): ${duplicateFields.join(
    ', ',
  )}. Please use another value!`;
  return new AppError(message, 400);
}

function handleValidationErrorDb(err: any) {
  const errors = Object.values(err.errors).map((el) => (el as any).message);
  const message = `Invalid input data. ${errors.join('. ')}`;
  return new AppError(message, 400);
}

function handleValidationErrorRequest(err: YupValidationError) {
  const message = `Invalid input data. ${err.errors.join('. ')}`;

  return new AppError(message, 400);
}

function handleJWTError(_: JsonWebTokenError) {
  return new AppError('Invalid token. Please log in again!', 401);
}

export function globalErrorHandler(
  error: any,
  req: Request,
  res: Response,
  next: NextFunction,
) {
  error.statusCode = error.statusCode || 500;
  error.status = error.status || 'error';

  console.log({ error });

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(error, res);
  } else if (process.env.NODE_ENV === 'production') {
    sendErrorProd(error, res);
  }
}

function sendErrorDev(error: any, res: Response) {
  const productionError: ProductionErrorType = createProductionError(error);

  const debug = {
    statusCode: error.statusCode,
    status: error.status,
    message: error.message,
    error: error,
    stack: error.stack,
  };

  res.status(productionError.statusCode).json({
    status: productionError.status,
    message: productionError.message,
    debug,
  });
}

function sendErrorProd(error: any, res: Response) {
  const productionError: ProductionErrorType = createProductionError(error);

  res.status(productionError.statusCode).json({
    status: productionError.status,
    message: productionError.message,
  });
}

function createProductionError(error: any): ProductionErrorType {
  let err = cloneError(error);

  if (error instanceof CastError) err = handleCastErrorDb(err);

  if (err.code === 11000) err = handleDuplicateFieldsDb(err);
  if (error instanceof MongooseValidationError)
    err = handleValidationErrorDb(err);
  if (error instanceof YupValidationError)
    err = handleValidationErrorRequest(err);
  if (error instanceof JsonWebTokenError) err = handleJWTError(err);

  if (err.isOperational) {
    return {
      statusCode: err.statusCode,
      status: err.status,
      message: err.message,
    };
  } else {
    // Log Error
    console.error('ERROR 💥', error);

    return {
      statusCode: 500,
      status: 'error',
      message: 'Something went very wrong!',
    };
  }
}
