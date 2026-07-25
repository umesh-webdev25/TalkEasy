import { AppError } from '../errors/index.js';

export const validateRequest = (schema) => {
  return (req, res, next) => {
    try {
      if (schema.body) {
        req.body = schema.body.parse(req.body);
      }
      if (schema.query) {
        req.query = schema.query.parse(req.query);
      }
      if (schema.params) {
        req.params = schema.params.parse(req.params);
      }
      next();
    } catch (error) {
      if (error.errors) {
        const errorMessages = error.errors.map(err => err.message).join(', ');
        return next(new AppError(`Validation failed: ${errorMessages}`, 400));
      }
      return next(new AppError('Validation failed', 400));
    }
  };
};
