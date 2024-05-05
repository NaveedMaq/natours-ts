import express from 'express';

import userController from '../controllers/user.controller';
import authController from '../controllers/auth.controller';
import { validateRequest } from '../validators/request-validator';
import { createUserSchema } from '../validators/schemas/create-user.schema';
import { loginUserSchema } from '../validators/schemas/login-user.schema';
import { forgotPasswordSchema } from '../validators/schemas/forgot-password.schema';
import { resetPasswordSchema } from '../validators/schemas/reset-password.schema';
import { updatePasswordSchema } from '../validators/schemas/update-password.schema';
import { updateMeSchema } from '../validators/schemas/update-me.schema';

export const router = express.Router();

router.post(
  '/signup',
  [validateRequest(createUserSchema)],
  authController.signup,
);

router.post('/login', [validateRequest(loginUserSchema)], authController.login);

router.post(
  '/forgot-password',
  [validateRequest(forgotPasswordSchema)],
  authController.forgotPassword,
);

router.patch(
  '/reset-password/:token',
  [validateRequest(resetPasswordSchema)],
  authController.resetPassword,
);

router.patch(
  '/update-my-password',
  [authController.protect, validateRequest(updatePasswordSchema)],
  authController.updatePassword,
);

router.patch(
  '/update-me',
  [authController.protect, validateRequest(updateMeSchema)],
  userController.updateMe,
);

router.delete('/update-me', [authController.protect], userController.deleteMe);

router
  .route('/')
  .get(userController.getAllUsers)
  .post(userController.createUser);

router
  .route('/:id')
  .get(userController.getUser)
  .patch(userController.updateUser)
  .delete(userController.deleteUser);

export const userRouter = router;
