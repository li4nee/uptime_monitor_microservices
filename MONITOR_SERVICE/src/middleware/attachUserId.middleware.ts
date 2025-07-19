import { NextFunction, Response, Request } from "express";
import { AuthenticatedRequest, ROLE } from "../typings/base.type";

export function attachProxiedUser(req: Request, res: Response, next: NextFunction) {
  try {
    const authReq = req as AuthenticatedRequest;
    const userId = req.headers["x-user-id-from-proxy"] as string;
    const userRole = req.headers["x-user-role-from-proxy"] as ROLE;
    if (userId) authReq.userId = userId;
    if (userRole) authReq.role = userRole;
    next();
    return;
  } catch (error) {
    console.log("Error in authentication middleware:", error);
    res.status(500).send("Internal Server Error");
    return;
  }
}
