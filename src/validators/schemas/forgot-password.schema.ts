import { Request } from 'express';
import { InferType, object, string } from 'yup';

export const forgotPasswordSchema = object({
  body: object({
    email: string().required('Email is required to reset password').email(),
  }),
});

type ForgotPasswordRequestType = InferType<typeof forgotPasswordSchema>;

export interface IForgotPasswordRequest extends Request {
  body: ForgotPasswordRequestType['body'];
}
