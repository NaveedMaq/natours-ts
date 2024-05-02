import express from 'express';

import tourController from '../controllers/tour.controller';
import authController from '../controllers/auth.controller';
import { validateRequest } from '../validators/request-validator';

const router = express.Router();

// router.param('id', tourController.checkID);

router
  .route('/top-5-cheap')
  .get(tourController.aliasTopTours, tourController.getAllTours);

router.route('/tour-stats').get(tourController.getTourStats);
router.route('/monthly-plan/:year').get(tourController.getMonthyPlan);

router
  .route('/')
  .get([authController.protect], tourController.getAllTours)
  .post(tourController.createTour);

router
  .route('/:id')
  .get(tourController.getTour)
  .patch(tourController.updateTour)
  .delete(tourController.deleteTour);

export const tourRouter = router;
