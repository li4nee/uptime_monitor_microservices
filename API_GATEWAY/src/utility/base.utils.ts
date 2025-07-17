import { Request, Response, NextFunction } from "express";
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
