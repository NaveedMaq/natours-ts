import { Request } from 'express';
import { InferType, object, string } from 'yup';

export const loginUserSchema = object({
  body: object({
    email: string().required('Email required for login').email(),
    password: string().required('Password required for login').min(8),
  }),
});

type LoginUserRequestType = InferType<typeof loginUserSchema>;

export interface ILoginUserRequest extends Request {
  body: LoginUserRequestType['body'];
}
