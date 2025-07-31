import { NextFunction, Request, Response } from "express";
import * as yup from "yup";
import { CustomError } from "../typings/base.typings";
import { logger } from "../utility/logger.utils";

export function GlobalErrorHandler(err: Error, req: Request, res: Response, next: NextFunction) {
  const logDetails = {
    method: req.method,
    url: req.originalUrl,
    headers: req.headers,
    cookies: req.cookies,
    ip: req.ip,
    timestamp: new Date().toISOString(),
    errorMessage: err.message,
    stack: err.stack,
  };

  if (err instanceof yup.ValidationError) {
    logger.warn("Validation error occurred", { ...logDetails, validationErrors: err.errors });
    res.status(400).json({ message: err.errors, status: 400, path: req.url });
    return;
  }

  if (err instanceof CustomError) {
    if (!err.logged) logger.warn("Custom error occurred", { ...logDetails, statusCode: err.statusCode });
    res.status(err.statusCode).json({ message: err.message, status: err.statusCode, path: req.url });
    return;
  }

  logger.error("Unhandled error occurred", logDetails);
  res.status(500).json({ message: err.message, status: 500, path: req.url });
}
