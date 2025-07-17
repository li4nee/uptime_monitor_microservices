import { Request, Response, NextFunction } from "express";
import * as jwt from "jsonwebtoken";
import { GlobalSettings } from "../globalSettings";
import { AuthenticatedRequest, UserToken } from "../typings/base.typings";
import { LoginStore } from "../utility/login.utils";
import { setCookie } from "../utility/base.utils";

export async function authenticate(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const accessToken = req.cookies?.accessToken;
    const refreshToken = req.cookies?.refreshToken;

    if (!accessToken && !refreshToken) {
      console.log("No access or refresh token found in cookies");
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
        next();
        return;
      } catch (err) {}
    }

    if (refreshToken) {
      try {
        const result = await LoginStore.verifyuserToken(refreshToken);
        if (!result) {
          console.log("Invalid refresh token");
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
        next();
        return;
      } catch (err) {
        console.log("Error verifying refresh token:", err);
        res.status(401).json({
          message: "Unauthorized access, please login first",
          status: 401,
          path: req.url,
        });
        return;
      }
    }

    res.status(401).json({
      message: "Unauthorized request, please login first",
      status: 401,
      path: req.url,
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
