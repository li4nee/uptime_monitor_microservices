import { Request, Response, NextFunction } from "express";
export class CustomError {
  statusCode: number;
  message: string | null;

  constructor(message: string, statusCode: number) {
    this.statusCode = statusCode;
    this.message = message;
  }
}

export class InvalidInputError extends CustomError {
  constructor(message: string = "Invalid input") {
    super(message, 400);
  }
}

export class PermissionNotGranted extends CustomError {
  constructor(messag: string = "Permission not granted") {
    super(messag, 403);
  }
}

export enum ROLE {
  ADMIN = "admin",
  USER = "user",
}

export interface UserToken {
  userId: string;
  role: ROLE;
  createdAt: number;
}

export interface AuthenticatedRequest extends Request {
  userId: string;
  role?: ROLE;
  accessToken?: string;
  refreshToken?: string;
}

export class DefaultResponse {
  status: number;
  message: string;
  data?: any;

  constructor(status: number, message: string, data?: any) {
    this.status = status;
    this.message = message;
    this.data = data;
  }
}
