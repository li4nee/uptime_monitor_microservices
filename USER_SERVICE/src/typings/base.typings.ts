import { Request, Response, NextFunction } from "express";
export class CustomError {
  statusCode: number;
  message: string | null;
  logged: boolean;
  constructor(message: string, statusCode: number, logged: boolean = false) {
    this.statusCode = statusCode;
    this.message = message;
    this.logged = logged;
  }
}

export class InvalidInputError extends CustomError {
  constructor(message: string = "Invalid input", logged: boolean = false) {
    super(message, 400, logged);
  }
}

export class PermissionNotGranted extends CustomError {
  constructor(messag: string = "Permission not granted", logged: boolean = false) {
    super(messag, 403, logged);
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

export interface MailOptions {
  from: string;
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
}
