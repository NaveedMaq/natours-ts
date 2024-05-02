import { Request } from 'express';
import { InferType, object, ref, string } from 'yup';

export const createUserSchema = object({
  body: object({
    name: string().required('A user must have a name').trim(),
    email: string()
      .required('A user must have an email')
      .email('A user must have a valid email'),
    password: string()
      .required('A user must have a password')
      .min(8, 'Password must be atleast 8 characters long'),
    passwordConfirm: string()
      .required('Confirmation password is required')
      .oneOf([ref('password')], "The passwords don't match"),
  }).noUnknown(true),
});

type CreateUserRequestType = InferType<typeof createUserSchema>;

export interface ICreateUserRequest extends Request {
  body: CreateUserRequestType['body'];
}
