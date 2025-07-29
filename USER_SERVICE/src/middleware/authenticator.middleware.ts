import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { AuthenticatedRequest, UserToken } from "../typings/base.typings";
import { logger } from "../utility/logger.utils";
import { GlobalSettings } from "../globalSettings";
import { LoginStore } from "../utility/login.utils";
import { setCookie } from "../utility/base.utils";
// make sure this path matches your actual logger file

export async function authenticate(req: Request, res: Response, next: NextFunction) {
  const authorizedRequest = req as AuthenticatedRequest;
  const accessToken = authorizedRequest.cookies?.accessToken;
  const refreshToken = authorizedRequest.cookies?.refreshToken;

  try {
    if (!accessToken && !refreshToken) {
      logger.warn("No tokens found", {
        method: req.method,
        path: req.url,
        ip: req.ip,
        headers: req.headers,
      });
      res.status(401).json({
        message: "Unauthorized access, please login first",
        status: 401,
        path: authorizedRequest.url,
      });
      return;
    }

    if (accessToken) {
      try {
        const result = jwt.verify(accessToken, GlobalSettings.JWT_SECRET) as UserToken;

        authorizedRequest.userId = result.userId;
        authorizedRequest.role = result.role;
        authorizedRequest.accessToken = accessToken;
        authorizedRequest.refreshToken = refreshToken;

        logger.info("Access token valid", {
          userId: result.userId,
          role: result.role,
          path: req.url,
          method: req.method,
          ip: req.ip,
        });

        next();
        return;
      } catch (err) {
        logger.warn("Invalid access token", {
          error: err,
          path: req.url,
          method: req.method,
          ip: req.ip,
        });
      }
    }

    if (refreshToken) {
      try {
        const result = await LoginStore.verifyuserToken(refreshToken);
        if (!result) {
          logger.warn("Invalid refresh token", {
            path: req.url,
            method: req.method,
            ip: req.ip,
          });
          res.status(401).json({
            message: "Unauthorized access, please login first",
            status: 401,
            path: authorizedRequest.url,
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

        authorizedRequest.userId = userToken.userId;
        authorizedRequest.role = userToken.role;
        authorizedRequest.refreshToken = refreshToken;
        authorizedRequest.accessToken = newAccessToken;

        logger.info("Refreshed access token", {
          userId: userToken.userId,
          role: userToken.role,
          path: req.url,
          method: req.method,
          ip: req.ip,
        });

        next();
        return;
      } catch (err) {
        logger.error("Refresh token verification failed", {
          error: err,
          path: req.url,
          method: req.method,
          ip: req.ip,
        });

        res.status(401).json({
          message: "Unauthorized access, please login first",
          status: 401,
          path: authorizedRequest.url,
        });
        return;
      }
    }

    logger.warn("Fallback unauthorized request", {
      path: req.url,
      method: req.method,
      ip: req.ip,
    });

    res.status(401).json({
      message: "Unauthorized request, please login first",
      status: 401,
      path: authorizedRequest.url,
    });

    return;
  } catch (error) {
    logger.error("Unhandled error in authenticate middleware", {
      error,
      path: req.url,
      method: req.method,
      ip: req.ip,
    });

    res.status(500).json({
      message: "Internal server error",
      status: 500,
      path: req.url,
    });
    return;
  }
}
