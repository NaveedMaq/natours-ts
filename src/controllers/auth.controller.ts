import { env } from '../env';
import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';

import { catchAsync } from '../utils/catch-async';
import User, { IUser, UserRoleEnum } from '../models/user.model';
import { ICreateUserRequest } from '../validators/schemas/create-user.schema';
import { ILoginUserRequest } from '../validators/schemas/login-user.schema';
import { AppError } from '../utils/app-error';
import { string } from 'yup';

const signToken = (id: string) => {
  return jwt.sign({ id }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
  });
};

const verifyToken = (token: string, secret: string) => {
  return new Promise((resolve, reject) => {
    jwt.verify(token, secret, (err, data) => {
      if (err) {
        reject(err);
      } else {
        resolve(data);
      }
    });
  });
};

class AuthController {
  signup = catchAsync(
    async (req: ICreateUserRequest, res: Response, next: NextFunction) => {
      const newUser = await User.create(req.body);

      const token = signToken(newUser._id);

      res.status(201).json({
        status: 'success',
        token,
        data: {
          user: newUser,
        },
      });
    },
  );

  login = catchAsync(
    async (req: ILoginUserRequest, res: Response, next: NextFunction) => {
      const { email, password } = req.body;

      const user = await User.findOne({ email }).select('+password');

      if (!user || !(await user.correctPassword(password, user.password))) {
        return next(new AppError('Incorrect email or password', 401));
      }

      const token = signToken(user._id);

      res.status(200).json({
        success: 'success',
        token,
      });
    },
  );

  protect = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      // 1) Getting token and check if it exists

      let token: string | undefined = undefined;
      if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
      ) {
        token = req.headers.authorization.split(' ')[1];
      }

      if (!token)
        return next(
          new AppError(
            'You are not logged in! Please log in to get access',
            401,
          ),
        );
      // 2) Verfication tokendecoded

      const decoded = (await verifyToken(token, env.JWT_SECRET)) as any;

      // 3) Check if user still exists

      const currentUser = await User.findById(decoded.id);
      if (!currentUser)
        return next(
          new AppError('The user belonging to the token no longer exists', 401),
        );

      // 4) Check if user changed password after the token was issued
      if (currentUser.changedPasswordAfter(decoded.iat)) {
        return next(
          new AppError(
            'User recently changed password!. Please log in again.',
            401,
          ),
        );
      }
      // GRANT ACCESS TO PROTECTED ROUTE
      req.user = currentUser;
      next();
    },
  );

  restrictTo = (...roles: UserRoleEnum[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
      if (!roles.includes(req.user.role)) {
        return next(
          new AppError(
            'You do not have permission to perform this action',
            403,
          ),
        );
      }
      next();
    };
  };
}

const authController = new AuthController();
export default authController;
