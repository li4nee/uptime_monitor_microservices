import { Request, Response, NextFunction } from "express";
import * as yup from "yup";
import { AuthenticatedRequest, CustomError } from "../typings/base.type";
import path from "path";

export const generateId = (length: number = 20): string => {
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    result += characters.charAt(randomIndex);
  }
  return result;
};

export const Wrapper = (fn: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<any>) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req as AuthenticatedRequest, res, next)).catch(next);
  };
};

export function getPaginationValues(page: number, limit: number): { page: number; limit: number; skip: number } {
  page = Math.max(0, page);
  limit = Math.min(Math.max(1, limit), 20);
  const skip = page * limit;
  return { page, limit, skip };
}

export function normalizeUrl(url: string): string {
  if (!/^https?:\/\//i.test(url)) {
    url = "https://" + url;
  }
  return url;
}

export function checkIndexKeySchema(tableName: string, indexKey: string): string {
  return `
    SELECT indexname 
    FROM pg_indexes 
    WHERE tablename = '${tableName}' AND indexname = '${indexKey}'
  `;
}

export function normalizePath(filePath: string): string {
  return path.normalize(filePath).replace(/\/+$/, "");
}
