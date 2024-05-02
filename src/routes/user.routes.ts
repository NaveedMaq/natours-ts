import express from 'express';

import userController from '../controllers/user.controller';
import authController from '../controllers/auth.controller';
import { validateRequest } from '../validators/request-validator';
import { createUserSchema } from '../validators/schemas/create-user.schema';
import { loginUserSchema } from '../validators/schemas/login-user.schema';

export const router = express.Router();

router.post(
  '/signup',
  [validateRequest(createUserSchema)],
  authController.signup,
);

router.post('/login', [validateRequest(loginUserSchema)], authController.login);

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
