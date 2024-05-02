import { NextFunction, Request, Response } from 'express';
import { catchAsync } from '../utils/catch-async';
import User from '../models/user.model';

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

  getUser(req: Request, res: Response) {
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
