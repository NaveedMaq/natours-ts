import { Request } from 'express';
import { InferType, object, ref, string } from 'yup';

export const updatePasswordSchema = object({
  body: object({
    existingPassword: string().required('Existing password is required'),
    newPassword: string().required('New password is required'),
    newPasswordConfirm: string()
      .required('Confirmation Password is required')
      .oneOf([ref('newPassword')], "The passwords don't match"),
  }),
});

type UpdatePasswordRequestType = InferType<typeof updatePasswordSchema>;

export interface IUpdatePasswordRequest extends Request {
  body: UpdatePasswordRequestType['body'];
}
