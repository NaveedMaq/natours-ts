import crypto from 'crypto';
import bcrypt from 'bcrypt';

import { Document, Model, Query, Schema, model } from 'mongoose';
import { isEmail } from 'validator';

export interface IUserLean {
  name: string;
  email: string;
  photo: string;
  password: string;
  passwordConfirm?: string;
  passwordChangedAt: Date;
  role: UserRoleEnum;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  active?: boolean;
}

interface IUserMethods {
  correctPassword(
    candidatePassword: string,
    userPassword: string,
  ): Promise<boolean>;

  changedPasswordAfter(JWTTimestamp: number): boolean;

  createPasswordResetToken(): void;
}

export interface IUser extends Document, IUserLean, IUserMethods {}

type UserModelType = Model<IUser, {}, IUserMethods>;

export enum UserRoleEnum {
  USER = 'user',
  GUIDE = 'guide',
  LEAD_GUIDE = 'lead-guide',
  ADMIN = 'admin',
}

const userSchema = new Schema<IUser, UserModelType, IUserMethods>({
  name: {
    type: String,
    required: [true, 'Please tell us your name!'],
  },

  email: {
    type: String,
    required: [true, 'Please provide your email'],
    unique: true,
    lowercase: true,
    validate: [isEmail, 'Please provide a valid email'],
  },

  photo: String,

  role: {
    type: String,
    enum: Object.values(UserRoleEnum),
    default: UserRoleEnum.USER,
  },

  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minLength: 8,
    select: false,
  },

  passwordConfirm: {
    type: String,
    required: [true, 'Please confirm your password'],
    validate: {
      // This only works on SAVE!!!
      validator: function (this: IUser, val: string) {
        return this.password === val;
      },
      message: 'Passwords are not the same',
    },
  },

  passwordChangedAt: Date,

  passwordResetToken: String,

  passwordResetExpires: Date,

  active: {
    type: Boolean,
    default: true,
    select: false,
  },
});

userSchema.methods.correctPassword = async function (
  candidatePassword: string,
  userPassword: string,
): Promise<boolean> {
  return await bcrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.changedPasswordAfter = function (
  this: IUser,
  JWTTimestamp: number,
): boolean {
  if (this.passwordChangedAt) {
    const changedTimestamp = this.passwordChangedAt.getTime() / 1_000;
    return JWTTimestamp < changedTimestamp;
  }

  // False means NOT changed
  return false;
};

userSchema.methods.createPasswordResetToken = function (this: IUser) {
  const resetToken = crypto.randomBytes(32).toString('hex');

  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  this.passwordResetExpires = new Date(Date.now() + 10 * 60 * 1000);

  return resetToken;
};

userSchema.pre('save', async function (this: IUser, next) {
  if (!this.isModified('password')) return next();

  this.password = await bcrypt.hash(this.password, 12);
  this.passwordConfirm = undefined;
  next();
});

userSchema.pre('save', function (this: IUser, next) {
  if (!this.isModified('password') || this.isNew) return next();
  this.passwordChangedAt = new Date(Date.now() - 1_000);
  next();
});

userSchema.pre(/^find/, function (this: Query<IUser, IUser>) {
  this.find({ active: { $ne: false } });
});

const User = model<IUser, UserModelType>('User', userSchema);

export default User;
