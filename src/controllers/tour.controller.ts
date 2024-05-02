import { NextFunction, Request, Response } from 'express';

import Tour from '../models/tour.model';
import { ApiFeatures } from '../utils/api-features';
import { z } from 'zod';
import { catchAsync } from '../utils/catch-async';
import { AppError } from '../utils/app-error';

class TourController {
  aliasTopTours(req: Request, res: Response, next: NextFunction) {
    req.query.limit = '5';
    req.query.sort = '-ratingsAverage,price';
    req.query.fields = 'name,price,ratingsAverage,difficulty';
    next();
  }

  getAllTours = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      // EXECUTE QUERY
      const features = new ApiFeatures(Tour.find(), req.query)
        .filter()
        .sort()
        .limitFields()
        .paginate();

      const tours = await features.resolveQuery();

      // SEND RESPONSE
      res.status(200).json({
        status: 'success',
        results: tours.length,
        data: {
          tours,
        },
      });
    },
  );

  getTour = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const tour = await Tour.findById(req.params.id);

      if (!tour) {
        return next(new AppError('No tour found with that ID', 404));
      }

      res.status(200).json({
        status: 'success',
        data: { tour },
      });
    },
  );

  createTour = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const newTour = await Tour.create(req.body);

      res.status(201).json({
        status: 'success',
        data: {
          tour: newTour,
        },
      });
    },
  );

  updateTour = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const tour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true,
      });

      if (!tour) {
        return next(new AppError('No tour found with that ID', 404));
      }

      res.status(200).json({
        status: 'success',
        data: {
          tour,
        },
      });
    },
  );

  deleteTour = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const tour = await Tour.findByIdAndDelete(req.params.id);

      if (!tour) {
        return next(new AppError('No tour found with that ID', 404));
      }

      res.status(204).json({
        status: 'success',
        data: null,
      });
    },
  );

  getTourStats = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const stats = await Tour.aggregate([
        // {
        //   $match: { ratingsAverage: { $gte: 4.5 } },
        // },
        {
          $group: {
            _id: {
              $toUpper: '$difficulty',
            },
            numTours: { $sum: 1 },
            numRatings: { $sum: '$ratingsQuantity' },
            avgRating: { $avg: '$ratingsAverage' },
            avgPrice: { $avg: '$price' },
            minPrice: { $min: '$price' },
            maxPrice: { $max: '$price' },
          },
        },
        {
          $sort: { avgPrice: 1 },
        },

        // {
        //   $match: { _id: { $ne: 'EASY' } },
        // },
      ]);

      res.status(200).json({
        status: 'success',
        data: {
          stats,
        },
      });
    },
  );

  getMonthyPlan = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
      const year = z.coerce.number().parse(req.params.year);

      const plan = await Tour.aggregate([
        { $unwind: '$startDates' },
        {
          $match: {
            startDates: {
              $gte: new Date(`${year}-01-01`),
              $lte: new Date(`${year}-12-31`),
            },
          },
        },
        {
          $group: {
            _id: { $month: '$startDates' },
            numTourStarts: { $sum: 1 },
            tours: { $push: '$name' },
          },
        },
        {
          $addFields: { month: '$_id' },
        },
        {
          $project: { _id: 0 },
        },
        {
          $sort: { numTourStarts: -1 },
        },
        { $limit: 12 },
      ]);

      res.status(200).json({
        status: 'success',
        data: {
          plan,
        },
      });
    },
  );
}

const tourController = new TourController();
export default tourController;
