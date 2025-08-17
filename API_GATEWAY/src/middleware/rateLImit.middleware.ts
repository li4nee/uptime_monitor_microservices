import rateLimit, { RateLimitRequestHandler } from "express-rate-limit";
import { Request, Response } from "express";
import { logger } from "../utility/logger.utils";

export const createGlobalRateLimiter = (windowMs: number, maxRequest: number): RateLimitRequestHandler => {
  const limiter = rateLimit({
    windowMs: windowMs || 2 * 60 * 1000,
    max: maxRequest || 20,
    standardHeaders: true, // try again after this time header
    legacyHeaders: false, // disable the X-RateLimit-* headers
    handler: (req: Request, res: Response) => {
      logger.warn("Rate limit exceeded", {
        ip: req.ip,
        method: req.method,
        url: req.originalUrl,
        timestamp: new Date().toISOString(),
      });
      res.status(429).json({
        message: "Too many requests, please try again later.",
        statusCode: 429,
      });
    },
  });
  return limiter;
};
