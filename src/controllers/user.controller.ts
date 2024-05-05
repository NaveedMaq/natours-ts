import { NextFunction, Request, Response } from 'express';

import { catchAsync } from '../utils/catch-async';
import User from '../models/user.model';
import { IUpdateMeRequest } from '../validators/schemas/update-me.schema';

const filterObj = <T>(obj: T, ...fields: string[]): Partial<T> => {
  const originalObj: any = obj as any;

  const filteredObject: any = {};
  Object.keys(originalObj).forEach((key) => {
    if (fields.includes(key)) {
      filteredObject[key] = originalObj[key];
    }
  });
  return filteredObject;
};

class UserController {
  getAllUsers = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const users = await User.find();

      res.status(200).json({
        status: 'success',
        results: users.length,
        data: {
          users,
        },
      });
    },
  );

  updateMe = catchAsync(
    async (req: IUpdateMeRequest, res: Response, next: NextFunction) => {
      const filteredBody = filterObj(req.body, 'name', 'email');

      const updatedUser = await User.findByIdAndUpdate(
        req.user._id,
        filteredBody,
        {
          new: true,
          runValidators: true,
        },
      );

      res.status(200).json({
        status: 'success',
        data: {
          user: updatedUser,
        },
      });
    },
  );

  deleteMe = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      await User.findByIdAndUpdate(req.user._id, { active: false });
      res.status(204).json({
        status: 'success',
        data: null,
      });
    },
  );

  async getUser(req: Request, res: Response) {
    res.status(500).json({
      status: 'error',
      message: 'This route is not yet defined!',
    });
  }

  createUser(req: Request, res: Response) {
    res.status(500).json({
      status: 'error',
      message: 'This route is not yet defined!',
    });
  }

  updateUser(req: Request, res: Response) {
    res.status(500).json({
      status: 'error',
      message: 'This route is not yet defined!',
    });
  }

  deleteUser(req: Request, res: Response) {
    res.status(500).json({
      status: 'error',
      message: 'This route is not yet defined!',
    });
  }
}
const userController = new UserController();

export default userController;
