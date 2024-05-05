import { Request } from 'express';
import { InferType, object, ref, string } from 'yup';

export const resetPasswordSchema = object({
  body: object({
    password: string().required('Password is required'),
    passwordConfirm: string()
      .required('Confirmation password is required')
      .oneOf([ref('password')], "The passwords don't match"),
  }),
  params: object({
    token: string().required('Token is required to reset password'),
  }),
});

type ResetPasswordRequestType = InferType<typeof resetPasswordSchema>;

export interface IResetPasswordRequest extends Request {
  body: ResetPasswordRequestType['body'];
}
