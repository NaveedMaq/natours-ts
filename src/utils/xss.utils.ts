import { NextFunction, Request, Response } from 'express';
import xss from 'xss';

function xssClean(obj: any) {
  const str = JSON.stringify(obj);
  const cleanStr = xss(str);

  return JSON.parse(cleanStr);
}

export const xssSanitize = function () {
  return (req: Request, res: Response, next: NextFunction) => {
    if (req.body) req.body = xssClean(req.body);
    if (req.query) req.query = xssClean(req.query);
    if (req.params) req.params = xssClean(req.params);

    next();
  };
};
