import { Aggregate, Document, Query, Schema, model } from 'mongoose';

import slugify from 'slugify';
import { isAlpha } from 'validator';

export interface ITour extends Document {
  name: string;
  duration: number;
  maxGroupSize: number;
  difficulty: string;
  ratingsAverage?: number;
  ratingsQuantity?: number;
  price: number;
  priceDiscount?: number;
  summary: string;
  description?: string;
  imageCover: string;
  images: string[];
  createdAt?: Date;
  startDates?: Date[];
  durationWeeks: Number;
  slug: string;
  secretTour: boolean;
}

enum TOUR_DIFFICULTY {
  easy = 'easy',
  medium = 'medium',
  difficult = 'difficult',
  impossible = 'impossible',
}

const tourSchema: Schema<ITour> = new Schema<ITour>(
  {
    name: {
      type: String,
      required: [true, 'A tour must have a name'],
      unique: true,
      trim: true,
      maxLength: [40, 'A tour name must have less or equal to 40 characters'],
      minLength: [10, 'A tour name must have more or equal to 10 characters'],
      validate: {
        validator: function (this: ITour, val: string) {
          return isAlpha(val, 'en-US', { ignore: ' ' });
        },
        message: 'Tour name must only contain characters',
      },
    },

    duration: {
      type: Number,
      required: [true, 'A tour must have a duration'],
    },

    maxGroupSize: {
      type: Number,
      require: [true, 'A tour must have a group size'],
    },

    difficulty: {
      type: String,
      required: [true, 'A tour must have a difficulty'],
      enum: {
        values: Object.values(TOUR_DIFFICULTY),
        message: `Difficulty is one of: ${Object.values(TOUR_DIFFICULTY).join(
          ', ',
        )}`,
      },
    },

    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, 'Rating must be less or equal to 5'],
      max: [5, 'Rating must be less or equal to 5'],
    },

    ratingsQuantity: {
      type: Number,
      default: 0,
    },

    price: {
      type: Number,
      required: [true, 'A tour must have a price'],
    },

    priceDiscount: {
      type: Number,
      // default: 0,
      validate: {
        validator: function (this: ITour, val: number) {
          // it only points to the current doc in the new document creation
          return val < this.price;
        },
        message: 'Discount price {VALUE} should be below the regular price',
      },
    },

    summary: {
      type: String,
      trim: true,
      required: [true, 'A tour must have a summary'],
    },

    description: {
      type: String,
      trim: true,
    },

    slug: String,

    imageCover: {
      type: String,
      required: [true, 'A tour must have a cover image'],
    },

    images: [String],

    createdAt: {
      type: Date,
      default: Date.now(),
      select: false,
    },

    startDates: [Date],

    secretTour: {
      type: Boolean,
      default: false,
    },
  },
  { toJSON: { virtuals: true }, toObject: { virtuals: true } },
);

tourSchema.virtual('durationWeeks').get(function (this: ITour) {
  return this.duration / 7;
});

// DOCUMENT MIDDLEWARE: runs before the .save() and .create() but not .insertMany()
tourSchema.pre('save', function (this: ITour, next) {
  this.slug = slugify(this.name, { lower: true });
  next();
});

// tourSchema.pre('save', function (this: ITour, next) {
//   console.log('Will save document...');
//   next();
// });

// tourSchema.post('save', function (doc: ITour, next) {
//   console.log(doc);
//   next();
// });

// QUERY MIDDEWARE
let start = 0;
tourSchema.pre(/^find/, function (this: Query<ITour, ITour>, next) {
  this.find({ secretTour: { $ne: true } });
  start = Date.now();
  next();
});

tourSchema.post(/^find/, function (docs: ITour[], next) {
  console.log(`Query took ${Date.now() - start} milliseconds`);
  next();
});

// AGGREGATION MIDDLEWARE
tourSchema.pre('aggregate', function (this: Aggregate<ITour>, next) {
  this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });
  next();
});

const Tour = model<ITour>('Tour', tourSchema);

export default Tour;
