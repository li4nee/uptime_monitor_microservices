import { NextFunction, Response, Request } from "express";
import { AuthenticatedRequest, ROLE } from "../typings/base.type";
import { logger } from "../utils/logger.utils";

export function attachProxiedUser(req: Request, res: Response, next: NextFunction) {
  try {
    const authReq = req as AuthenticatedRequest;
    const userId = req.headers["x-user-id-from-proxy"] as string;
    const userRole = req.headers["x-user-role-from-proxy"] as ROLE;
    if (userId) authReq.userId = userId;
    if (userRole) authReq.role = userRole;

    logger.info("Attached proxied user to request", {
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
      userId,
      userRole,
      headers: req.headers,
      cookies: req.cookies,
      timestamp: new Date().toISOString(),
    });

    next();
  } catch (error) {
    logger.error("Error in attachProxiedUser middleware", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      method: req.method,
      url: req.originalUrl,
      headers: req.headers,
      cookies: req.cookies,
      ip: req.ip,
      timestamp: new Date().toISOString(),
    });
    res.status(500).send("Internal Server Error");
    return;
  }
}
