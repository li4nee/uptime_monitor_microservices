import { Request, Response, NextFunction } from "express";
import * as yup from "yup";
import { AuthenticatedRequest, CustomError } from "../typings/base.typings";

export async function validateDTO(DTO: yup.AnySchema, data: any) {
  await DTO.validate(data, { abortEarly: false });
}

export const Wrapper = (fn: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<any>) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req as AuthenticatedRequest, res, next)).catch(next);
  };
};

export function GlobalErrorHandler(err: Error, req: Request, res: Response, next: NextFunction) {
  console.log("ROUTE:", req.url, "METHOD:", req.method);
  console.log("ERROR MESSAGE :", err.message);
  console.log("ERROR STACK :", err.stack);
  if (err instanceof yup.ValidationError) {
    res.status(400).json({ message: err.errors });
    return;
  } else if (err instanceof CustomError) {
    let statusCode = err.statusCode;
    res.status(statusCode).json({ message: err.message });
    return;
  } else {
    res.status(500).json({ message: "Opps some unexpected error occured" });
    return;
  }
}

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
