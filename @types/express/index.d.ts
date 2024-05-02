import { Request } from 'express';
import { IUser } from '../../src/models/user.model';

declare global {
  namespace Express {
    interface Request {
      requestTime?: string;
      user: IUser;
    }
  }
}
