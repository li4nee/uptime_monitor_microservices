import { Request, Response, NextFunction } from "express";
import * as yup from "yup";
import { CustomError } from "../typings/base.type";
export function GlobalErrorHandler(err: Error, req: Request, res: Response) {
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

export const generateId = (length: number = 20): string => {
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    result += characters.charAt(randomIndex);
  }
  return result;
};

export const Wrapper = (fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) => {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
};

export function getPaginationValues(
  page: number,
  limit: number,
): { page: number; limit: number; skip: number } {
  page = Math.max(0, page);
  limit = Math.min(Math.max(1, limit), 20);
  const skip = page * limit;
  return { page, limit, skip };
}
