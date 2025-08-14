import { Request, Response, NextFunction } from "express";
import * as jwt from "jsonwebtoken";
import { GlobalSettings } from "../globalSettings";
import { AuthenticatedRequest, UserToken } from "../typings/base.typings";
import { LoginStore } from "../utility/login.utils";
import { setCookie } from "../utility/base.utils";
import { logger } from "../utility/logger.utils";

export async function authenticate(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    if (req.path.includes("/api-docs")) {
      next();
      return;
    }
    const accessToken = req.cookies?.accessToken;
    const refreshToken = req.cookies?.refreshToken;
    const method = req.method;

    if (!accessToken && !refreshToken) {
      logger.warn("Unauthorized: No access or refresh token found in cookies", {
        method,
        path: req.url,
        ip: req.ip,
        timestamp: new Date().toISOString(),
      });
      res.status(401).json({
        message: "Unauthorized access, please login first",
        status: 401,
        path: req.url,
      });
      return;
    }

    if (accessToken) {
      try {
        const result = jwt.verify(accessToken, GlobalSettings.JWT_SECRET) as UserToken;
        req.userId = result.userId;
        req.role = result.role;

        logger.info("Access token verified successfully", {
          method,
          userId: req.userId,
          role: req.role,
          path: req.url,
          ip: req.ip,
          timestamp: new Date().toISOString(),
        });

        next();
        return;
      } catch (err) {
        logger.warn("Invalid access token", {
          method,
          error: err instanceof Error ? err.message : String(err),
          stack: err instanceof Error ? err.stack : undefined,
          path: req.url,
          ip: req.ip,
          timestamp: new Date().toISOString(),
        });
      }
    }

    if (refreshToken) {
      try {
        const result = await LoginStore.verifyuserToken(refreshToken);
        if (!result) {
          logger.warn("Invalid refresh token", {
            method,
            path: req.url,
            ip: req.ip,
            timestamp: new Date().toISOString(),
          });
          res.status(401).json({
            message: "Unauthorized access, please login first",
            status: 401,
            path: req.url,
          });
          return;
        }

        const userToken: UserToken = {
          userId: result.userId,
          role: result.role,
          createdAt: Date.now(),
        };

        const newAccessToken = jwt.sign(userToken, GlobalSettings.JWT_SECRET, { expiresIn: "10m" });
        setCookie(res, "accessToken", newAccessToken, 60 * 10 * 1000);
        req.userId = userToken.userId;
        req.role = userToken.role;

        logger.info("Refresh token verified; new access token issued", {
          method,
          userId: req.userId,
          role: req.role,
          path: req.url,
          ip: req.ip,
          timestamp: new Date().toISOString(),
        });

        next();
        return;
      } catch (err) {
        logger.error("Error verifying refresh token", {
          method,
          error: err instanceof Error ? err.message : String(err),
          stack: err instanceof Error ? err.stack : undefined,
          path: req.url,
          ip: req.ip,
          timestamp: new Date().toISOString(),
        });
        res.status(401).json({
          message: "Unauthorized access, please login first",
          status: 401,
          path: req.url,
        });
        return;
      }
    }

    // fallback, though logically unreachable
    logger.warn("Unauthorized request: no valid tokens provided", {
      method,
      path: req.url,
      ip: req.ip,
      timestamp: new Date().toISOString(),
    });
    res.status(401).json({
      message: "Unauthorized request, please login first",
      status: 401,
      path: req.url,
    });
    return;
  } catch (error) {
    logger.error("Internal server error in authentication middleware", {
      method: req.method,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      path: req.url,
      ip: req.ip,
      timestamp: new Date().toISOString(),
    });
    res.status(500).json({
      message: "Internal server error",
      status: 500,
      path: req.url,
    });
    return;
  }
}
