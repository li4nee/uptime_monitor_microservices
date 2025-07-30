import { Request, Response, NextFunction } from "express";
import * as yup from "yup";
import { AuthenticatedRequest } from "../typings/base.typings";

export async function validateDTO(DTO: yup.AnySchema, data: any) {
  await DTO.validate(data, { abortEarly: false });
}

export const Wrapper = (fn: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<any>) => {
  return (req: Request, res: Response, next: NextFunction) => {
    console.log(`Request received at ${req.method} ${req.originalUrl}`);
    Promise.resolve(fn(req as AuthenticatedRequest, res, next)).catch(next);
  };
};

export function setCookie(res: Response, name: string, value: string, time: number) {
  res.cookie(name, value, {
    maxAge: time,
    path: "/",
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    httpOnly: true,
  });
}

export function removeCookie(res: Response, name: string) {
  res.clearCookie(name, {
    path: "/",
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    httpOnly: true,
  });
}

export function generateOtp(length: number = 6): string {
  let otp = "";
  for (let i = 0; i < length; i++) {
    otp += Math.floor(Math.random() * 10).toString();
  }
  return otp;
}
