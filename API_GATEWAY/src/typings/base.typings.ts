import { Request } from "express";

export enum ROLE {
  ADMIN = "admin",
  USER = "user",
}
export interface AuthenticatedRequest extends Request {
  userId?: string
  role?:ROLE
}