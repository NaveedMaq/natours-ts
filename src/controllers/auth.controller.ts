import { env } from '../env';
import { NextFunction, Request, Response } from 'express';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';

import { catchAsync } from '../utils/catch-async';
import User, { IUser, UserRoleEnum } from '../models/user.model';
import { ICreateUserRequest } from '../validators/schemas/create-user.schema';
import { ILoginUserRequest } from '../validators/schemas/login-user.schema';
import { AppError } from '../utils/app-error';
import { IForgotPasswordRequest } from '../validators/schemas/forgot-password.schema';
import { sendTextEmail } from '../utils/email.utils';
import { IResetPasswordRequest } from '../validators/schemas/reset-password.schema';
import { IUpdatePasswordRequest } from '../validators/schemas/update-password.schema';

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

const createSendToken = (user: IUser, statusCode: number, res: Response) => {
  const token = signToken(user._id);

  const cookieOptions = {
    expires: new Date(
      Date.now() + env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1_000,
    ),
    secure: env.NODE_ENV === 'production',
    httpOnly: true,
  };

  res.cookie('jwt', token, cookieOptions);

  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user: { ...user.toObject(), password: undefined },
    },
  });
};

class AuthController {
  signup = catchAsync(
    async (req: ICreateUserRequest, res: Response, next: NextFunction) => {
      const newUser = await User.create(req.body);
      createSendToken(newUser, 201, res);
    },
  );

  login = catchAsync(
    async (req: ILoginUserRequest, res: Response, next: NextFunction) => {
      const { email, password } = req.body;

      const user = await User.findOne({ email }).select('+password');

      if (!user || !(await user.correctPassword(password, user.password))) {
        return next(new AppError('Incorrect email or password', 401));
      }

      createSendToken(user, 200, res);
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

  forgotPassword = catchAsync(
    async (req: IForgotPasswordRequest, res: Response, next: NextFunction) => {
      // 1) Get user based on posted email
      const user = await User.findOne({ email: req.body.email });
      if (!user) {
        return next(
          new AppError('There is no user with that email address', 404),
        );
      }
      // 2) Generate the random token
      const resetToken = user.createPasswordResetToken();
      await user.save({ validateBeforeSave: false });

      // 3) Send it to user's email
      const resetURL = `${req.protocol}://${req.get(
        'host',
      )}/api/v1/users/reset-password/${resetToken}`;

      // sendEmail({email: 'naveed'})

      const message = `Forgot your password? Submit a PATCH request with your new password and passwordConfirm to: ${resetURL}\n If you didn't forget your password, please ignore this email!`;

      try {
        await sendTextEmail({
          email: user.email,
          subject: 'Your password reset token (valid for 10 min)',
          message,
        });

        res.status(200).json({
          status: 'success',
          message: 'Token sent to email!',
        });
      } catch (error) {
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        await user.save({ validateBeforeSave: false });

        return next(
          new AppError(
            'There was an error sending the email. Try again later!',
            500,
          ),
        );
      }
    },
  );

  resetPassword = catchAsync(
    async (req: IResetPasswordRequest, res: Response, next: NextFunction) => {
      // 1) Get user based on the token
      const hashedToken = crypto
        .createHash('sha256')
        .update(req.params.token)
        .digest('hex');

      const user = await User.findOne({
        passwordResetToken: hashedToken,
        passwordResetExpires: { $gt: Date.now() },
      });

      // 2) If token has not expired, and there is user, set the new password
      if (!user)
        return next(new AppError('Token is invalid or has expired', 400));

      user.password = req.body.password;
      user.passwordConfirm = req.body.passwordConfirm;
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      await user.save();

      // 3) Update changedPasswordAt property for the user
      // Done using 'pre' middleware
      // 4) Log the user in, send JWT
      createSendToken(user, 200, res);
    },
  );

  updatePassword = catchAsync(
    async (req: IUpdatePasswordRequest, res: Response, next: NextFunction) => {
      // 1) Get user from collection
      const user = await User.findById(req.user._id).select('+password');

      // 2) Check if the posted password is correct

      if (
        !user ||
        !(await user.correctPassword(req.body.existingPassword, user.password))
      ) {
        return next(
          new AppError('Existing password you entered is invalid', 401),
        );
      }

      // 3) If so, update the password
      user.password = req.body.newPassword;
      user.passwordConfirm = req.body.newPasswordConfirm;

      await user.save();

      // 4) Log user in, send JWT
      createSendToken(user, 200, res);
    },
  );
}

const authController = new AuthController();
export default authController;
