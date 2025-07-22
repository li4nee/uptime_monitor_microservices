import { Request, Response, NextFunction } from "express";
import * as jwt from "jsonwebtoken";
import { GlobalSettings } from "../globalSettings";
import { AuthenticatedRequest, UserToken } from "../typings/base.typings";
import { LoginStore } from "../utility/login.utility";
import { setCookie } from "../utility/base.utility";
export async function authenticate(req: Request, res: Response, next: NextFunction) {
  try {
    let authorizedRequest = req as AuthenticatedRequest;
    const accessToken = authorizedRequest.cookies?.accessToken;
    const refreshToken = authorizedRequest.cookies?.refreshToken;

    if (!accessToken && !refreshToken) {
      console.log("No access or refresh token found in cookies");
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
        next();
        return;
      } catch (err) {
        console.log("Invalid access token:", err);
      }
    }

    if (refreshToken) {
      try {
        const result = await LoginStore.verifyuserToken(refreshToken);
        if (!result) {
          console.log("Invalid refresh token");
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
        console.log(authorizedRequest.userId);
        next();
        return;
      } catch (err) {
        console.log("Error verifying refresh token:", err);
        res.status(401).json({
          message: "Unauthorized access, please login first",
          status: 401,
          path: authorizedRequest.url,
        });
        return;
      }
    }

    res.status(401).json({
      message: "Unauthorized request, please login first",
      status: 401,
      path: authorizedRequest.url,
    });
    return;
  } catch (error) {
    res.status(500).json({
      message: "Internal server error",
      status: 500,
      path: req.url,
    });
    return;
  }
}
