import { RequestHandler } from 'express';
import { responseFn } from '../common/response';

export const healthCheckController: RequestHandler = (req, res) => {
  return responseFn(res, 200, 'OK');
};
