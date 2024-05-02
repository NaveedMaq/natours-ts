import { Query } from 'mongoose';

export class ApiFeatures<ResultType, DocType> {
  private query: Query<ResultType, DocType>;
  private queryString: any;

  constructor(query: Query<ResultType, DocType>, queryString: any) {
    this.query = query;
    this.queryString = queryString;
  }

  filter(): ApiFeatures<ResultType, DocType> {
    const queryObj = { ...this.queryString };
    const excludedFields = ['page', 'sort', 'limit', 'fields'];
    excludedFields.forEach((el) => delete queryObj[el]);

    // Advanced Filtering

    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(/\b(gte|gt|{te|lt)\b/g, (match) => `$${match}`);

    this.query.find(JSON.parse(queryStr));

    return this;
  }

  sort(): ApiFeatures<ResultType, DocType> {
    if (this.queryString.sort) {
      const sortBy = (this.queryString.sort as string).split(',').join(' ');
      this.query.sort(sortBy);
    } else {
      this.query.sort('-createdAt');
    }
    return this;
  }

  limitFields(): ApiFeatures<ResultType, DocType> {
    if (this.queryString.fields) {
      const fields = (this.queryString.fields as string).split(',').join(' ');
      this.query.select(fields);
    }
    this.query.select('-__v');
    return this;
  }

  paginate(): ApiFeatures<ResultType, DocType> {
    const page = this.queryString.page ? +this.queryString.page : 1;
    const limit = this.queryString.limit ? +this.queryString.limit : 100;
    const skip = (page - 1) * limit;

    this.query.skip(skip).limit(limit);

    return this;
  }

  resolveQuery(): Query<ResultType, DocType> {
    return this.query;
  }
}
