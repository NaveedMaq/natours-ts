import { Request } from 'express';
import { InferType, object, string } from 'yup';

const passwordUpdateErrorMessage =
  'This route is not for password updates. Please use /update-my-password.';

export const updateMeSchema = object({
  body: object({
    password: string()
      .oneOf([undefined, ''], passwordUpdateErrorMessage)
      .notOneOf([null]),
    passwordConfirm: string().oneOf(
      [undefined, ''],
      passwordUpdateErrorMessage,
    ),

    name: string(),
    email: string().email(),
  }).noUnknown(true),
});

type UpdateMeRequestType = InferType<typeof updateMeSchema>;

export interface IUpdateMeRequest extends Request {
  body: UpdateMeRequestType['body'];
}
